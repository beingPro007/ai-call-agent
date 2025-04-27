"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import {
  connect,
  createLocalAudioTrack,
  LocalAudioTrack,
  Room,
} from "livekit-client";

// Dynamically load the VAD library only on the client
const MicVAD = dynamic(
  () => import("@ricky0123/vad-web").then((mod) => mod.MicVAD),
  { ssr: false }
);

/**
 * useConversationLiveKit hook
 * Manages:
 *  1. LiveKit connection + mic publishing
 *  2. VAD → STT → AI → chunked TTS → optional LiveKit TTS
 */
export function useConversationLiveKit(roomName, backendUrl, liveKitUrl) {
  const [isRecording, setIsRecording] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [loading, setLoading] = useState(false);

  const roomRef = useRef(/**<Room|null>*/ null);
  const vadRef = useRef(null);
  const micTrackRef = useRef(null);

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

  // Split AI text into ~120-char sentence chunks
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

  // Connect & publish mic to LiveKit
  const connectLiveKit = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/token?room=${roomName}`);
      const room = new Room();
      const connected = await room.connect(liveKitUrl, data.token, {
        autoSubscribe: true,
      });
      roomRef.current = connected;

      const micTrack = await createLocalAudioTrack();
      micTrackRef.current = micTrack;
      await connected.localParticipant.publishTrack(micTrack);
      setLoading(false);
    } catch (err) {
      console.error("LiveKit connect error", err);
      setLoading(false);
    }
  }, [roomName, backendUrl, liveKitUrl]);

  // Disconnect & cleanup LiveKit
  const disconnectLiveKit = useCallback(() => {
    const room = roomRef.current;
    if (room) {
      if (micTrackRef.current) {
        room.localParticipant.unpublishTrack(micTrackRef.current);
        micTrackRef.current.stop();
      }
      room.disconnect();
      roomRef.current = null;
    }
  }, []);

  // Handle recording toggle
  useEffect(() => {
    if (isRecording) {
      connectLiveKit();
    } else {
      disconnectLiveKit();
    }
    return () => disconnectLiveKit();
  }, [isRecording, connectLiveKit, disconnectLiveKit]);

  // Main pipeline: VAD → STT → AI → chunked TTS (all in client useEffect)
  useEffect(() => {
    if (!isRecording || !MicVAD) {
      vadRef.current?.stop();
      return;
    }

    let active = true;
    (async () => {

      // Start VAD
      const vadInstance = await MicVAD.new({
        positiveSpeechThreshold: 0.85,
        negativeSpeechThreshold: 0.7,
        redemptionFrames: 12,
        onSpeechStart: () => console.log("🎙️ Speech start"),
        onSpeechEnd: async (floatAudio) => {
          console.log("🗣️ Speech end, sending for STT");
          const wavBlob = float32ToWav(floatAudio, 16000);
          const file = new File([wavBlob], "audio.wav");
          const form = new FormData();
          form.append("file", file);

          // Determine server URL
          const base =
            process.env.NODE_ENV !== "production"
              ? "http://localhost:8001"
              : process.env.NEXT_PUBLIC_WHISPER_SERVER_URI;

          // STT request
          const sttRes = await axios.post(`${base}/transcribe`, form, {
            headers: form.getHeaders?.(),
          });
          const userText = sttRes.data.text;
          if (!active) return;
          setResponseText(userText);

          // AI request
          const aiRes = await axios.post(`${backendUrl}/ask-gemini`, {
            prompt: userText,
          });
          const aiText = aiRes.data.text;
          if (!active) return;
          setResponseText(aiText);

          // Chunked TTS playback & optional LiveKit
          const chunks = chunkText(aiText);
          for (const chunk of chunks) {
            // Fetch TTS audio
            const ttsRes = await axios.get(`${backendUrl}/tts`, {
              params: { text: chunk },
              responseType: "arraybuffer",
            });
            const blob = new Blob([ttsRes.data], { type: "audio/mpeg" });
            // All Audio logic in client‐only code
            if (typeof window !== "undefined") {
              const audioEl = new Audio(URL.createObjectURL(blob));
              // Publish to LiveKit if connected
              if (roomRef.current) {
                const stream = audioEl.captureStream();
                const track = new LocalAudioTrack(stream.getAudioTracks()[0]);
                await roomRef.current.localParticipant.publishTrack(track);
                audioEl.onended = async () => {
                  await roomRef.current.localParticipant.unpublishTrack(track);
                };
              }
              await new Promise((res) => {
                audioEl.onended = res;
                audioEl.play().catch(console.error);
              });
            }
          }
        },
      });
      vadRef.current = vadInstance;
      vadInstance.start();
    })();

    return () => {
      vadRef.current?.stop();
    };
  }, [isRecording, backendUrl]);

  return {
    isRecording,
    setIsRecording,
    responseText,
    loading,
  };
}
