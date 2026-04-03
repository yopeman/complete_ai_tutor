from youtube_search import YoutubeSearch
from typing import List, Dict

def youtube_search(query: str, max_results: int = 3) -> List[Dict[str, str]]:
    """
    Search YouTube for educational videos.
    Useful for finding video tutorials, lectures, and demonstrations.
    """
    try:
        results = YoutubeSearch(query, max_results=max_results).to_dict()
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
        return str(dict_results)
    except Exception as e:
        return f"YouTube search failed: {str(e)}"

if __name__ == '__main__':
    # Test YouTube search functionality
    print("=" * 60)
    print("Testing YouTube Search Tool")
    print("=" * 60)
    
    # Test searches
    test_queries = [
        "Python programming tutorial",
        "machine learning basics",
        "Ethiopian history"
    ]
    
    for query in test_queries:
        print(f"\n🔍 Searching for: {query}")
        print("-" * 40)
        
        try:
            results = youtube_search(query, max_results=2)
            
            print(results)
                    
        except Exception as e:
            print(f"❌ Test failed: {str(e)}")
    
    print("\n" + "=" * 60)
    print("YouTube Search Test Complete")
    print("=" * 60)
