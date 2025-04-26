import { useEffect, useRef } from 'react';
import axios from 'axios';
import * as vad from '@ricky0123/vad-web';

/**
 * Captures microphone audio, runs VAD, and sends high-confidence chunks to STT.
 * Calls onTranscription(text) when STT returns.
 * Usage: const { start, stop } = useMicCapture(isRecording, onTranscriptionCallback)
 */
export const useMicCapture = (isRecording, onTranscription) => {
    const vadRef = useRef(null);
    const float32ToWav = (samples, sr) => {
        const buf = new ArrayBuffer(44 + samples.length * 2);
        const dv = new DataView(buf);
        const write = (off, str) => [...str].forEach((c, i) => dv.setUint8(off + i, c.charCodeAt(0)));
        write(0, 'RIFF');
        dv.setUint32(4, 36 + samples.length * 2, true);
        write(8, 'WAVE'); write(12, 'fmt ');
        dv.setUint32(16, 16, true);
        dv.setUint16(20, 1, true);
        dv.setUint16(22, 1, true);
        dv.setUint32(24, sr, true);
        dv.setUint32(28, sr * 2, true);
        dv.setUint16(32, 2, true);
        dv.setUint16(34, 16, true);
        write(36, 'data');
        dv.setUint32(40, samples.length * 2, true);
        let offset = 44;
        for (let i = 0; i < samples.length; i++) {
            const s = Math.max(-1, Math.min(1, samples[i]));
            dv.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            offset += 2;
        }
        return new Blob([dv], { type: 'audio/wav' });
    };

    const chunkText = (text, maxLength = 100) => {
        const sentenceRegex = /([.!?,])\s+/;
        const sentences = text.split(sentenceRegex);
        let chunks = [];
        let chunk = '';

        sentences.forEach((sentence, index) => {
            const isPunctuation = index % 2 !== 0; // Odd indices are punctuation marks
            if (isPunctuation) {
                chunk += sentence + sentences[index + 1];
                if (chunk.length > maxLength) {
                    chunks.push(chunk.trim());
                    chunk = '';
                }
            }
        });

        if (chunk.trim()) {
            chunks.push(chunk.trim());
        }

        return chunks;
    };

    useEffect(() => {
        if (!isRecording) {
            vadRef.current?.stop();
            vadRef.current = null;
            return;
        }

        let isMounted = true;
        (async () => {
            try {
                const myVAD = await vad.MicVAD.new({
                    positiveSpeechThreshold: 0.85,
                    negativeSpeechThreshold: 0.70,
                    redemptionFrames: 12,
                    onSpeechStart: () => console.log('🎙️ Speech start'),
                    onSpeechEnd: async (float32Audio) => {
                        console.log('🗣️ Speech end, sending to STT');
                        const wavBlob = float32ToWav(float32Audio, 16000);
                        const file = new File([wavBlob], 'audio.wav');
                        const form = new FormData();
                        form.append('file', file);
                        try {
                            const res = await axios.post('http://localhost:3000/stt', form, {
                                headers: form.getHeaders ? form.getHeaders() : {},
                            });
                            const text = res.data.text;
                            console.log('📝 STT transcript:', text);

                            if (isMounted && onTranscription) {
                                onTranscription(text);

                                // Send text to AI and TTS
                                if (text) {
                                    try {
                                        
                                        const aiRes = await axios.post('http://localhost:3000/ask-gemini', { prompt: text });
                                        const aiText = aiRes.data.text;

                                        const aiChunks = chunkText(aiText);

                                        for (const chunk of aiChunks) {
                                            const ttsRes = await axios.get('http://localhost:3000/tts', {
                                                params: { text: chunk },
                                            });
                                            console.log("-----------TTS Response : ", ttsRes);
                                            
                                            await playTTS(ttsRes.data)
                                        }
                                    } catch (err) {
                                        console.error('AI or TTS error:', err);
                                    }
                                }
                            }
                        } catch (sttErr) {
                            console.error('STT error:', sttErr);
                            if (isMounted && onTranscription) onTranscription('');
                        }
                    },
                });

                if (!isMounted) return;
                vadRef.current = myVAD;
                await myVAD.start();
                console.log('✅ VAD started');
            } catch (err) {
                console.error('VAD init error:', err);
            }
        })();

        return () => {
            isMounted = false;
            vadRef.current?.stop();
            vadRef.current = null;
        };
    }, [isRecording, onTranscription]);

    return {};
};


