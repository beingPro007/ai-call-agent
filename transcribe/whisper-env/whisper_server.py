import os
import subprocess
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (or replace with a list of specific frontend URLs)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

temp_dir = "temp_files"
if not os.path.exists(temp_dir):
    os.makedirs(temp_dir)

# Load Whisper model
model = WhisperModel("base", compute_type="int8")

def convert_to_wav(input_path, output_path):
    """Convert audio to WAV format with 16kHz sampling rate and mono channel."""
    print(f"Converting {input_path} to {output_path}...")
    command = [
        'ffmpeg', '-i', input_path, '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1', output_path
    ]
    subprocess.run(command, check=True)
    print(f"Conversion complete: {output_path}")

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    print("STT IS HERE")
    contents = await file.read()

    print(f"First 100 bytes: {contents[:100]}")

    temp_path = os.path.join(temp_dir, file.filename)
    converted_path = os.path.join(temp_dir, "temp_audio_converted.wav")

    with open(temp_path, "wb") as f:
        f.write(contents)

    try:
        convert_to_wav(temp_path, converted_path)

        if not os.path.exists(converted_path):
            print(f"File not found: {converted_path}")
            return {"error": "Converted audio file not found."}

        segments, _ = model.transcribe(converted_path)

        if not segments:
            print("No segments returned by Whisper.")
            return {"error": "Failed to transcribe audio."}

        transcription = " ".join(segment.text for segment in segments)

        return {"text": transcription}
    except Exception as e:
        print("Error during transcription:", e)
        return {"error": "Failed to process the audio"}
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        if os.path.exists(converted_path):
            os.remove(converted_path)
