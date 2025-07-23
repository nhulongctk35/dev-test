/**
 * Server-Sent Events (SSE) API Route
 *
 * Handles SSE connections from clients and manages the streaming connection.
 */

import { type NextRequest } from "next/server";
import { getSession } from "@/features/auth";
import { sseManager } from "@/lib/sse/manager";
import { createServiceContext } from "@/utils/service-utils";

const { log } = createServiceContext("SSERoute");

export async function GET(request: NextRequest) {
  try {
    // Get session for authentication
    const session = await getSession();

    // Generate unique client ID
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Extract optional metadata from query parameters
    const metadata = {
      userAgent: request.headers.get("user-agent") ?? "unknown",
      ip:
        request.headers.get("x-forwarded-for") ??
        request.headers.get("x-real-ip") ??
        "unknown",
      timestamp: Date.now(),
    };

    log.info("SSE connection request", {
      clientId,
      userId: session?.user?.id,
      sessionId: session?.user?.id ? `session_${session.user.id}` : undefined,
      metadata,
    });

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        try {
          // Add client to SSE manager
          sseManager.addClient(
            clientId,
            controller,
            session?.user?.id,
            session?.user?.id ? `session_${session.user.id}` : undefined,
            metadata,
          );

          log.info("SSE client connected", {
            clientId,
            userId: session?.user?.id,
          });
        } catch (error) {
          log.error("Failed to add SSE client", { clientId, error });
          controller.error(error);
        }
      },

      cancel() {
        // Client disconnected
        log.info("SSE client disconnected", {
          clientId,
          userId: session?.user?.id,
        });
        sseManager.removeClient(clientId);
      },
    });

    // Return SSE response with proper headers
    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Cache-Control",
        // Prevent buffering in nginx and other proxies
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    log.error("SSE connection failed", { error: errorMessage });

    return new Response(
      JSON.stringify({
        error: "Failed to establish SSE connection",
        message: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
}
