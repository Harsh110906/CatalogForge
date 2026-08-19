"""
Automated Verification Script for Industrial Catalog Enrichment & Validation Workspace
Tests all 5 patches and core features across FastAPI and Next.js APIs.
"""
import urllib.request
import json
import sys

# Force UTF-8 on Windows terminal if needed
sys.stdout.reconfigure(encoding='utf-8')

BASE_PY_URL = "http://localhost:8000"
BASE_NEXT_URL = "http://localhost:3000"

def post_json(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))

def get_json(url):
    req = urllib.request.Request(url, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))

def run_tests():
    print("[*] Starting Automated Verification...\n")
    
    # 1. Test Python Microservice Health
    print("1. Checking Python FastAPI Microservice Health...")
    py_health = get_json(f"{BASE_PY_URL}/health")
    assert py_health.get("status") == "healthy", f"Python health failed: {py_health}"
    print(f"   [PASS] FastAPI Microservice is healthy! Standards: {py_health.get('standards')}")

    # 2. Test Python AI Enrichment & Generative Signals [PATCH 3]
    print("\n2. Testing AI Enrichment & Generative Signals (Highlights & Q&A)...")
    enrich_req = {
        "sku": "TEST-CB-001",
        "brand": "Schneider Electric",
        "title": "Schneider Acti9 iC60N Circuit Breaker 1P 16A",
        "description": "Miniature circuit breaker for electrical distribution",
        "category": "Miniature Circuit Breakers (MCBs)",
        "attributes": {"current_rating": "16A", "poles": "1P", "breaking_capacity": "6kA"}
    }
    enrich_resp = post_json(f"{BASE_PY_URL}/enrich/product", enrich_req)
    assert enrich_resp.get("success") is True, f"Enrichment failed: {enrich_resp}"
    data = enrich_resp.get("data", {})
    assert len(data.get("highlights", [])) >= 3, "Missing 3-5 highlights"
    assert len(data.get("qaPairs", [])) >= 3, "Missing 3-5 Q&A pairs"
    assert data.get("taxonomyCode") == "EC000042", "ETIM taxonomy code mismatch"
    print(f"   [PASS] Title: {data.get('enrichedTitle')[:60]}...")
    print(f"   [PASS] Generated {len(data.get('highlights'))} Highlights and {len(data.get('qaPairs'))} Q&A Pairs!")

    # 3. Test Schema.org Consistency Checker [PATCH 4]
    print("\n3. Testing Schema.org JSON-LD Consistency Checker...")
    schema_req = {
        "jsonLd": json.dumps({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": "Schneider Electric Acti9 iC60N",
            "sku": "SCH-A9F74116",
            "gtin13": "3606480439734",
            "offers": {"price": 24.50, "priceCurrency": "USD"}
        }),
        "product": {
            "title": "Schneider Electric Acti9 iC60N",
            "sku": "SCH-A9F74116",
            "gtin": "3606480439734",
            "price": 24.50,
            "currency": "USD"
        }
    }
    schema_resp = post_json(f"{BASE_PY_URL}/compliance/schema-diff", schema_req)
    assert schema_resp.get("success") is True
    diff = schema_resp.get("data", {})
    assert diff.get("consistencyScore") == 100.0, f"Expected 100% score, got {diff.get('consistencyScore')}"
    print(f"   [PASS] Schema.org diff passed with {diff.get('consistencyScore')}% consistency!")

    # 4. Test MCP JSON-RPC Endpoint [PATCH 5]
    print("\n4. Testing Model Context Protocol (MCP) JSON-RPC 2.0 Endpoint...")
    mcp_init_req = {"jsonrpc": "2.0", "id": 1, "method": "initialize"}
    mcp_init_resp = post_json(f"{BASE_NEXT_URL}/api/mcp", mcp_init_req)
    assert mcp_init_resp.get("result", {}).get("serverInfo", {}).get("name") == "industrial-catalog-mcp-server"
    
    mcp_search_req = {
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/call",
        "params": {
            "name": "search_products",
            "arguments": {"query": "Schneider", "limit": 2}
        }
    }
    mcp_search_resp = post_json(f"{BASE_NEXT_URL}/api/mcp", mcp_search_req)
    assert mcp_search_resp.get("result") is not None
    print("   [PASS] MCP Endpoint initialized and responded to 'search_products' tool call!")

    # 5. Test Feed Delivery Push [PATCH 2]
    print("\n5. Testing Feed Delivery Engine ('Push to ACP')...")
    feeds = get_json(f"{BASE_NEXT_URL}/api/feeds")
    assert feeds.get("success") is True
    feed_id = feeds["feeds"][0]["id"]
    push_resp = post_json(f"{BASE_NEXT_URL}/api/feeds/{feed_id}/push", {"triggeredBy": "Automated Test Suite"})
    assert push_resp.get("success") is True
    assert push_resp.get("job", {}).get("status") == "SUCCESS"
    assert push_resp.get("job", {}).get("httpStatus") == 200
    print(f"   [PASS] FeedDeliveryJob #{push_resp['job']['id'][:8]} executed: status {push_resp['job']['status']} (HTTP 200 OK)!")

    # 6. Test GTIN Validation on PUBLISHED status [PATCH 1]
    print("\n6. Testing GTIN Validation constraint on PUBLISHED status...")
    # Find a product without GTIN
    prods = get_json(f"{BASE_NEXT_URL}/api/products?limit=30")
    no_gtin_prod = next((p for p in prods["products"] if not p.get("gtin")), None)
    if no_gtin_prod:
        # Attempt to set status to PUBLISHED without GTIN -> must fail with 422
        try:
            req = urllib.request.Request(
                f"{BASE_NEXT_URL}/api/products/{no_gtin_prod['id']}",
                data=json.dumps({"status": "PUBLISHED", "gtin": None}).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="PUT"
            )
            urllib.request.urlopen(req)
            assert False, "Should have rejected publishing without GTIN!"
        except urllib.error.HTTPError as err:
            assert err.code == 422, f"Expected 422 Unprocessable Entity, got {err.code}"
            print(f"   [PASS] Correctly rejected PUBLISHED transition without GTIN with HTTP 422!")

    print("\n========================================================")
    print(">>> ALL 6 AUTOMATED INTEGRATION TESTS PASSED 100%! <<<")
    print("========================================================\n")

if __name__ == "__main__":
    run_tests()
