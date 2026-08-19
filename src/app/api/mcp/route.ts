import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Model Context Protocol (MCP) Tools Registry
const MCP_TOOLS = [
  {
    name: "search_products",
    description: "Search industrial products by keyword, category, taxonomy code, or supplier.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query string matching SKU, title, brand, or specs" },
        category: { type: "string", description: "Optional category filter" },
        limit: { type: "number", description: "Maximum number of results (default 10)" },
      },
    },
  },
  {
    name: "get_product",
    description: "Retrieve comprehensive industrial product record with technical attributes, GTIN, and compliance status.",
    inputSchema: {
      type: "object",
      properties: {
        skuOrId: { type: "string", description: "Product SKU or unique database ID" },
      },
      required: ["skuOrId"],
    },
  },
  {
    name: "check_compliance",
    description: "Evaluate OpenAI/Stripe ACP and Google UCP agentic commerce compliance for a product.",
    inputSchema: {
      type: "object",
      properties: {
        skuOrId: { type: "string", description: "Product SKU or unique database ID" },
      },
      required: ["skuOrId"],
    },
  },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jsonrpc = "2.0", id = 1, method, params = {} } = body;

    // 1. Discovery / initialize
    if (method === "initialize" || method === "mcp.initialize") {
      return NextResponse.json({
        jsonrpc,
        id,
        result: {
          protocolVersion: "2024-11-05",
          serverInfo: {
            name: "industrial-catalog-mcp-server",
            version: "1.0.0",
          },
          capabilities: {
            tools: { listChanged: false },
          },
        },
      });
    }

    if (method === "ping") {
      return NextResponse.json({ jsonrpc, id, result: {} });
    }

    // 2. List tools
    if (method === "tools/list" || method === "mcp.list_tools") {
      return NextResponse.json({
        jsonrpc,
        id,
        result: {
          tools: MCP_TOOLS,
        },
      });
    }

    // 3. Call tool
    if (method === "tools/call" || method === "mcp.call_tool") {
      const toolName = params.name;
      const args = params.arguments || {};

      if (toolName === "search_products") {
        const query = args.query || "";
        const limit = args.limit || 10;
        const where: any = {};

        if (query) {
          where.OR = [
            { sku: { contains: query } },
            { title: { contains: query } },
            { brand: { contains: query } },
            { category: { contains: query } },
          ];
        }
        if (args.category) {
          where.category = args.category;
        }

        const products = await prisma.product.findMany({
          where,
          take: limit,
          select: {
            id: true,
            sku: true,
            gtin: true,
            title: true,
            brand: true,
            category: true,
            price: true,
            currency: true,
            status: true,
            agentVisibilityTier: true,
            agentVisibilityScore: true,
            completenessScore: true,
          },
        });

        return NextResponse.json({
          jsonrpc,
          id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify({ totalMatches: products.length, products }, null, 2),
              },
            ],
          },
        });
      }

      if (toolName === "get_product") {
        const skuOrId = args.skuOrId;
        if (!skuOrId) {
          return NextResponse.json({
            jsonrpc,
            id,
            error: { code: -32602, message: "Missing required parameter 'skuOrId'" },
          });
        }

        const product = await prisma.product.findFirst({
          where: {
            OR: [{ id: skuOrId }, { sku: skuOrId }],
          },
          include: {
            supplier: true,
            attributeFields: true,
            validationIssues: { where: { resolved: false } },
          },
        });

        if (!product) {
          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [{ type: "text", text: `Product with identifier '${skuOrId}' not found.` }],
              isError: true,
            },
          });
        }

        return NextResponse.json({
          jsonrpc,
          id,
          result: {
            content: [{ type: "text", text: JSON.stringify(product, null, 2) }],
          },
        });
      }

      if (toolName === "check_compliance") {
        const skuOrId = args.skuOrId;
        const product = await prisma.product.findFirst({
          where: {
            OR: [{ id: skuOrId }, { sku: skuOrId }],
          },
        });

        if (!product) {
          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              content: [{ type: "text", text: `Product with identifier '${skuOrId}' not found.` }],
              isError: true,
            },
          });
        }

        const complianceSummary = {
          sku: product.sku,
          gtin: product.gtin || "MISSING",
          tier: product.agentVisibilityTier,
          score: product.agentVisibilityScore,
          acpFillRate: product.acpFillRate,
          ucpFillRate: product.ucpFillRate,
          canBePublished: Boolean(product.gtin && product.gtin.trim() !== ""),
          recommendation:
            product.agentVisibilityTier === "TRUSTED"
              ? "Eligible for autonomous purchase execution."
              : "Missing required commerce identifiers. Run AI Autofill.",
        };

        return NextResponse.json({
          jsonrpc,
          id,
          result: {
            content: [{ type: "text", text: JSON.stringify(complianceSummary, null, 2) }],
          },
        });
      }

      return NextResponse.json({
        jsonrpc,
        id,
        error: { code: -32601, message: `Method or tool '${toolName}' not found` },
      });
    }

    return NextResponse.json({
      jsonrpc,
      id,
      error: { code: -32601, message: `Unsupported method '${method}'` },
    });
  } catch (error: any) {
    console.error("POST /api/mcp error:", error);
    return NextResponse.json({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32603, message: error.message },
    });
  }
}
