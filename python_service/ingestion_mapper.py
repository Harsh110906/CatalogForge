"""
AI Ingestion & Column-to-Taxonomy Field Mapper
"""
import re
from typing import Dict, Any, List, Optional
from ai_engine import call_gemini

CANONICAL_FIELDS = [
    {"key": "sku", "label": "Product SKU / Part Number", "required": True},
    {"key": "gtin", "label": "GTIN Barcode (GS1)", "required": True},
    {"key": "title", "label": "Product Title / Name", "required": True},
    {"key": "description", "label": "Description / Overview", "required": False},
    {"key": "brand", "label": "Manufacturer / Brand", "required": True},
    {"key": "category", "label": "Product Category", "required": False},
    {"key": "price", "label": "Unit Price (USD)", "required": True},
    {"key": "voltage_rating", "label": "Rated Voltage (V)", "required": False},
    {"key": "current_rating", "label": "Rated Current (A)", "required": False},
    {"key": "rated_power", "label": "Rated Power (W / kW / HP)", "required": False},
    {"key": "dimensions", "label": "Dimensions (LxWxH mm)", "required": False},
    {"key": "weight", "label": "Weight / Mass (kg)", "required": False},
    {"key": "ip_rating", "label": "Ingress Protection (IP Rating)", "required": False},
    {"key": "mounting_type", "label": "Mounting Type (DIN Rail/Panel)", "required": False},
    {"key": "operating_temp", "label": "Operating Temp Range (°C)", "required": False}
]

def map_column_headers(headers: List[str], sample_rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Maps raw column headers to canonical industrial fields with confidence scores.
    """
    mappings = []
    
    for header in headers:
        h_clean = header.lower().replace("_", " ").replace("-", " ").strip()
        matched_field = None
        confidence = 60.0
        reasoning = "Generic fuzzy header match"

        # Check SKU
        if any(term in h_clean for term in ["sku", "part number", "part no", "catalog number", "cat no", "mpn", "item code", "model number"]):
            matched_field = "sku"
            confidence = 98.0
            reasoning = f"Column '{header}' matches high-confidence industrial SKU/part identifier pattern."
        # Check GTIN
        elif any(term in h_clean for term in ["gtin", "barcode", "upc", "ean", "gs1", "isbn"]):
            matched_field = "gtin"
            confidence = 99.0
            reasoning = f"Column '{header}' matches GS1 barcode/GTIN global trade identity specification."
        # Check Title
        elif any(term in h_clean for term in ["product title", "product name", "item name", "short desc", "title"]):
            matched_field = "title"
            confidence = 95.0
            reasoning = f"Column '{header}' indicates primary commercial product title."
        # Check Description
        elif any(term in h_clean for term in ["description", "long desc", "overview", "product details", "tech specs"]):
            matched_field = "description"
            confidence = 94.0
            reasoning = f"Column '{header}' contains multi-sentence technical description."
        # Check Brand / Mfg
        elif any(term in h_clean for term in ["brand", "manufacturer", "mfg", "vendor", "supplier name", "make"]):
            matched_field = "brand"
            confidence = 96.0
            reasoning = f"Column '{header}' corresponds to manufacturer or brand name."
        # Check Category
        elif any(term in h_clean for term in ["category", "cat", "product type", "family", "class", "segment"]):
            matched_field = "category"
            confidence = 92.0
            reasoning = f"Column '{header}' denotes catalog hierarchical categorization."
        # Check Price
        elif any(term in h_clean for term in ["price", "cost", "msrp", "unit price", "net price", "usd"]):
            matched_field = "price"
            confidence = 97.0
            reasoning = f"Column '{header}' represents unit selling price."
        # Check Voltage
        elif any(term in h_clean for term in ["voltage", "volts", "rated v", "vac", "vdc", "supply v"]):
            matched_field = "voltage_rating"
            confidence = 94.0
            reasoning = f"Column '{header}' maps to canonical rated voltage parameter."
        # Check Current
        elif any(term in h_clean for term in ["current", "amps", "amperage", "rated a", "current rating"]):
            matched_field = "current_rating"
            confidence = 95.0
            reasoning = f"Column '{header}' maps to electrical current rating specification."
        # Check Power
        elif any(term in h_clean for term in ["power", "wattage", "watts", "kw", "hp", "rated power"]):
            matched_field = "rated_power"
            confidence = 93.0
            reasoning = f"Column '{header}' denotes electrical output/input power rating."
        # Check Dimensions
        elif any(term in h_clean for term in ["dimension", "dimensions", "size", "w x h x d", "width", "height", "length"]):
            matched_field = "dimensions"
            confidence = 91.0
            reasoning = f"Column '{header}' contains physical dimension envelope."
        # Check Weight
        elif any(term in h_clean for term in ["weight", "mass", "shipping weight", "net weight", "kg", "lbs"]):
            matched_field = "weight"
            confidence = 95.0
            reasoning = f"Column '{header}' maps to physical item mass/weight."
        # Check IP Rating
        elif any(term in h_clean for term in ["ip rating", "ingress", "ip code", "protection class", "nema"]):
            matched_field = "ip_rating"
            confidence = 96.0
            reasoning = f"Column '{header}' maps to IEC 60529 Ingress Protection rating."
        # Check Mounting
        elif any(term in h_clean for term in ["mounting", "installation", "mount type", "din rail"]):
            matched_field = "mounting_type"
            confidence = 90.0
            reasoning = f"Column '{header}' maps to physical mounting specification."
        # Check Temp
        elif any(term in h_clean for term in ["temperature", "temp range", "operating temp", "ambient temp"]):
            matched_field = "operating_temp"
            confidence = 92.0
            reasoning = f"Column '{header}' maps to environmental operating temperature range."
        else:
            # Pass as raw attribute
            clean_key = re.sub(r'[^a-zA-Z0-9_]', '_', header.lower())
            matched_field = f"attr_{clean_key}"
            confidence = 72.0
            reasoning = f"Column '{header}' preserved as custom attribute '{clean_key}'."

        # Get sample values from sample_rows
        samples = [str(r.get(header, "")).strip() for r in sample_rows[:3] if header in r and r.get(header)]

        mappings.append({
            "sourceHeader": header,
            "targetField": matched_field,
            "confidenceScore": confidence,
            "aiReasoning": reasoning,
            "sampleValues": samples,
            "userOverridden": False
        })

    return mappings
