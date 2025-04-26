import axios from "axios";


export async function getGeminiReply(prompt) {
    try {
        const res = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
            {
                contents: [{ parts: [{ text: prompt }] }],
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                ],
                generationConfig: {
                    temperature: 0.1,
                    topK: 1,
                    topP: 0.1,
                    maxOutputTokens: 10,
                },
            },
            { params: { key: process.env.GEMINI_API_KEY }, headers: { 'Content-Type': 'application/json' } }
        );
        return res.data.candidates[0]?.content?.parts[0]?.text || '';
    } catch (err) {
        console.error('Gemini error:', err?.response?.data || err.message);
        throw err;
    }
}
