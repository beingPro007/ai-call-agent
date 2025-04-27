import os
import subprocess
import tempfile
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Whisper model (tiny model for faster performance)
model = WhisperModel("tiny", compute_type="int8")

def convert_to_wav(input_path, output_path):
    """Convert audio to WAV format (16kHz mono) using ultrafast preset."""
    print(f"Converting {input_path} to {output_path}...")
    command = [
        'ffmpeg', '-y', '-i', input_path, 
        '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1',
        '-preset', 'ultrafast',
        output_path
    ]
    subprocess.run(command, check=True)
    print(f"Conversion complete: {output_path}")

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        # Save uploaded file to a temp file directly without loading fully in memory
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_input:
            while chunk := await file.read(1024):
                temp_input.write(chunk)
            temp_input_path = temp_input.name

        # Prepare another temp file for converted audio
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_output:
            temp_output_path = temp_output.name

        # Convert input file to WAV
        convert_to_wav(temp_input_path, temp_output_path)

        # Transcribe
        segments, _ = model.transcribe(temp_output_path)

        if not segments:
            print("No segments returned.")
            return {"error": "No transcription generated."}

        transcription = " ".join(segment.text for segment in segments)
        print("Transcription successful.")
        return {"text": transcription}

    except Exception as e:
        print(f"Error during transcription: {e}")
        return {"error": "Failed to process audio."}

    finally:
        # Cleanup temp files
        for path in [locals().get('temp_input_path'), locals().get('temp_output_path')]:
            if path and os.path.exists(path):
                os.remove(path)
