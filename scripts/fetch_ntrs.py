"""
NASA Technical Reports Server (NTRS) Discovery Tool.
Queries the open NTRS REST API for microgravity combustion research citations.
API Docs: https://ntrs.nasa.gov/api/openapi/
"""

import urllib.request
import urllib.parse
import json
import sys

NTRS_SEARCH_API = "https://ntrs.nasa.gov/api/citations/search"

def search_ntrs(query: str, max_results: int = 5):
    params = {
        "q": query,
        "page": {
            "size": max_results,
            "from": 0
        }
    }
    
    url = f"{NTRS_SEARCH_API}?q={urllib.parse.quote(query)}&page.size={max_results}"
    print(f"Querying NTRS API: {url}")
    
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "IGNIS-NASA-SpaceApps-Researcher/1.0"}
    )
    
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            results = data.get("results", [])
            print(f"Found {len(results)} citations:")
            for item in results:
                title = item.get("title")
                cit_id = item.get("id")
                pub_date = item.get("publicationDate", "N/A")
                print(f"  - [{cit_id}] ({pub_date}): {title}")
            return results
    except Exception as e:
        print(f"NTRS query error: {e}", file=sys.stderr)
        return []

if __name__ == "__main__":
    q = sys.argv[1] if len(sys.argv) > 1 else "microgravity flame spread Saffire"
    search_ntrs(q)
