import { NextRequest, NextResponse } from "next/server";

// GET /api/public/health - Public health check endpoint (no authentication required)
export async function GET(request: NextRequest) {
    try {
        const timestamp = new Date().toISOString();

        return NextResponse.json({
            status: "healthy",
            message: "API is running successfully",
            timestamp,
            version: "1.0.0",
            uptime: process.uptime()
        });

    } catch (error: any) {
        console.error("Error in GET /api/public/health:", error);

        return NextResponse.json({
            status: "error",
            message: "Health check failed",
            error: error.message
        }, { status: 500 });
    }
}

// POST /api/public/health - Public endpoint to test POST requests
export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const timestamp = new Date().toISOString();

        return NextResponse.json({
            status: "success",
            message: "POST request received successfully",
            timestamp,
            receivedData: body,
            method: "POST"
        });

    } catch (error: any) {
        console.error("Error in POST /api/public/health:", error);

        return NextResponse.json({
            status: "error",
            message: "POST request failed",
            error: error.message
        }, { status: 500 });
    }
}