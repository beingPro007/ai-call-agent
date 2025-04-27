import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();
const ELEVEN_KEY = process.env.ELEVENLABS_KEY;
if (!ELEVEN_KEY) throw new Error('Missing ELEVEN_KEY environment variable');

const FREE_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';


export async function synthesizeAndQueue(text) {
    try {
        const res = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${FREE_VOICE_ID}`,
            { text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.4, similarity_boost: 0.75 } },
            { headers: { 'xi-api-key': ELEVEN_KEY, 'Content-Type': 'application/json' }, responseType: 'arraybuffer' }
        );

        console.log("RESPONSE DATA", res.data);

        return res.data;
    } catch (err) {
        let msg = 'TTS failed';
        if (err.response?.data) {
            const detail = JSON.parse(Buffer.from(err.response.data).toString('utf-8')).detail;
            if (detail?.status === 'detected_unusual_activity') {
                msg = 'ElevenLabs free-tier disabled. Please upgrade to a paid plan or use a different IP/account.';
            } else {
                msg = detail?.message || msg;
            }
        }
        console.error('🛑 ElevenLabs Error:', msg);
    }
}