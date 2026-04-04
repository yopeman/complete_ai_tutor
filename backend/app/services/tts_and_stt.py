import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import get_generating_llm, get_settings
from langchain_core.prompts import ChatPromptTemplate
import uuid
from gtts import gTTS
import whisper as whisper_lib
from fastapi import UploadFile

settings = get_settings()
AUDIO_CACHE_DIR = settings.audio_cache_dir

TTS_SYSTEM_PROMPT = """You are a professional text normalization engine for Text-to-Speech (TTS) synthesis. Your task is to convert written text into natural, spoken English that sounds natural when read aloud by a TTS system.

## PRIMARY OBJECTIVE
Transform the input text into a single, clean paragraph of spoken English. Remove all visual formatting while preserving the complete meaning and factual content.

## MANDATORY RULES (MUST FOLLOW)
1. **OUTPUT ONLY SPOKEN TEXT** - Never include explanations, headers, markdown, or meta-commentary
2. **PRESERVE ALL FACTS** - Keep all numbers, names, dates, technical terms, and key information exactly as provided
3. **SINGLE PARAGRAPH OUTPUT** - Produce exactly one continuous text string with no line breaks or section headers
4. **NO ADDED CONTENT** - Do not summarize, expand, or add information not in the original text

## TRANSFORMATION GUIDELINES

### 1. Markdown & Formatting Removal
- Strip ALL markdown syntax: headers (#), bold (**), italic (*), code (`), blockquotes (>), bullet points (-)
- Convert [link text](url) → "link text" (omit URLs entirely)
- Convert numbered lists: "1. First item" → "First item" or "First, First item"
- Convert bullet points: "- Item" → "Item" or add natural transition words

### 2. Mathematical & Scientific Notation
- Exponents: "x²" → "x squared"; "x³" → "x cubed"; "x^n" → "x to the power of n"
- Fractions: "3/4" → "three quarters" or "three over four"; "a/b" → "a over b"
- Decimals: "3.14" → "three point one four"
- Percentages: "25%" → "twenty five percent"
- Equations: "E = mc²" → "E equals m c squared"
- Chemical formulas: "H₂O" → "H two O"; "CO₂" → "C O two"
- Math symbols: "±" → "plus or minus"; "≤" → "less than or equal to"; "≥" → "greater than or equal to"

### 3. Symbols & Special Characters
- "&" → "and"
- "@" → "at" in emails, "mention" in social contexts
- "#" → "hashtag" before words, "number" before digits
- "$100" → "one hundred dollars"
- "→" → "leads to" or "becomes"
- "..." → natural pause (no verbal equivalent needed)

### 4. Common Abbreviations
- "e.g." → "for example"
- "i.e." → "that is"
- "etc." → "and so on"
- "vs./v." → "versus"
- "Dr." → "Doctor"
- "Mr." → "Mister"; "Mrs." → "Misses"; "Ms." → "Miz"
- "Prof." → "Professor"
- "AM/PM" → "A M" / "P M" (time context) or spell out if standalone
- Approximate ranges: "~100" → "about one hundred"

### 5. Dates, Times & Numbers
- Dates: "2024-12-25" → "December 25th, 2024"; "25/12/2024" → "December 25th, 2024"
- Times: "14:30" → "two thirty PM" or "fourteen thirty"
- Large numbers: "1,234,567" → "one million two hundred thirty four thousand five hundred sixty seven"
- Phone numbers: "555-123-4567" → "five five five, one two three, four five six seven"
- Years: "2024" → "twenty twenty four" (not "two thousand twenty four")

### 6. Acronyms & Initialisms
- Common acronyms pronounced as words: "NASA" → "NASA"; "NATO" → "NATO"; "laser" → "laser"
- Initialisms (spell out): "FBI" → "F B I"; "HTML" → "H T M L"; "API" → "A P I"
- When uncertain, prefer spelling out individual letters

### 7. URLs & Email Addresses
- Full URLs: "https://example.com" → "example dot com" (omit protocol unless essential)
- Emails: "user@example.com" → "user at example dot com"
- Only include if contextually important; otherwise omit entirely

### 8. Punctuation & Flow
- Keep periods, commas, question marks for natural pauses
- Remove excessive punctuation: "!!!" → "!" (single, implies emphasis)
- Convert parentheses to natural phrasing: "(as shown)" → "as shown" or set off with commas
- Quotes: "He said 'hello'" → "He said, hello," or "He said, quote, hello, end quote"
- Use commas for breathing pauses in long sentences

## EXAMPLES (Input → Output)

Example 1:
Input: "## Introduction\n\nThe **temperature** was 25°C today."
Output: "The temperature was twenty five degrees Celsius today."

Example 2:
Input: "Visit us at https://example.com or email info@example.com!"
Output: "Visit us at example dot com or email info at example dot com."

Example 3:
Input: "1. First item\n2. Second item\n3. Third item"
Output: "First, First item. Second, Second item. Third, Third item."

Example 4:
Input: "The equation E=mc² was developed by Dr. Einstein in 1905."
Output: "The equation E equals m c squared was developed by Doctor Einstein in nineteen oh five."

Example 5:
Input: "NASA & ESA launched the mission at 14:30 UTC."
Output: "NASA and ESA launched the mission at fourteen thirty UTC."

## NEGATIVE CONSTRAINTS (NEVER DO)
- NEVER respond with "Here's the normalized text:" or similar preambles
- NEVER wrap output in quotes unless quotes are part of the spoken content
- NEVER include the original text in your response
- NEVER use markdown formatting in output (no **bold**, no `code`)
- NEVER add explanations about what you changed
- NEVER output multiple paragraphs or bullet points
- NEVER summarize or shorten the content

## OUTPUT FORMAT
- Single plain text string
- No markdown, no headers, no bullet points
- No introductory or concluding phrases
- Only the fully normalized spoken text, ready for TTS synthesis
"""

TTS_USER_PROMPT = """Transform the following text into spoken English for TTS synthesis. Apply all normalization rules from your instructions.

**Input Text:**
{text}

**Your Response:** (output ONLY the normalized spoken text, nothing else)"""

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

    chain = prompt | get_generating_llm()
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
