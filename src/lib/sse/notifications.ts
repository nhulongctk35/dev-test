/**
 * SSE Notification Utilities
 *
 * High-level utilities for backend modules to send notifications
 * without dealing with SSE protocol details.
 */

import { sseManager, type SSEEvent } from "./manager";
import { createServiceContext } from "@/utils/service-utils";

const { log } = createServiceContext("SSENotifications");

export interface NotificationPayload {
  title?: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  data?: Record<string, any>;
  timestamp?: number;
}

export interface SystemEventPayload {
  event: string;
  data: Record<string, any>;
  timestamp?: number;
}

/**
 * Send a user notification via SSE
 */
export function sendUserNotification(
  userId: string,
  payload: NotificationPayload,
): number {
  const event: SSEEvent = {
    type: "notification",
    data: {
      ...payload,
      timestamp: payload.timestamp || Date.now(),
    },
    id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };

  const sentCount = sseManager.sendToUser(userId, event);

  log.info("User notification sent", {
    userId,
    type: payload.type || "info",
    title: payload.title,
    sentToClients: sentCount,
  });

  return sentCount;
}

/**
 * Send a system event to a specific user
 */
export function sendUserSystemEvent(
  userId: string,
  payload: SystemEventPayload,
): number {
  const event: SSEEvent = {
    type: "system",
    data: {
      ...payload,
      timestamp: payload.timestamp || Date.now(),
    },
    id: `system_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };

  const sentCount = sseManager.sendToUser(userId, event);

  log.info("User system event sent", {
    userId,
    event: payload.event,
    sentToClients: sentCount,
  });

  return sentCount;
}

/**
 * Broadcast a notification to all connected users
 */
export function broadcastNotification(payload: NotificationPayload): number {
  const event: SSEEvent = {
    type: "notification",
    data: {
      ...payload,
      timestamp: payload.timestamp || Date.now(),
    },
    id: `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };

  const sentCount = sseManager.broadcast(event);

  log.info("Broadcast notification sent", {
    type: payload.type || "info",
    title: payload.title,
    sentToClients: sentCount,
  });

  return sentCount;
}

/**
 * Broadcast a system event to all connected users
 */
export function broadcastSystemEvent(payload: SystemEventPayload): number {
  const event: SSEEvent = {
    type: "system",
    data: {
      ...payload,
      timestamp: payload.timestamp || Date.now(),
    },
    id: `broadcast_system_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };

  const sentCount = sseManager.broadcast(event);

  log.info("Broadcast system event sent", {
    event: payload.event,
    sentToClients: sentCount,
  });

  return sentCount;
}

/**
 * Send a custom event to a specific user
 */
export function sendUserCustomEvent(
  userId: string,
  eventType: string,
  data: any,
  options?: { id?: string; retry?: number },
): number {
  const event: SSEEvent = {
    type: eventType,
    data,
    id:
      options?.id ||
      `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    retry: options?.retry,
  };

  const sentCount = sseManager.sendToUser(userId, event);

  log.info("User custom event sent", {
    userId,
    eventType,
    sentToClients: sentCount,
  });

  return sentCount;
}

/**
 * Broadcast a custom event to all connected users
 */
export function broadcastCustomEvent(
  eventType: string,
  data: any,
  options?: { id?: string; retry?: number },
): number {
  const event: SSEEvent = {
    type: eventType,
    data,
    id:
      options?.id ||
      `broadcast_custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    retry: options?.retry,
  };

  const sentCount = sseManager.broadcast(event);

  log.info("Broadcast custom event sent", {
    eventType,
    sentToClients: sentCount,
  });

  return sentCount;
}

/**
 * Get SSE connection statistics
 */
export function getSSEStats() {
  return sseManager.getStats();
}

// Convenience functions for common notification types

export const notifications = {
  /**
   * Send success notification to user
   */
  success: (
    userId: string,
    message: string,
    title?: string,
    data?: Record<string, any>,
  ) => sendUserNotification(userId, { type: "success", message, title, data }),

  /**
   * Send error notification to user
   */
  error: (
    userId: string,
    message: string,
    title?: string,
    data?: Record<string, any>,
  ) => sendUserNotification(userId, { type: "error", message, title, data }),

  /**
   * Send info notification to user
   */
  info: (
    userId: string,
    message: string,
    title?: string,
    data?: Record<string, any>,
  ) => sendUserNotification(userId, { type: "info", message, title, data }),

  /**
   * Send warning notification to user
   */
  warning: (
    userId: string,
    message: string,
    title?: string,
    data?: Record<string, any>,
  ) => sendUserNotification(userId, { type: "warning", message, title, data }),
};

export const broadcasts = {
  /**
   * Broadcast success notification
   */
  success: (message: string, title?: string, data?: Record<string, any>) =>
    broadcastNotification({ type: "success", message, title, data }),

  /**
   * Broadcast error notification
   */
  error: (message: string, title?: string, data?: Record<string, any>) =>
    broadcastNotification({ type: "error", message, title, data }),

  /**
   * Broadcast info notification
   */
  info: (message: string, title?: string, data?: Record<string, any>) =>
    broadcastNotification({ type: "info", message, title, data }),

  /**
   * Broadcast warning notification
   */
  warning: (message: string, title?: string, data?: Record<string, any>) =>
    broadcastNotification({ type: "warning", message, title, data }),
};
