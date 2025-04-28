// tts.js
import path from 'path';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

// 1) Point at your downloaded JSON key
const keyPath = path.join(process.cwd(), 'tts_google_key.json');

// 2) Initialize the client
const client = new TextToSpeechClient({ keyFilename: keyPath });

/**
 * synthesizeAndQueue(text)
 * ------------------------
 * Returns a Buffer of MP3-encoded audio for the given text.
 */
export async function synthesizeAndQueue(text) {
    if (!text) throw new Error('No text provided to TTS');

    const request = {
        input: { text },
        voice: {
            languageCode: 'en-US',
            name: 'en-US-Wavenet-F', // Youthful, clear, slightly higher-pitched
            ssmlGender: 'FEMALE',
        },
        audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.1,  // Slightly faster
            pitch: 2.0,         // Higher pitch for youthful tone
        },
    };

    const [response] = await client.synthesizeSpeech(request);
    return response.audioContent;
}

