/**
 * SSE Feature Module
 *
 * Public API for the SSE feature.
 */

// Export the demo component
export { SSEDemo } from "./components/SSEDemo";

// Export the tRPC router
export { sseRouter } from "./router";

// Re-export SSE library components
export * from "@/lib/sse";
