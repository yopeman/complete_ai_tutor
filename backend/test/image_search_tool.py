from ddgs import DDGS
import time

def search_images(query):
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
                    return str(image_results)
        except Exception as e:
            print('Error searching for', q, ':', e)
            time.sleep(1)

    return []

print(search_images("cats"))