import os
import subprocess
from fastapi import FastAPI, File, UploadFile
from faster_whisper import WhisperModel

app = FastAPI()

# Define the directory where temp files will be saved
temp_dir = "temp_files"  # This is the folder to store the temp files
if not os.path.exists(temp_dir):
    os.makedirs(temp_dir)  # Create the directory if it doesn't exist

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


    # Define the full file paths
    temp_path = os.path.join(temp_dir, file.filename)  # Save the file with its original name
    converted_path = os.path.join(temp_dir, "temp_audio_converted.wav")
    
    # Write the audio chunk to the temporary file
    with open(temp_path, "wb") as f:
        f.write(contents)
    
    try:
        # Convert to WAV format before passing it to Whisper
        convert_to_wav(temp_path, converted_path)

        # Check if the file exists after conversion
        if os.path.exists(converted_path):
            print(f"File exists: {converted_path}")
        else:
            print(f"File not found: {converted_path}")
            return {"error": "Converted audio file not found."}

        # Transcribe the converted audio file
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
        # Ensure the temporary audio file is deleted
        if os.path.exists(temp_path):
            os.remove(temp_path)
        if os.path.exists(converted_path):
            os.remove(converted_path)
