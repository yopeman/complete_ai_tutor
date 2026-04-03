
from googletrans import Translator, LANGUAGES
from typing import Optional, Dict
import asyncio

def translate_text(text: str, target_language: str = "en", source_language: str = "auto") -> Dict[str, str]:
    """
    Translate text to the target language.
    Useful for multilingual learners or understanding foreign terms.
    
    Args:
        text: The text to translate
        target_language: Target language code (e.g., 'en', 'es', 'fr')
        source_language: Source language code (default: 'auto' for auto-detection)
    
    Returns:
        Dictionary containing:
        - 'translated_text': The translated text
        - 'source_language': Detected/specified source language
        - 'target_language': Target language
        - 'confidence': Translation confidence (if available)
        - 'error': Error message if translation failed
    """
    try:
        translator = Translator()
        
        # Validate target language
        if target_language not in LANGUAGES and target_language != "auto":
            return {
                "translated_text": "",
                "source_language": "",
                "target_language": target_language,
                "confidence": 0,
                "error": f"Invalid target language code: {target_language}"
            }
        
        # Handle async translation
        try:
            # Try to run the async function
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If loop is already running, create a new one
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(asyncio.run, translator.translate(text, dest=target_language, src=source_language))
                    translation = future.result()
            else:
                translation = loop.run_until_complete(translator.translate(text, dest=target_language, src=source_language))
        except RuntimeError:
            # Fallback for when no event loop is available
            translation = asyncio.run(translator.translate(text, dest=target_language, src=source_language))
        
        return {
            "translated_text": translation.text,
            "source_language": translation.src,
            "target_language": target_language,
            "confidence": getattr(translation, 'confidence', None),
            "error": None
        }
        
    except Exception as e:
        return {
            "translated_text": "",
            "source_language": source_language,
            "target_language": target_language,
            "confidence": 0,
            "error": f"Translation failed: {str(e)}"
        }

def detect_language(text: str) -> Dict[str, str]:
    """
    Detect the language of the given text.
    
    Args:
        text: The text to analyze
    
    Returns:
        Dictionary containing:
        - 'language': Detected language code
        - 'language_name': Language name in English
        - 'confidence': Detection confidence
        - 'error': Error message if detection failed
    """
    try:
        translator = Translator()
        
        # Handle async detection
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If loop is already running, create a new one
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(asyncio.run, translator.detect(text))
                    detection = future.result()
            else:
                detection = loop.run_until_complete(translator.detect(text))
        except RuntimeError:
            # Fallback for when no event loop is available
            detection = asyncio.run(translator.detect(text))
        
        return {
            "language": detection.lang,
            "language_name": LANGUAGES.get(detection.lang, "Unknown"),
            "confidence": detection.confidence,
            "error": None
        }
        
    except Exception as e:
        return {
            "language": "",
            "language_name": "",
            "confidence": 0,
            "error": f"Language detection failed: {str(e)}"
        }

def get_supported_languages() -> Dict[str, str]:
    """
    Get a dictionary of supported language codes and their names.
    
    Returns:
        Dictionary mapping language codes to language names
    """
    return LANGUAGES.copy()


# ==================== TEST CODE ====================
if __name__ == "__main__":
    """
    Test code for the Google Translator Tool.
    Run this script directly to test all translation functions.
    """
    
    def test_translation():
        """Test basic translation functionality"""
        print("=== Translation Tests ===")
        
        # Test 1: Basic English to Spanish
        print("\n1. English to Spanish:")
        result = translate_text("Hello, how are you?", "am")
        print(f"   Input: 'Hello, how are you?'")
        print(f"   Output: {result['translated_text']}")
        print(f"   Source: {result['source_language']}")
        print(f"   Error: {result['error']}")
        
        # Test 2: English to French
        print("\n2. English to French:")
        result = translate_text("Good morning", "fr")
        print(f"   Input: 'Good morning'")
        print(f"   Output: {result['translated_text']}")
        print(f"   Source: {result['source_language']}")
        
        # Test 3: English to Chinese
        print("\n3. English to Chinese:")
        result = translate_text("Thank you very much", "zh-cn")
        print(f"   Input: 'Thank you very much'")
        print(f"   Output: {result['translated_text']}")
        
        # Test 4: Auto-detect source language
        print("\n4. Auto-detect source language:")
        result = translate_text("Bonjour le monde", "en")
        print(f"   Input: 'Bonjour le monde'")
        print(f"   Output: {result['translated_text']}")
        print(f"   Detected source: {result['source_language']}")
    
    def test_language_detection():
        """Test language detection functionality"""
        print("\n=== Language Detection Tests ===")
        
        test_texts = [
            "Hello world",
            "Bonjour le monde", 
            "Hola mundo",
            "Guten Tag",
            "こんにちは"
        ]
        
        for i, text in enumerate(test_texts, 1):
            print(f"\n{i}. Testing: '{text}'")
            result = detect_language(text)
            print(f"   Language: {result['language']}")
            print(f"   Name: {result['language_name']}")
            print(f"   Confidence: {result['confidence']}")
            if result['error']:
                print(f"   Error: {result['error']}")
    
    def test_simple_translation():
        """Test simple translation function"""
        print("\n=== Simple Translation Tests ===")
        
        test_cases = [
            ("Hello", "es"),
            ("Thank you", "fr"),
            ("Goodbye", "de"),
            ("Welcome", "ja")
        ]
        
        for i, (text, target_lang) in enumerate(test_cases, 1):
            print(f"\n{i}. '{text}' -> {target_lang}:")
            result = translate_with_formatting(text, target_lang)
            print(f"   Result: {result}")
    
    def test_error_handling():
        """Test error handling"""
        print("\n=== Error Handling Tests ===")
        
        # Test invalid target language
        print("\n1. Invalid target language:")
        result = translate_text("Hello", "invalid_lang")
        print(f"   Error: {result['error']}")
        
        # Test invalid source language
        print("\n2. Invalid source language:")
        result = translate_text("Hello", "es", "invalid_source")
        print(f"   Error: {result['error']}")
        
        # Test empty text
        print("\n3. Empty text:")
        result = translate_text("", "es")
        print(f"   Result: {result}")
    
    def test_supported_languages():
        """Test supported languages function"""
        print("\n=== Supported Languages Test ===")
        
        languages = get_supported_languages()
        print(f"Total supported languages: {len(languages)}")
        
        # Show some examples
        examples = ['en', 'es', 'fr', 'de', 'ja', 'zh', 'ar', 'ru']
        print("\nExample languages:")
        for code in examples:
            if code in languages:
                print(f"   {code}: {languages[code]}")
    
    def test_advanced_features():
        """Test advanced translation features"""
        print("\n=== Advanced Features Tests ===")
        
        # Test longer text
        print("\n1. Longer text translation:")
        long_text = "The quick brown fox jumps over the lazy dog. This is a common pangram used to test typography."
        result = translate_text(long_text, "fr")
        print(f"   Input length: {len(long_text)} chars")
        print(f"   Output length: {len(result['translated_text'])} chars")
        print(f"   Success: {result['error'] is None}")
        
        # Test multiple languages chain
        print("\n2. Language chain (English -> Spanish -> French):")
        step1 = translate_text("Beautiful day", "es")
        if not step1['error']:
            step2 = translate_text(step1['translated_text'], "fr", "es")
            print(f"   EN -> ES: {step1['translated_text']}")
            print(f"   ES -> FR: {step2['translated_text']}")
        else:
            print(f"   Chain failed: {step1['error']}")
    
    # Run all tests
    print("Google Translator Tool - Test Suite")
    print("=" * 50)
    
    try:
        test_translation()
        test_language_detection()
        test_simple_translation()
        test_error_handling()
        test_supported_languages()
        test_advanced_features()
        
        print("\n" + "=" * 50)
        print("✅ All tests completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Test suite failed with error: {e}")
        import traceback
        traceback.print_exc()
