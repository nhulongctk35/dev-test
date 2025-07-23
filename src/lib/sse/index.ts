/**
 * Server-Sent Events (SSE) Library
 *
 * Main export file for the SSE functionality.
 * Provides a clean interface for backend integration.
 */

// Core SSE manager
export {
  sseManager,
  type SSEClient,
  type SSEEvent,
  type SSEManagerConfig,
} from "./manager";

// Notification utilities
export {
  sendUserNotification,
  sendUserSystemEvent,
  sendUserCustomEvent,
  broadcastNotification,
  broadcastSystemEvent,
  broadcastCustomEvent,
  getSSEStats,
  notifications,
  broadcasts,
  type NotificationPayload,
  type SystemEventPayload,
} from "./notifications";

// Client-side hook
export { useSSE, type SSEHookOptions, type SSEMessage } from "./client-hook";
