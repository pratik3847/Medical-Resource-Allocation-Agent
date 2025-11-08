"""Quick smoke test for the backend using FastAPI TestClient (no server needed)."""
from fastapi.testclient import TestClient
from backend.main import app
import json

client = TestClient(app)

print("=" * 60)
print("Testing Medical Resource Allocation Backend")
print("=" * 60)

# Test 1: Health endpoint
print("\n1. Testing /api/health/")
response = client.get("/api/health/")
print(f"   Status: {response.status_code}")
print(f"   Response: {json.dumps(response.json(), indent=2)}")
assert response.status_code == 200
assert response.json()["status"] == "ok"

# Test 2: Root endpoint
print("\n2. Testing / (root)")
response = client.get("/")
print(f"   Status: {response.status_code}")
print(f"   Response: {json.dumps(response.json(), indent=2)}")
assert response.status_code == 200

# Test 3: OpenAPI docs
print("\n3. Testing /docs (OpenAPI)")
response = client.get("/docs")
print(f"   Status: {response.status_code}")
print(f"   Content-Type: {response.headers.get('content-type')}")
assert response.status_code == 200

# Test 4: Research endpoint (EuropePMC)
print("\n4. Testing POST /api/research/papers")
payload = {"query": "COVID-19 vaccine", "limit": 3}
response = client.post("/api/research/papers", json=payload)
print(f"   Status: {response.status_code}")
print(f"   Full Response:\n{json.dumps(response.json(), indent=2)}")
assert response.status_code == 200

# Test 5: Location endpoint (Nominatim)
print("\n5. Testing POST /api/location/geocode")
payload = {"place": "Geneva, Switzerland"}
response = client.post("/api/location/geocode", json=payload)
print(f"   Status: {response.status_code}")
result = response.json()
print(f"   Full Response:\n{json.dumps(result, indent=2)}")
assert response.status_code == 200

# Test 6: Resources endpoint (OpenFDA)
print("\n6. Testing POST /api/resources/search")
payload = {"query": "aspirin", "limit": 3}
response = client.post("/api/resources/search", json=payload)
print(f"   Status: {response.status_code}")
print(f"   Full Response:\n{json.dumps(response.json(), indent=2)}")
assert response.status_code == 200

# Test 7: Insights endpoint (WHO + World Bank)
print("\n7. Testing POST /api/insights/")
payload = {"region": None}
response = client.post("/api/insights/", json=payload)
print(f"   Status: {response.status_code}")
print(f"   Full Response:\n{json.dumps(response.json(), indent=2)}")
assert response.status_code == 200

# Test 8: Analyze endpoint (LangAgent)
print("\n8. Testing POST /api/analyze/ (LangAgent)")
payload = {
    "symptoms": ["fever", "cough"],
    "location": "Geneva",
    "required_resources": ["oxygen"]
}
response = client.post("/api/analyze/", json=payload)
print(f"   Status: {response.status_code}")
result = response.json()
print(f"   Full Response:\n{json.dumps(result, indent=2)}")
assert response.status_code == 200

# Test 9: Inventory snapshot
print("\n9. Testing GET /api/inventory/")
response = client.get("/api/inventory/")
print(f"   Status: {response.status_code}")
inv = response.json()
print(f"   Records: {len(inv.get('records', []))}")
assert response.status_code == 200
assert isinstance(inv.get("records"), list)

# Test 10: Inventory update (delta)
print("\n10. Testing POST /api/inventory/update (delta)")
payload = [
    {"hospital_id": "H003", "resource_name": "oxygen_cylinders", "quantity": 5, "mode": "delta"}
]
response = client.post("/api/inventory/update", json=payload)
print(f"   Status: {response.status_code}")
print(f"   Sample Response keys: {list(response.json().keys())}")
assert response.status_code == 200

# Test 11: Reallocation plan
print("\n11. Testing POST /api/inventory/reallocate")
payload = {
    "demands": [
        {"hospital_id": "H003", "resource_name": "oxygen_cylinders", "required_quantity": 10}
    ]
}
response = client.post("/api/inventory/reallocate", json=payload)
print(f"   Status: {response.status_code}")
realloc = response.json()
print(f"   Plan: {json.dumps(realloc.get('plan', []), indent=2)}")
print(f"   Unmet: {json.dumps(realloc.get('unmet', []), indent=2)}")
assert response.status_code == 200

# Test 12: Preferences (get/update/feedback)
print("\n12. Testing /api/preferences")
resp = client.get("/api/preferences/")
print(f"   GET status: {resp.status_code} body: {json.dumps(resp.json(), indent=2)}")
assert resp.status_code == 200
resp = client.post("/api/preferences/update", json={"distance_weight": 0.5, "coverage_weight": 0.4, "fairness_weight": 0.1})
print(f"   UPDATE status: {resp.status_code} body: {json.dumps(resp.json(), indent=2)}")
assert resp.status_code == 200
resp = client.post("/api/preferences/feedback", json={"accepted": True, "reason": "plan good", "plan_size": len(realloc.get('plan', []))})
print(f"   FEEDBACK status: {resp.status_code} body: {json.dumps(resp.json(), indent=2)}")
assert resp.status_code == 200

# Test 13: Workflow endpoint
print("\n13. Testing POST /api/workflow/run")
payload = {"symptoms": ["fever"], "location": "Austin, TX", "required_resources": ["oxygen_cylinders"], "objective": "stabilize oxygen in 24h"}
resp = client.post("/api/workflow/run", json=payload)
print(f"   Status: {resp.status_code}")
print(f"   Summary: {resp.json().get('summary') if resp.status_code==200 else resp.text}")
assert resp.status_code == 200

print("\n" + "=" * 60)
print("✅ All tests passed! Backend is working.")
print("=" * 60)
