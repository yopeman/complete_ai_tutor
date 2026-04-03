import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import get_settings, get_llm
from langchain_core.prompts import ChatPromptTemplate
import uuid
from gtts import gTTS
import whisper as whisper_lib
from fastapi import UploadFile

settings = get_settings()
AUDIO_CACHE_DIR = settings.audio_cache_dir

TTS_SYSTEM_PROMPT = """
You are a professional text normalization engine for Text-to-Speech synthesis.

# CRITICAL RULES:
1. **Output ONLY the normalized spoken text** - no explanations, no comments, no meta-text
2. **Preserve original meaning and factual content** - do not alter numerical values, names, or key information
3. **Convert everything to natural spoken English** - as if read aloud by a human

# SPECIFIC CONVERSION GUIDELINES:

## 1. MARKDOWN & FORMATTING
- Remove ALL markdown: # headers, **bold**, *italic*, `code`, > quotes, - lists
- Convert markdown links: [text](url) → "text" (skip reading URLs)
- Convert bullet points to natural speech: "- item" → "item" or "first, item"

## 2. MATHEMATICAL & SCIENTIFIC NOTATION
- Superscripts: X^n → "X to the power of n" or "X to the n"
- Fractions: a/b → "a over b" or "a divided by b"
- Decimals: 3.14 → "three point one four"
- Percentages: 25% → "twenty five percent"
- Equations: E=mc² → "E equals m c squared"
- Chemical formulas: H₂O → "H two O"

## 3. SYMBOLS & ABBREVIATIONS
- & → "and"
- @ → "at" (in emails) or "mention" (in social contexts)
- # → "hashtag" or "number" (context dependent)
- $ → "dollar" or "dollars"
- → (arrow) → "to" or "leads to"
- ± → "plus or minus"
- ≤ → "less than or equal to"
- Common abbreviations:
  - e.g. → "for example"
  - i.e. → "that is"
  - etc. → "and so on"
  - vs. → "versus"
  - Dr. → "Doctor"
  - Mr./Mrs. → "Mister" / "Misses"
  - AM/PM → "A M" / "P M"

## 4. PUNCTUATION & STRUCTURE
- Keep essential punctuation for natural pauses: commas, periods, question marks
- Remove excessive punctuation: !!! → "!" → spoken with emphasis
- Convert parentheses to natural speech: (like this) → "like this" or pause before/after
- Handle quotes: "text" → "quote text end quote" or natural intonation

## 5. SPECIAL CASES
- Dates: 2024-12-25 → "December 25th, 2024"
- Times: 14:30 → "two thirty PM" or "fourteen thirty"
- URLs/emails: Read character by character if essential, otherwise skip
- Acronyms: NASA → "N A S A" (if common), otherwise spell out
- Numbers: 1,234 → "one thousand two hundred thirty four"

## 6. TONE & FLOW
- Make text conversational and flowing
- Adjust spacing for natural breathing pauses
- Remove redundant formatting artifacts
- Maintain paragraph breaks for logical sections

# OUTPUT FORMAT:
- Single plain text string
- No markdown
- No instructions or commentary
- Only the normalized spoken version
"""

TTS_USER_PROMPT = "Convert this text to natural spoken English for TTS:\n\n{text}"

def normalize_text_for_tts(text: str) -> str:
    """
    Normalize raw text (markdown, math, abbreviations, symbols)
    into clean, natural, spoken text for TTS systems.
    """

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", TTS_SYSTEM_PROMPT),
            ("user", TTS_USER_PROMPT),
        ]
    )

    chain = prompt | get_llm()
    response = chain.invoke({"text": text})
    return response.content.strip()

def text_to_speech(text: str) -> str:
    normalized_text = normalize_text_for_tts(text)
    ai_audio_path = f"{AUDIO_CACHE_DIR}/{uuid.uuid4()}.mp3"
    tts = gTTS(normalized_text)
    tts.save(ai_audio_path)
    return ai_audio_path

def speech_to_text(filepath: str) -> str:
    model = whisper_lib.load_model("base")
    result = model.transcribe(filepath)
    return result["text"] if result and "text" in result else ""

async def save_uploaded_audio_file(audio_file: UploadFile) -> str:
    """
    Save uploaded audio file to local disk and return the file path.
    
    Args:
        audio_file: The uploaded audio file
        
    Returns:
        str: The path to the saved file
        
    Raises:
        ValueError: If the file is not an audio file
    """
    # Validate file type
    if not audio_file.content_type.startswith('audio/'):
        raise ValueError("File must be an audio file")
    
    # Get file extension from original filename or default to .wav
    file_extension = os.path.splitext(audio_file.filename)[1]
    if not file_extension:
        file_extension = ".wav"
    
    # Generate unique filename
    temp_filename = f"{uuid.uuid4()}{file_extension}"
    temp_filepath = os.path.join(AUDIO_CACHE_DIR, temp_filename)
    
    # Save the uploaded file
    with open(temp_filepath, "wb") as buffer:
        content = await audio_file.read()
        buffer.write(content)
    
    return temp_filepath

async def transcribe_uploaded_file(audio_file: UploadFile) -> str:
    """
    Transcribe an uploaded audio file using Whisper.
    
    Args:
        audio_file: The uploaded audio file
        
    Returns:
        str: The transcribed text
    """
    # Save the uploaded file
    temp_filepath = await save_uploaded_audio_file(audio_file)
    
    # Transcribe the file
    transcribed_text = speech_to_text(temp_filepath)
    
    return transcribed_text
