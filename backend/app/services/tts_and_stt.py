import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import get_llm
from langchain_core.prompts import ChatPromptTemplate
import os
import uuid
from gtts import gTTS
import whisper as whisper_lib

os.makedirs('static', exist_ok=True)

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
    ai_audio_path = f"static/{uuid.uuid4()}.mp3"
    tts = gTTS(normalized_text)
    tts.save(ai_audio_path)
    return ai_audio_path

def speech_to_text(filepath: str) -> str:
    model = whisper_lib.load_model("base")
    result = model.transcribe(filepath)
    return result["text"] if result and "text" in result else ""








def test_tts_and_stt():
    """Test TTS and STT functionality with sample audios."""
    
    # Test TTS
    print("Testing TTS (Text-to-Speech)...")
    test_text = "Hello, this is a test of the text-to-speech system. It should convert this text into audio."
    
    try:
        audio_path = text_to_speech(test_text)
        print(f"TTS successful! Audio saved to: {audio_path}")
    except Exception as e:
        print(f"TTS failed: {e}")
    
    # Test STT with sample audios
    print("\nTesting STT (Speech-to-Text) with sample audios...")
    sample_audio_dir = "sample_audios"
    
    if os.path.exists(sample_audio_dir):
        audio_files = [f for f in os.listdir(sample_audio_dir) if f.endswith('.mp3')]
        
        for audio_file in audio_files:
            audio_path = os.path.join(sample_audio_dir, audio_file)
            print(f"\nProcessing: {audio_file}")
            
            try:
                transcribed_text = speech_to_text(audio_path)
                print(f"Transcribed text: {transcribed_text}")
            except Exception as e:
                print(f"STT failed for {audio_file}: {e}")
    else:
        print(f"Sample audio directory '{sample_audio_dir}' not found.")

if __name__ == "__main__":
    test_tts_and_stt()
