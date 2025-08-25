import { NextRequest, NextResponse } from "next/server";

// GET /api/public/info - Public system information endpoint (no authentication required)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format') || 'json';

        const systemInfo = {
            application: {
                name: "Webapp Dify Template",
                version: "1.0.0",
                environment: process.env.NODE_ENV || "development",
                framework: "Next.js 14",
                language: "TypeScript"
            },
            server: {
                timestamp: new Date().toISOString(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                uptime: `${Math.floor(process.uptime())} seconds`,
                nodeVersion: process.version,
                platform: process.platform
            },
            features: {
                authentication: "NextAuth",
                database: "Prisma ORM",
                ui: "Tailwind CSS",
                i18n: "Available",
                docker: "Supported"
            }
        };

        if (format === 'text') {
            const textResponse = `
Application: ${systemInfo.application.name} v${systemInfo.application.version}
Environment: ${systemInfo.application.environment}
Framework: ${systemInfo.application.framework}
Server Time: ${systemInfo.server.timestamp}
Uptime: ${systemInfo.server.uptime}
Node.js: ${systemInfo.server.nodeVersion}
Platform: ${systemInfo.server.platform}
            `.trim();

            return new NextResponse(textResponse, {
                headers: { 'Content-Type': 'text/plain' }
            });
        }

        return NextResponse.json(systemInfo);

    } catch (error: any) {
        console.error("Error in GET /api/public/info:", error);

        return NextResponse.json({
            error: "Failed to retrieve system information",
            message: error.message
        }, { status: 500 });
    }
}