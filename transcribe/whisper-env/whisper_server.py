# Requirements:
#   pip install fastapi uvicorn faster-whisper numpy soundfile python-multipart
#   Ensure FFmpeg is installed and in PATH (e.g., apt install ffmpeg or brew install ffmpeg)

import os
import subprocess
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

import numpy as np
from faster_whisper import WhisperModel

app = FastAPI()

# CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Maximize core usage
NUM_THREADS = os.cpu_count() or 1

# Load optimized Whisper model
# tiny.en for English-only, int8 for fastest CPU performance
# Falls back to int8 if int8_float16 is unsupported
try:
    model = WhisperModel(
        model_size_or_path="tiny.en",
        device="cpu",
        compute_type="int8_float16",
        cpu_threads=NUM_THREADS,
    )
except ValueError:
    model = WhisperModel(
        model_size_or_path="tiny.en",
        device="cpu",
        compute_type="int8",
        cpu_threads=NUM_THREADS,
    )


def ffmpeg_pipe_to_pcm(audio_bytes: bytes) -> np.ndarray:
    """
    Convert arbitrary audio bytes via ffmpeg to 16kHz mono PCM16 and return float32 ndarray.
    """
    cmd = [
        "ffmpeg", "-hide_banner", "-loglevel", "error",
        "-i", "pipe:0",
        "-f", "s16le",
        "-acodec", "pcm_s16le",
        "-ac", "1",
        "-ar", "16000",
        "pipe:1",
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE)
    pcm_data, _ = proc.communicate(audio_bytes)
    audio = np.frombuffer(pcm_data, dtype=np.int16).astype(np.float32) / 32768.0
    return audio


@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        # Read upload into memory
        data = await file.read()

        # Convert to numpy audio
        audio = ffmpeg_pipe_to_pcm(data)

        # Transcribe (greedy) from numpy array
        segments, _ = model.transcribe(
            audio,
            beam_size=1,
            word_timestamps=False,
        )

        # Combine segments
        text = " ".join(segment.text for segment in segments)
        return {"text": text}

    except Exception as e:
        return {"error": str(e)}
