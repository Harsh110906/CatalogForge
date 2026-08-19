import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let fileContent = "";
    let filename = "uploaded_catalog.csv";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: "No file provided in form-data." }, { status: 400 });
      }
      filename = file.name;
      fileContent = await file.text();
    } else {
      const body = await req.json();
      fileContent = body.content || "";
      filename = body.filename || "sample_catalog.csv";
    }

    if (!fileContent.trim()) {
      return NextResponse.json({ success: false, error: "File content is empty." }, { status: 400 });
    }

    const parsed = Papa.parse<Record<string, any>>(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });

    if (parsed.errors && parsed.errors.length > 0 && parsed.data.length === 0) {
      return NextResponse.json({ success: false, error: `CSV Parsing error: ${parsed.errors[0].message}` }, { status: 400 });
    }

    const headers = parsed.meta.fields || Object.keys(parsed.data[0] || {});
    const totalRows = parsed.data.length;
    const sampleRows = parsed.data.slice(0, 5);

    return NextResponse.json({
      success: true,
      filename,
      headers,
      totalRows,
      sampleRows,
      rawData: parsed.data,
    });
  } catch (error: any) {
    console.error("POST /api/ingestion/upload error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
