import math
import asyncio
import json
from typing import List, Dict, Optional, Any
from langchain.tools import tool
from langchain_community.tools import DuckDuckGoSearchRun
from ddgs import DDGS
import time
from youtube_search import YoutubeSearch
from googletrans import Translator, LANGUAGES

@tool
def calculator(expression: str) -> str:
    """A simple calculator tool. Use this for math expressions. 
    Examples: '2 + 2', 'math.sqrt(16)', 'math.pi * 5**2'.
    """
    # Safe evaluation
    allowed_names = {k: v for k, v in math.__dict__.items() if not k.startswith("__")}
    allowed_names.update({"abs": abs, "round": round})
    
    try:
        # Use a restricted environment for eval
        result = eval(expression, {"__builtins__": {}}, allowed_names)
        return str(result)
    except Exception as e:
        return f"Error calculating the expression: {str(e)}"

@tool
def web_search(query: str) -> str:
    """Search the web for information about a topic using DuckDuckGo.
    Useful for finding current information, facts, and educational resources.
    """
    try:
        search = DuckDuckGoSearchRun()
        results_text = search.run(query)
        return results_text        
    except Exception as e:
        return f"Search failed: {str(e)}"

@tool
def image_search(query: str) -> str:
    """Search for images related to a topic.
    Returns a list of image titles and URLs.
    """
    queries = [query, f"{query} hd", f"{query} photo", f"{query} image"]

    for q in queries:
        try:
            with DDGS() as ddgs:
                results = list(ddgs.images(q, backend="lite", max_results=5))
                if results:
                    image_results = [
                        {
                            "title": result["title"],
                            "image_url": result["image"],
                            "source": result["source"]
                        }
                        for result in results
                    ]
                    return json.dumps(image_results, indent=2)
        except Exception as e:
            # We can log this but we try next query
            continue

    return "No images found for the given query."

@tool
def youtube_video_search(query: str) -> str:
    """Search for informational YouTube videos about a topic.
    Useful for finding tutorials, lectures, and visual demonstrations.
    """
    try:
        results = YoutubeSearch(query, max_results=3).to_dict()
        dict_results = [
            {
                "title": r["title"],
                "url": f"https://youtube.com/watch?v={r['id']}",
                "duration": r["duration"],
                "channel": r["channel"],
                "views": r.get("views", "N/A"),
            }
            for r in results
        ]
        return json.dumps(dict_results, indent=2)
    except Exception as e:
        return f"YouTube search failed: {str(e)}"

@tool
async def google_translator(text: str, target_language: str) -> str:
    """Translate text into the target language.
    Useful for multilingual students or explaining terms in their native language.
    Target language should be a language code (e.g., 'es', 'fr', 'am', 'zh-cn').
    """
    try:
        translator = Translator()
        
        # Validate target language
        if target_language not in LANGUAGES and target_language != "auto":
            return f"Error: Invalid target language code: {target_language}"
        
        # Since this is an async tool, we use the async translate method
        translation = await translator.translate(text, dest=target_language)
        
        result = {
            "translated_text": translation.text,
            "source_language": translation.src,
            "target_language": target_language
        }
        return json.dumps(result, indent=2)
        
    except Exception as e:
        return f"Translation failed: {str(e)}"

# Create a list of all tools for export
TUTOR_TOOLS = [
    calculator,
    web_search,
    image_search,
    youtube_video_search,
    google_translator
]
