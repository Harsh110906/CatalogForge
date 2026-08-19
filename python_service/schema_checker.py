"""
Schema.org JSON-LD Consistency Checker
Diffs external or pasted Schema.org structured data against stored product catalog records.
"""
import json
import re
from typing import Dict, Any, List, Optional

def diff_schema_org(json_ld_raw: str, product: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parses pasted Schema.org JSON-LD string and diffs against product record.
    Returns comparison items: MATCH, MISMATCH, MISSING_IN_SCHEMA, MISSING_IN_PRODUCT.
    """
    try:
        # Clean markdown fences if any
        cleaned = json_ld_raw.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        data = json.loads(cleaned.strip())
    except Exception as e:
        return {
            "success": False,
            "error": f"Invalid JSON-LD syntax: {str(e)}",
            "matches": [],
            "mismatches": [],
            "missingInSchema": [],
            "missingInProduct": []
        }

    # Handle @graph or direct object
    if "@graph" in data and isinstance(data["@graph"], list):
        # find Product item
        product_item = next((item for item in data["@graph"] if item.get("@type") == "Product"), data["@graph"][0])
    else:
        product_item = data

    matches = []
    mismatches = []
    missing_in_schema = []
    missing_in_product = []

    # Map Schema.org fields to product model fields
    schema_fields = {
        "name": product_item.get("name") or product_item.get("title"),
        "description": product_item.get("description"),
        "sku": product_item.get("sku") or product_item.get("mpn"),
        "gtin": product_item.get("gtin13") or product_item.get("gtin") or product_item.get("gtin14") or product_item.get("gtin12") or product_item.get("gtin8"),
        "brand": (product_item.get("brand", {}).get("name") if isinstance(product_item.get("brand"), dict) else product_item.get("brand")),
        "category": product_item.get("category"),
    }

    # Offers
    offers = product_item.get("offers")
    if isinstance(offers, list) and len(offers) > 0:
        offers = offers[0]
    if isinstance(offers, dict):
        schema_fields["price"] = offers.get("price")
        schema_fields["currency"] = offers.get("priceCurrency")
        schema_fields["availability"] = offers.get("availability")
        if schema_fields["availability"] and "InStock" in str(schema_fields["availability"]):
            schema_fields["availability"] = "in_stock"

    # Evaluate fields
    product_fields = {
        "name": product.get("title"),
        "description": product.get("description"),
        "sku": product.get("sku"),
        "gtin": product.get("gtin"),
        "brand": product.get("brand"),
        "category": product.get("category"),
        "price": product.get("price"),
        "currency": product.get("currency") or "USD",
        "availability": product.get("availability") or "in_stock"
    }

    for key, prod_val in product_fields.items():
        sch_val = schema_fields.get(key)
        if sch_val is None and prod_val is not None:
            missing_in_schema.append({
                "field": key,
                "productValue": str(prod_val),
                "suggestion": f"Add '{key}' to Schema.org JSON-LD to prevent search engine deprecation."
            })
        elif sch_val is not None and prod_val is None:
            missing_in_product.append({
                "field": key,
                "schemaValue": str(sch_val),
                "suggestion": f"Reconcile product record with value '{sch_val}' from Schema.org."
            })
        elif sch_val is not None and prod_val is not None:
            # Compare
            sch_str = str(sch_val).strip()
            prod_str = str(prod_val).strip()
            
            # Numeric price tolerance
            is_match = False
            if key == "price":
                try:
                    is_match = abs(float(sch_str) - float(prod_str)) < 0.01
                except Exception:
                    is_match = (sch_str == prod_str)
            else:
                is_match = (sch_str.lower() == prod_str.lower())

            if is_match:
                matches.append({
                    "field": key,
                    "value": prod_str,
                    "status": "CONSISTENT"
                })
            else:
                mismatches.append({
                    "field": key,
                    "productValue": prod_str,
                    "schemaValue": sch_str,
                    "discrepancyType": "VALUE_DIVERGENCE",
                    "recommendation": f"Update Schema.org or product {key} to align (Product: '{prod_str}' vs Schema: '{sch_str}')"
                })

    consistency_score = round(
        (len(matches) / max(1, len(matches) + len(mismatches) + len(missing_in_schema))) * 100.0,
        1
    )

    return {
        "success": True,
        "consistencyScore": consistency_score,
        "schemaType": product_item.get("@type", "Product"),
        "matchesCount": len(matches),
        "mismatchesCount": len(mismatches),
        "missingInSchemaCount": len(missing_in_schema),
        "missingInProductCount": len(missing_in_product),
        "matches": matches,
        "mismatches": mismatches,
        "missingInSchema": missing_in_schema,
        "missingInProduct": missing_in_product
    }
