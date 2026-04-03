from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.tts_and_stt import text_to_speech, speech_to_text, save_uploaded_audio_file, transcribe_uploaded_file
from app.config import get_settings

router = APIRouter()

@router.post("/text_to_speech")
async def text_to_speech_endpoint(text: str = Form(...)):
    try:
        settings = get_settings()
        audio_path = text_to_speech(text)
        return {"audio_path": f"{settings.backend_base_url}/{audio_path}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text-to-speech conversion failed: {str(e)}")

@router.post("/speech_to_text")
async def speech_to_text_endpoint(audio_file: UploadFile = File(...)):
    try:
        transcribed_text = await transcribe_uploaded_file(audio_file)        
        return {"transcribed_text": transcribed_text}        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech-to-text conversion failed: {str(e)}")
