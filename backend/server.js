import fastify from 'fastify';
import cors from '@fastify/cors';
import staticPlugin from '@fastify/static';
import multipart from '@fastify/multipart';
import dotenv from 'dotenv';
import axios from 'axios';
import FormData from 'form-data';
import { AccessToken } from 'livekit-server-sdk';
import { synthesizeAndQueue } from './tts.js';
import { getGeminiReply } from './gemini.js';

dotenv.config();

const app = fastify({ logger: true });

// Enable CORS for all routes
await app.register(cors, { origin: '*' });

// Support file uploads for STT
await app.register(multipart);

// 1. LiveKit token endpoint
app.get('/token', async (req, reply) => {
    const identity = req.query.identity || `user_${Date.now()}`;
    const roomName = req.query.room || 'Duply-Talk-rdx';

    const at = new AccessToken(
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET,
        { identity }
    );
    const grant = {
        roomJoin: true,
        room: roomName
    }
    at.addGrant(grant);

    const tokenGenerated = await at.toJwt()
    console.log("TOKEN", tokenGenerated);

    reply.send({ token: tokenGenerated, identity, roomName });
});

// 2. Speech-to-Text endpoint
app.post('/stt', async (req, reply) => {
    try {
        const parts = await req.file();
        const form = new FormData();
        form.append('file', parts.file, { filename: parts.filename });

        const url = process.env.NODE_ENV !== "production"
            ? "*"
            : process.env.ONRENDER_WHISPER_SERVER_URI || "https://zombiefile.vercel.app";

        
        const sttRes = await axios.post(
            process.env.ONRENDER_WHISPER_SERVER_URI,
            form,
            { headers: form.getHeaders() }
        );
        reply.send({ text: sttRes.data.text });
    } catch (err) {
        app.log.error('STT error', err);
        reply.code(500).send({ error: 'STT failed' });
    }
});

// 3. AI text endpoint (Gemini)
app.post('/ask-gemini', async (req, reply) => {
    try {
        const { prompt } = req.body;
        const aiText = await getGeminiReply(prompt);
        reply.send({ text: aiText });
    } catch (err) {
        app.log.error('Gemini error', err);
        reply.code(500).send({ error: 'AI generation failed' });
    }
});

// 4. Text-to-Speech endpoint (returns URL to MP3)
app.get('/tts', async (req, reply) => {
    const text = req.query.text;
    if (!text) {
        return reply.code(400).send({ error: 'Missing text parameter' });
    }
    try {
        const audioBuffer = await synthesizeAndQueue(text);

        // 5) Send back raw MP3 bytes
        reply
            .header('Content-Type', 'audio/mpeg')
            .send(audioBuffer);
    } catch (err) {
        app.log.error('TTS error', err);
        reply.code(500).send({ error: 'TTS synthesis failed' });
    }
});


// Start server
const PORT = process.env.PORT || 10000;

app.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }
    app.log.info(`Server listening at ${address}`);
});
