import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import * as vad from "@ricky0123/vad-web";
import { Room, createLocalAudioTrack, LocalAudioTrack } from "livekit-client";

/**
 * useConversationLiveKit hook
 * ---------------------------
 * Manages:
 * 1. Recording state, LiveKit connection & mic publishing
 * 2. VAD → STT → AI → chunked TTS pipeline (only active when connected)
 */
export function useConversationLiveKit(roomName, backendUrl, liveKitUrl) {
  const [isRecording, setIsRecording] = useState(false); // track user toggle
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [loading, setLoading] = useState(false);

  const roomRef = useRef(null);
  const micTrackRef = useRef(null);
  const vadRef = useRef(null);

  // effect: respond to user toggling recording
  useEffect(() => {
    if (isRecording) {
      connectLiveKit();
    } else {
      disconnectLiveKit();
    }
  }, [isRecording]);

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

  // Split text into ~120-char sentence chunks
  const chunkText = (text, maxLen = 120) => {
    const regex = /([^.!?]+[.!?]+)\s*/g;
    const parts = text.match(regex) || [];
    const chunks = [];
    let buf = "";
    for (const sent of parts) {
      if ((buf + sent).length <= maxLen) buf += sent;
      else {
        chunks.push(buf.trim());
        buf = sent;
      }
    }
    if (buf) chunks.push(buf.trim());
    return chunks;
  };

  // === Connect ===
  const connectLiveKit = useCallback(async () => {
    if (isConnected || isConnecting) return;
    setIsConnecting(true);
    try {
      const { data } = await axios.get(`${backendUrl}/token?room=${roomName}`);
      const room = new Room();
      await room.connect(liveKitUrl, data.token, { autoSubscribe: true });
      roomRef.current = room;
      console.log("🎧 Connected to LiveKit", room);

      const micTrack = await createLocalAudioTrack();
      micTrackRef.current = micTrack;
      await room.localParticipant.publishTrack(micTrack, {
        red: true,
      });
      console.log("🔊 Mic track published");

      setIsConnected(true);
    } catch (err) {
      console.error("LiveKit connect error", err);
    } finally {
      setIsConnecting(false);
    }
  }, [backendUrl, liveKitUrl, roomName, isConnected, isConnecting]);

  // === Disconnect ===
  const disconnectLiveKit = useCallback(async () => {
    if (!isConnected || isDisconnecting) return;
    setIsDisconnecting(true);
    try {
      const room = roomRef.current;
      if (room && micTrackRef.current) {
        await room.localParticipant.unpublishTrack(micTrackRef.current);
        micTrackRef.current.stop();
        room.disconnect();
      }
      roomRef.current = null;
      setIsConnected(false);
      console.log("🛑 Disconnected from LiveKit");
    } catch (err) {
      console.error("LiveKit disconnect error", err);
    } finally {
      setIsDisconnecting(false);
    }
  }, [isConnected, isDisconnecting]);

  // === VAD → STT → AI → TTS pipeline (active only when connected) ===
  useEffect(() => {
    if (!isConnected) {
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
            const wav = float32ToWav(floatAudio, 16000);
            const file = new File([wav], "audio.wav");
            const form = new FormData();
            form.append("file", file);
            const url =
              process.env.NEXT_PUBLIC_ENV !== "production"
                ? "http://localhost:8000"
                : process.env.NEXT_PUBLIC_WHISPER_SERVER_URI;
            // const url = process.env.NEXT_PUBLIC_WHISPER_SERVER_URI;
            // STT
            const sttRes = await axios.post(`${url}/transcribe`, form, {
              headers: form.getHeaders?.() || {},
            });
            const text = sttRes.data.text;
            if (active) setResponseText(text);
            if (!text) return;

            // AI ask
            const aiRes = await axios.post(`${backendUrl}/ask-gemini`, {
              prompt: text,
            });
            const aiText = aiRes.data.text;
            console.log("AI text", aiText);

            if (active) setResponseText(aiText);

            // chunked TTS + optional LiveKit publish
            for (const chunk of chunkText(aiText)) {
              const ttsRes = await axios.get(`${backendUrl}/tts`, {
                params: { text: chunk },
                responseType: "arraybuffer",
              });

              console.log("TTS RES", ttsRes);

              // … inside your onSpeechEnd handler, for each chunk:
              const blob = new Blob([ttsRes.data], { type: "audio/mpeg" });
              const url = URL.createObjectURL(blob);
              const audioEl = new Audio(url);

              // 1) Create / resume AudioContext
              const AudioCtx = window.AudioContext || window.webkitAudioContext;
              const audioCtx = new AudioCtx();
              // (if your context is suspended due to autoplay policies)
              if (audioCtx.state === "suspended") {
                await audioCtx.resume();
              }

              // 2) Hook the audio element into Web Audio
              const sourceNode = audioCtx.createMediaElementSource(audioEl);
              const destinationNode = audioCtx.createMediaStreamDestination();

              // 3) Connect nodes
              sourceNode.connect(destinationNode);
              // If you also want it audible through speakers:
              sourceNode.connect(audioCtx.destination);

              // 4) Grab the actual MediaStreamTrack
              const [mediaStreamTrack] =
                destinationNode.stream.getAudioTracks() || [];

              if (!mediaStreamTrack) {
                console.warn(
                  "⚠️ No audio track available—skipping LiveKit publish"
                );
              } else {
                // 5) Build a LocalAudioTrack and publish
                const localTrack = new LocalAudioTrack(mediaStreamTrack);
                await roomRef.current.localParticipant.publishTrack(localTrack);

                // Clean up when playback ends
                audioEl.onended = async () => {
                  await roomRef.current.localParticipant.unpublishTrack(
                    localTrack
                  );
                  localTrack.stop();
                  audioCtx.close();
                  URL.revokeObjectURL(url);
                };
              }

              // 6) Play and wait for it to finish
              await new Promise((resolve) => {
                audioEl.onended = resolve;
                audioEl.play().catch(console.error);
              });
            }
          },
        });
        vadRef.current = vadInstance;
        vadInstance.start();
      } catch (err) {
        console.error("Pipeline setup error", err);
      }
    })();

    return () => {
      active = false;
      vadRef.current?.stop();
    };
  }, [isConnected, backendUrl]);

  return {
    isRecording,
    setIsRecording,
    isConnected,
    isConnecting,
    isDisconnecting,
    responseText,
    loading,
    connectLiveKit,
    disconnectLiveKit,
  };
}
