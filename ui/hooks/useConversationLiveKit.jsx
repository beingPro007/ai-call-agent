import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import * as vad from "@ricky0123/vad-web";
import {
  connect,
  createLocalAudioTrack,
  LocalAudioTrack,
  Room,
} from "livekit-client";

/**
 * useConversationLiveKit hook
 * ---------------------------
 * Manages:
 * 1. LiveKit connection and publishing local mic track.
 * 2. VAD-driven STT → AI → chunked TTS pipeline with optional LiveKit streaming of AI TTS.
 *
 * @param {string} roomName   - LiveKit room to join
 * @param {string} backendUrl - Base URL of your backend API
 * @param {string} liveKitUrl - WebSocket URL of LiveKit server
 */
export function useConversationLiveKit(roomName, backendUrl, liveKitUrl) {
  const [isRecording, setIsRecording] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [loading, setLoading] = useState(false);

  const roomRef = useRef(null);
  const vadRef = useRef(null);
  const micTrackRef = useRef(null);
  const ttsTrackRef = useRef(null);

  // Convert Float32 frames → WAV Blob
  const float32ToWav = (samples, sr) => {
    const buf = new ArrayBuffer(44 + samples.length * 2);
    const dv = new DataView(buf);
    const write = (off, str) =>
      [...str].forEach((c, i) => dv.setUint8(off + i, c.charCodeAt(0)));
    write(0, "RIFF");
    dv.setUint32(4, 36 + samples.length * 2, true);
    write(8, "WAVE");
    write(12, "fmt ");
    dv.setUint32(16, 16, true);
    dv.setUint16(20, 1, true);
    dv.setUint16(22, 1, true);
    dv.setUint32(24, sr, true);
    dv.setUint32(28, sr * 2, true);
    dv.setUint16(32, 2, true);
    dv.setUint16(34, 16, true);
    write(36, "data");
    dv.setUint32(40, samples.length * 2, true);
    let offset = 44;
    for (const s of samples) {
      const val = Math.max(-1, Math.min(1, s));
      dv.setInt16(offset, val < 0 ? val * 0x8000 : val * 0x7fff, true);
      offset += 2;
    }
    return new Blob([dv], { type: "audio/wav" });
  };

  // Split text into sentence-based chunks (~120 chars)
  const chunkText = (text, maxLen = 120) => {
    const regex = /([^.!?]+[.!?]+)\s*/g;
    const parts = text.match(regex) || [];
    const chunks = [];
    let buf = "";
    for (const sent of parts) {
      if ((buf + sent).length <= maxLen) {
        buf += sent;
      } else {
        chunks.push(buf.trim());
        buf = sent;
      }
    }
    if (buf) chunks.push(buf.trim());
    return chunks;
  };

  // Connect to LiveKit and publish mic
  const connectLiveKit = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/token?room=${roomName}`);
      const room = new Room();

      const createdRoom = await room.connect(liveKitUrl, data.token, {
        autoSubscribe: true,
      });
      roomRef.current = createdRoom;
      console.log("🎧 Connected to LiveKit", room);

      const micTrack = await createLocalAudioTrack();
      micTrackRef.current = micTrack;
      await room.localParticipant.publishTrack(micTrack);
      console.log("🔊 Mic track published");
    } catch (err) {
      console.error("LiveKit connect error", err);
    }
  }, [roomName, backendUrl, liveKitUrl]);

  // Disconnect LiveKit and cleanup
  const disconnectLiveKit = useCallback(() => {
    const room = roomRef.current;
    if (room) {
      if (micTrackRef.current) {
        room.localParticipant.unpublishTrack(micTrackRef.current);
        micTrackRef.current.stop();
      }
      room.disconnect();
      roomRef.current = null;
      console.log("🛑 Disconnected from LiveKit");
    }
  }, []);

  // Effect: manage LiveKit on recording toggle
  useEffect(() => {
    if (isRecording) {
      connectLiveKit();
    } else {
      disconnectLiveKit();
    }
    return () => disconnectLiveKit();
  }, [isRecording, connectLiveKit, disconnectLiveKit]);

  // Main pipeline: VAD → STT → AI → chunked TTS
  useEffect(() => {
    if (!isRecording) {
      vadRef.current?.stop();
      return;
    }

    let active = true;
    (async () => {
      try {
        const vadInstance = await vad.MicVAD.new({
          positiveSpeechThreshold: 0.85,
          negativeSpeechThreshold: 0.7,
          redemptionFrames: 12,
          onSpeechStart: () => console.log("🎙️ Speech start"),
          onSpeechEnd: async (floatAudio) => {
            console.log("🗣️ Speech end, sending to STT");
            const wavBlob = float32ToWav(floatAudio, 16000);
            const file = new File([wavBlob], "audio.wav");
            const form = new FormData();
            form.append("file", file);

            // STT
            const sttRes = await axios.post(`${backendUrl}/stt`, form, {
              headers: form.getHeaders ? form.getHeaders() : {},
            });
            const text = sttRes.data.text;
            console.log("📝 Transcript:", text);
            if (active) setResponseText(text);
            if (!text) return;

            // AI
            const aiRes = await axios.post(`${backendUrl}/ask-gemini`, {
              prompt: text,
            });
            const aiText = aiRes.data.text;
            console.log("💬 AI:", aiText);
            if (active) setResponseText(aiText);

            // TTS chunked playback
            const chunks = chunkText(aiText);
            for (const chunk of chunks) {
              const ttsRes = await axios.get(`${backendUrl}/tts`, {
                params: { text: chunk },
                responseType: "arraybuffer",
              });
              const blob = new Blob([ttsRes.data], { type: "audio/mpeg" });
              const url = URL.createObjectURL(blob);
              const audioEl = new Audio(url);

              // Optionally publish AI TTS to LiveKit
              if (roomRef.current) {
                const mediaStream = audioEl.captureStream();
                const mediaTrack = mediaStream.getAudioTracks()[0];
                const aiTrack = new LocalAudioTrack(mediaTrack);
                await roomRef.current.localParticipant.publishTrack(aiTrack);
                console.log("🔊 Published AI TTS track");
                audioEl.onended = async () => {
                  await roomRef.current.localParticipant.unpublishTrack(
                    aiTrack
                  );
                };
              }

              // Play and wait for end
              await new Promise((res) => {
                audioEl.onended = res;
                audioEl.play().catch(console.error);
              });
            }
          },
        });
        vadRef.current = vadInstance;
        vadInstance.start();
        console.log("✅ VAD started");
      } catch (err) {
        console.error("Pipeline setup error", err);
      }
    })();

    return () => {
      active = false;
      vadRef.current?.stop();
    };
  }, [isRecording, backendUrl]);

  return { isRecording, setIsRecording, responseText, loading };
} 