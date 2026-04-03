
from langchain_community.tools import DuckDuckGoSearchRun
from typing import List, Dict
import asyncio

def web_search(query: str, max_results: int = 5) -> List[Dict[str, str]]:
    """
    Search the web for information using DuckDuckGo.
    
    Args:
        query: Search query string
        max_results: Maximum number of results to return (default: 5)
    
    Returns:
        List of dictionaries containing title and content for each result
    """
    try:
        search = DuckDuckGoSearchRun()
        results_text = search.run(query)
        return results_text        
    except Exception as e:
        return f"Search failed: {str(e)}"

def web_search_multiple(queries: List[str], max_results: int = 3) -> Dict[str, List[Dict[str, str]]]:
    """
    Run multiple web searches and return results for each query.
    
    Args:
        queries: List of search query strings
        max_results: Maximum results per query (default: 3)
    
    Returns:
        Dictionary mapping query to search results
    """
    results = {}
    for query in queries:
        results[query] = web_search(query, max_results)
    return str(results)

if __name__ == '__main__':
    # Test single search
    print("=" * 50)
    print("Testing single web search:")
    print("=" * 50)
    result = web_search('Ethiopian tourism', max_results=3)
    
    print(result)
    
    # Test multiple searches
    print("\n" + "=" * 50)
    print("Testing multiple web searches:")
    print("=" * 50)
    
    queries = ['Python programming', 'machine learning basics']
    multi_results = web_search_multiple(queries, max_results=2)
    
    print(multi_results)