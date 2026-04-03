#!/usr/bin/env python3
"""
Simple test script for TTS and STT functionality without LLM dependencies.
"""

import os
import uuid
from gtts import gTTS
import whisper as whisper_lib

def simple_text_to_speech(text: str, output_dir: "static") -> str:
    """
    Convert text to speech using gTTS.
    """
    os.makedirs(output_dir, exist_ok=True)
    audio_path = f"{output_dir}/{uuid.uuid4()}.mp3"
    tts = gTTS(text)
    tts.save(audio_path)
    return audio_path

def simple_speech_to_text(filepath: str) -> str:
    """
    Convert speech to text using Whisper.
    """
    model = whisper_lib.load_model("base")
    result = model.transcribe(filepath)
    return result["text"] if result and "text" in result else ""

def test_tts_and_stt():
    """Test TTS and STT functionality with sample audios."""
    
    # Test TTS
    print("Testing TTS (Text-to-Speech)...")
    test_text = "Hello, this is a test of the text-to-speech system. It should convert this text into audio."
    
    try:
        audio_path = simple_text_to_speech(test_text, "static")
        print(f"TTS successful! Audio saved to: {audio_path}")
        
        # Test STT on the generated audio
        print("Testing STT on generated audio...")
        transcribed_text = simple_speech_to_text(audio_path)
        print(f"Original text: {test_text}")
        print(f"Transcribed text: {transcribed_text}")
        
    except Exception as e:
        print(f"TTS/STT test failed: {e}")
    
    # Test STT with sample audios
    print("\nTesting STT (Speech-to-Text) with sample audios...")
    sample_audio_dir = "test/sample_audios"
    
    if os.path.exists(sample_audio_dir):
        audio_files = [f for f in os.listdir(sample_audio_dir) if f.endswith('.mp3')]
        
        for audio_file in audio_files:
            audio_path = os.path.join(sample_audio_dir, audio_file)
            print(f"\nProcessing: {audio_file}")
            
            try:
                transcribed_text = simple_speech_to_text(audio_path)
                print(f"Transcribed text: {transcribed_text}")
            except Exception as e:
                print(f"STT failed for {audio_file}: {e}")
    else:
        print(f"Sample audio directory '{sample_audio_dir}' not found.")

if __name__ == "__main__":
    test_tts_and_stt()
