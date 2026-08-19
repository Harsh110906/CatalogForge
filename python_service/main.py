"""
FastAPI Microservice for AI-Powered Industrial Catalog Enrichment & Validation
"""
import os
import uvicorn
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional

from ai_engine import enrich_product_with_ai, GEMINI_API_KEY
from validators import validate_cross_field_rules, diff_against_benchmark
from compliance import calculate_acp_compliance, calculate_ucp_compliance, determine_visibility_tier, autofill_agentic_fields
from schema_checker import diff_schema_org
from ingestion_mapper import map_column_headers, CANONICAL_FIELDS

app = FastAPI(
    title="Industrial Catalog Enrichment & Validation AI Service",
    description="FastAPI microservice powering Gemini-based enrichment, industrial taxonomy classification, cross-field validation, ACP/UCP 2026 agentic compliance, and Schema.org diffing.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class ProductEnrichRequest(BaseModel):
    sku: str
    gtin: Optional[str] = None
    brand: Optional[str] = None
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    attributes: Dict[str, Any] = Field(default_factory=dict)

class BatchEnrichRequest(BaseModel):
    products: List[ProductEnrichRequest]

class ValidationRequest(BaseModel):
    product: Dict[str, Any]

class BenchmarkDiffRequest(BaseModel):
    targetProduct: Dict[str, Any]
    benchmarkProduct: Dict[str, Any]

class ComplianceRequest(BaseModel):
    product: Dict[str, Any]

class SchemaCheckRequest(BaseModel):
    jsonLd: str
    product: Dict[str, Any]

class SmartMappingRequest(BaseModel):
    headers: List[str]
    sampleRows: List[Dict[str, Any]] = Field(default_factory=list)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "industrial-enrichment-microservice",
        "geminiApiKeyConfigured": bool(GEMINI_API_KEY),
        "standards": ["ETIM 8.0/9.0", "eCl@ss 14.0", "UNSPSC", "OpenAI/Stripe ACP 2026", "Google UCP 2026", "Schema.org Product"]
    }

@app.post("/enrich/product")
def enrich_product(req: ProductEnrichRequest):
    try:
        enriched = enrich_product_with_ai(
            sku=req.sku,
            brand=req.brand,
            current_title=req.title,
            current_description=req.description,
            category=req.category,
            raw_attributes=req.attributes,
            gtin=req.gtin
        )
        return {"success": True, "data": enriched}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Enrichment error: {str(e)}")

@app.post("/enrich/batch")
def enrich_batch(req: BatchEnrichRequest):
    results = []
    for p in req.products:
        try:
            res = enrich_product_with_ai(
                sku=p.sku,
                brand=p.brand,
                current_title=p.title,
                current_description=p.description,
                category=p.category,
                raw_attributes=p.attributes,
                gtin=p.gtin
            )
            results.append({"sku": p.sku, "success": True, "data": res})
        except Exception as err:
            results.append({"sku": p.sku, "success": False, "error": str(err)})
    return {"total": len(req.products), "results": results}

@app.post("/enrich/agentic-autofill")
def agentic_autofill(req: ComplianceRequest):
    try:
        autofilled = autofill_agentic_fields(req.product)
        return {"success": True, "data": autofilled}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Autofill error: {str(e)}")

@app.post("/validate/rules")
def validate_rules(req: ValidationRequest):
    try:
        issues = validate_cross_field_rules(req.product)
        return {
            "success": True,
            "issuesCount": len(issues),
            "issues": issues,
            "isValid": len([i for i in issues if i["severity"] in ["CRITICAL", "ERROR"]]) == 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation error: {str(e)}")

@app.post("/validate/benchmark-diff")
def validate_benchmark_diff(req: BenchmarkDiffRequest):
    try:
        diff = diff_against_benchmark(req.targetProduct, req.benchmarkProduct)
        return {"success": True, "diff": diff}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Benchmark diff error: {str(e)}")

@app.post("/compliance/check")
def check_compliance(req: ComplianceRequest):
    try:
        p = req.product
        acp = calculate_acp_compliance(p)
        ucp = calculate_ucp_compliance(p)
        visibility = determine_visibility_tier(acp["fillRate"], ucp["fillRate"])
        return {
            "success": True,
            "acp": acp,
            "ucp": ucp,
            "visibility": visibility
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Compliance check error: {str(e)}")

@app.post("/compliance/schema-diff")
def schema_diff(req: SchemaCheckRequest):
    try:
        diff_res = diff_schema_org(req.jsonLd, req.product)
        return {"success": True, "data": diff_res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Schema.org diff error: {str(e)}")

@app.post("/ingestion/smart-mapping")
def smart_mapping(req: SmartMappingRequest):
    try:
        mappings = map_column_headers(req.headers, req.sampleRows)
        return {
            "success": True,
            "mappings": mappings,
            "canonicalFields": CANONICAL_FIELDS
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Smart mapping error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
