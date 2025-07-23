/**
 * Server-Sent Events (SSE) Manager
 *
 * Centralized service for managing SSE connections, event dispatching,
 * and client lifecycle management.
 */

import { createServiceContext } from "@/utils/service-utils";

const { log, handleError } = createServiceContext("SSEManager");

export interface SSEClient {
  id: string;
  userId?: string;
  sessionId?: string;
  controller: ReadableStreamDefaultController;
  lastPing: number;
  metadata?: Record<string, any>;
}

export interface SSEEvent {
  type: string;
  data: any;
  id?: string;
  retry?: number;
}

export interface SSEManagerConfig {
  heartbeatInterval: number; // milliseconds
  connectionTimeout: number; // milliseconds
  maxConnections: number;
}

class SSEManager {
  private clients = new Map<string, SSEClient>();
  private userConnections = new Map<string, Set<string>>(); // userId -> Set of clientIds
  private config: SSEManagerConfig;
  private heartbeatTimer?: NodeJS.Timeout;

  constructor(config: Partial<SSEManagerConfig> = {}) {
    this.config = {
      heartbeatInterval: 30000, // 30 seconds
      connectionTimeout: 60000, // 60 seconds
      maxConnections: 1000,
      ...config,
    };

    this.startHeartbeat();
    log.info("SSE Manager initialized", { config: this.config });
  }

  /**
   * Add a new client connection
   */
  addClient(
    clientId: string,
    controller: ReadableStreamDefaultController,
    userId?: string,
    sessionId?: string,
    metadata?: Record<string, any>,
  ): void {
    // Check connection limits
    if (this.clients.size >= this.config.maxConnections) {
      log.warn("Maximum connections reached", {
        current: this.clients.size,
        max: this.config.maxConnections,
      });
      throw new Error("Maximum connections reached");
    }

    const client: SSEClient = {
      id: clientId,
      userId,
      sessionId,
      controller,
      lastPing: Date.now(),
      metadata,
    };

    this.clients.set(clientId, client);

    // Track user connections
    if (userId) {
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set());
      }
      this.userConnections.get(userId)!.add(clientId);
    }

    log.info("Client connected", {
      clientId,
      userId,
      sessionId,
      totalConnections: this.clients.size,
    });

    // Send initial connection confirmation
    this.sendToClient(clientId, {
      type: "connection",
      data: { status: "connected", clientId, timestamp: Date.now() },
    });
  }

  /**
   * Remove a client connection
   */
  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from user connections tracking
    if (client.userId) {
      const userClients = this.userConnections.get(client.userId);
      if (userClients) {
        userClients.delete(clientId);
        if (userClients.size === 0) {
          this.userConnections.delete(client.userId);
        }
      }
    }

    // Close the connection
    try {
      client.controller.close();
    } catch (error) {
      // Connection might already be closed
      log.debug("Error closing client connection", { clientId, error });
    }

    this.clients.delete(clientId);

    log.info("Client disconnected", {
      clientId,
      userId: client.userId,
      totalConnections: this.clients.size,
    });
  }

  /**
   * Send event to a specific client
   */
  sendToClient(clientId: string, event: SSEEvent): boolean {
    const client = this.clients.get(clientId);
    if (!client) {
      log.warn("Attempted to send to non-existent client", { clientId });
      return false;
    }

    try {
      const sseData = this.formatSSEMessage(event);
      client.controller.enqueue(new TextEncoder().encode(sseData));

      log.debug("Event sent to client", {
        clientId,
        eventType: event.type,
        userId: client.userId,
      });

      return true;
    } catch (error) {
      log.error("Failed to send event to client", {
        clientId,
        eventType: event.type,
        error,
      });

      // Remove dead connection
      this.removeClient(clientId);
      return false;
    }
  }

  /**
   * Send event to all clients of a specific user
   */
  sendToUser(userId: string, event: SSEEvent): number {
    const userClients = this.userConnections.get(userId);
    if (!userClients || userClients.size === 0) {
      log.debug("No connections found for user", { userId });
      return 0;
    }

    let successCount = 0;
    for (const clientId of userClients) {
      if (this.sendToClient(clientId, event)) {
        successCount++;
      }
    }

    log.info("Event sent to user", {
      userId,
      eventType: event.type,
      clientsSent: successCount,
      totalClients: userClients.size,
    });

    return successCount;
  }

  /**
   * Broadcast event to all connected clients
   */
  broadcast(event: SSEEvent): number {
    let successCount = 0;

    for (const clientId of this.clients.keys()) {
      if (this.sendToClient(clientId, event)) {
        successCount++;
      }
    }

    log.info("Event broadcasted", {
      eventType: event.type,
      clientsSent: successCount,
      totalClients: this.clients.size,
    });

    return successCount;
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      totalConnections: this.clients.size,
      uniqueUsers: this.userConnections.size,
      connectionsByUser: Array.from(this.userConnections.entries()).map(
        ([userId, clients]) => ({
          userId,
          connectionCount: clients.size,
        }),
      ),
    };
  }

  /**
   * Format SSE message according to the SSE protocol
   */
  private formatSSEMessage(event: SSEEvent): string {
    let message = "";

    if (event.id) {
      message += `id: ${event.id}\n`;
    }

    if (event.type) {
      message += `event: ${event.type}\n`;
    }

    if (event.retry) {
      message += `retry: ${event.retry}\n`;
    }

    // Handle multi-line data
    const dataString =
      typeof event.data === "string" ? event.data : JSON.stringify(event.data);

    const dataLines = dataString.split("\n");
    for (const line of dataLines) {
      message += `data: ${line}\n`;
    }

    message += "\n"; // End with double newline

    return message;
  }

  /**
   * Start heartbeat to keep connections alive
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      const deadClients: string[] = [];

      // Check for dead connections
      for (const [clientId, client] of this.clients) {
        if (now - client.lastPing > this.config.connectionTimeout) {
          deadClients.push(clientId);
        }
      }

      // Remove dead connections
      for (const clientId of deadClients) {
        log.info("Removing dead connection", { clientId });
        this.removeClient(clientId);
      }

      // Send heartbeat to remaining clients
      const heartbeatEvent: SSEEvent = {
        type: "heartbeat",
        data: { timestamp: now },
      };

      for (const clientId of this.clients.keys()) {
        if (this.sendToClient(clientId, heartbeatEvent)) {
          // Update last ping time on successful heartbeat
          const client = this.clients.get(clientId);
          if (client) {
            client.lastPing = now;
          }
        }
      }

      log.debug("Heartbeat completed", {
        activeConnections: this.clients.size,
        removedConnections: deadClients.length,
      });
    }, this.config.heartbeatInterval);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    // Close all connections
    for (const clientId of this.clients.keys()) {
      this.removeClient(clientId);
    }

    log.info("SSE Manager destroyed");
  }
}

// Singleton instance
export const sseManager = new SSEManager();

// Cleanup on process exit
process.on("SIGTERM", () => sseManager.destroy());
process.on("SIGINT", () => sseManager.destroy());
