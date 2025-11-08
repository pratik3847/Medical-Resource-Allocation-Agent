from fastapi.testclient import TestClient
from backend.main import app
import json


def run():
    client = TestClient(app)
    queries = [
        ("shortage", 3),
        ("abundance", 3),
        ("insulin shortage", 3),
        ("oxygen shortage", 3),
        # refined lucene-style queries using field filters
        ("openfda.generic_name:insulin AND (health_care_provider_letter:shortage OR description:shortage)", 3),
        ("(description:oxygen OR indications_and_usage:oxygen) AND (shortage OR backorder OR unavailable)", 3),
    ]
    for q, n in queries:
        print("\n=== Query:", q, f"(limit={n}) ===")
        resp = client.post("/api/resources/search", json={"query": q, "limit": n})
        print("Status:", resp.status_code)
        try:
            data = resp.json()
            print(json.dumps(data, indent=2)[:6000])
        except Exception as e:
            print("Non-JSON response", e, resp.text[:500])


if __name__ == "__main__":
    run()
