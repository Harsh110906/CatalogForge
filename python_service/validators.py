"""
Industrial Validation Engine & Golden Standard Benchmark Diffing
"""
import re
from typing import Dict, Any, List, Optional

def validate_cross_field_rules(product: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Runs rule-based cross-field checks on an industrial product record.
    Returns a list of validation issues.
    """
    issues = []
    attrs = product.get("attributes") or {}
    if isinstance(attrs, str):
        import json
        try:
            attrs = json.loads(attrs)
        except Exception:
            attrs = {}

    title = (product.get("title") or "").lower()
    desc = (product.get("description") or "").lower()
    gtin = product.get("gtin")

    # 1. Missing GTIN check (Crucial for ACP & UCP standards)
    if not gtin or str(gtin).strip().lower() in ["", "none", "null"]:
        issues.append({
            "type": "MISSING",
            "severity": "CRITICAL",
            "fieldName": "gtin",
            "message": "Missing Global Trade Item Number (GTIN-12/13/14). Required for ACP/UCP identity matching and publish approval.",
            "suggestedFix": "Generate or import valid 12-14 digit GS1 GTIN barcode identifier."
        })
    elif not re.match(r'^\d{8,14}$', str(gtin).strip()):
        issues.append({
            "type": "ANOMALY",
            "severity": "ERROR",
            "fieldName": "gtin",
            "message": f"GTIN value '{gtin}' does not conform to 8-14 digit standard barcode format.",
            "suggestedFix": "Verify GS1 check digit and numerical format."
        })

    # 2. Weight vs Category / Dimension sanity check
    weight_val = None
    for k in ["weight", "mass", "shipping_weight", "net_weight"]:
        if k in attrs:
            v = str(attrs[k]).lower()
            m = re.search(r'([\d.]+)', v)
            if m:
                weight_val = float(m.group(1))
                if "g" in v and "kg" not in v:
                    weight_val = weight_val / 1000.0
                elif "lb" in v:
                    weight_val = weight_val * 0.453592
                break

    if "sensor" in title or "terminal block" in title or "photoelectric" in title:
        if weight_val is not None and weight_val > 5.0:
            issues.append({
                "type": "CROSS_FIELD",
                "severity": "ERROR",
                "fieldName": "weight",
                "message": f"Implausible weight ({weight_val} kg) for miniature sensor/terminal block product category.",
                "suggestedFix": "Unit likely in grams or typo. Verify whether weight should be in grams (e.g. 50g instead of 50kg)."
            })

    if "circuit breaker" in title and "1p" in title:
        if weight_val is not None and weight_val < 0.02:
            issues.append({
                "type": "CROSS_FIELD",
                "severity": "WARNING",
                "fieldName": "weight",
                "message": f"Recorded weight ({weight_val} kg) is unusually low for standard 1P DIN-rail circuit breaker.",
                "suggestedFix": "Verify net physical weight against manufacturer datasheet (typical range: 0.10 - 0.20 kg)."
            })

    # 3. Voltage vs Current vs Power Consistency (P = V * I)
    voltage = None
    current = None
    power = None
    for k, v in attrs.items():
        k_low = k.lower()
        val_str = str(v).lower()
        if "voltage" in k_low or k_low == "v":
            vm = re.search(r'([\d.]+)', val_str)
            if vm:
                voltage = float(vm.group(1))
        elif "current" in k_low or "amperage" in k_low:
            am = re.search(r'([\d.]+)', val_str)
            if am:
                current = float(am.group(1))
                if "ma" in val_str:
                    current = current / 1000.0
        elif "power" in k_low or "wattage" in k_low:
            pm = re.search(r'([\d.]+)', val_str)
            if pm:
                power = float(pm.group(1))
                if "kw" in val_str:
                    power = power * 1000.0

    if voltage and current and power and voltage > 0 and current > 0:
        theoretical_va = voltage * current
        # If stated power is wildly incompatible with V * I (factor of 5x difference)
        if power > theoretical_va * 4.0 or power < theoretical_va * 0.15:
            issues.append({
                "type": "CROSS_FIELD",
                "severity": "WARNING",
                "fieldName": "rated_power",
                "message": f"Electrical parameter mismatch: Stated power ({power}W) contradicts V * I calculation ({voltage}V * {current}A = {round(theoretical_va, 1)}VA).",
                "suggestedFix": "Check if power is peak surge or if current represents secondary winding output."
            })

    # 4. Temperature range plausibility
    min_temp = None
    max_temp = None
    for k, v in attrs.items():
        k_low = k.lower()
        val_str = str(v)
        if "min_temp" in k_low or "operating_temp_min" in k_low:
            m = re.search(r'(-?[\d.]+)', val_str)
            if m: min_temp = float(m.group(1))
        elif "max_temp" in k_low or "operating_temp_max" in k_low:
            m = re.search(r'(-?[\d.]+)', val_str)
            if m: max_temp = float(m.group(1))

    if min_temp is not None and max_temp is not None and min_temp >= max_temp:
        issues.append({
            "type": "ANOMALY",
            "severity": "ERROR",
            "fieldName": "operating_temperature",
            "message": f"Operating temperature range inverted: Minimum temp ({min_temp}°C) exceeds or equals Maximum temp ({max_temp}°C).",
            "suggestedFix": f"Swap bounds to {max_temp}°C min / {min_temp}°C max or verify datasheet."
        })

    # 5. IP Rating vs Environmental claims
    ip_rating = None
    for k, v in attrs.items():
        if "ip" in k.lower() or "ingress" in k.lower():
            m = re.search(r'ip\s*(\d{2})', str(v).lower())
            if m:
                ip_rating = int(m.group(1))
                break

    if ip_rating and ip_rating <= 20:
        if any(term in desc for term in ["outdoor", "washdown", "submersible", "weatherproof", "ip67"]):
            issues.append({
                "type": "MISMATCH",
                "severity": "ERROR",
                "fieldName": "ip_rating",
                "message": f"Ingress protection IP{ip_rating} (finger-proof only) contradicts outdoor/washdown environmental description.",
                "suggestedFix": "Confirm whether product is rated IP20 (cabinet interior only) or IP65/IP67/IP69K."
            })

    # 6. Missing critical attributes
    for req_field in ["brand", "price"]:
        if not product.get(req_field):
            issues.append({
                "type": "MISSING",
                "severity": "WARNING",
                "fieldName": req_field,
                "message": f"Mandatory commercial field '{req_field}' is missing.",
                "suggestedFix": f"Specify valid {req_field}."
            })

    return issues

def diff_against_benchmark(target_product: Dict[str, Any], benchmark_product: Dict[str, Any]) -> Dict[str, Any]:
    """
    Diffs target product against the golden standard benchmark product in its category.
    Surfaces attribute gaps, out-of-range deviations, and completeness delta.
    """
    import json
    target_attrs = target_product.get("attributes") or {}
    if isinstance(target_attrs, str):
        try: target_attrs = json.loads(target_attrs)
        except Exception: target_attrs = {}

    bench_attrs = benchmark_product.get("attributes") or {}
    if isinstance(bench_attrs, str):
        try: bench_attrs = json.loads(bench_attrs)
        except Exception: bench_attrs = {}

    missing_attributes = []
    matching_attributes = []
    differing_attributes = []

    for k, v in bench_attrs.items():
        if k not in target_attrs or not target_attrs[k]:
            missing_attributes.append({
                "field": k,
                "benchmarkValue": v,
                "importance": "HIGH" if k in ["rated_voltage", "current_rating", "ip_rating", "dimensions", "weight"] else "MEDIUM"
            })
        else:
            t_val = target_attrs[k]
            if str(t_val).strip().lower() == str(v).strip().lower():
                matching_attributes.append({"field": k, "value": t_val})
            else:
                differing_attributes.append({
                    "field": k,
                    "targetValue": t_val,
                    "benchmarkValue": v
                })

    bench_completeness = benchmark_product.get("completenessScore", 100.0)
    target_completeness = target_product.get("completenessScore", 0.0)
    
    score_gap = round(bench_completeness - target_completeness, 1)

    return {
        "benchmarkSku": benchmark_product.get("sku"),
        "benchmarkTitle": benchmark_product.get("title"),
        "category": benchmark_product.get("category"),
        "scoreGap": max(0.0, score_gap),
        "totalBenchmarkFields": len(bench_attrs),
        "missingCount": len(missing_attributes),
        "missingAttributes": missing_attributes,
        "differingAttributes": differing_attributes,
        "matchingCount": len(matching_attributes),
        "recommendations": [
            f"Add {item['field']} (e.g. '{item['benchmarkValue']}') to align with category standard."
            for item in missing_attributes[:4]
        ]
    }
