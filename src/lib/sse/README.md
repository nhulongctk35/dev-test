# Server-Sent Events (SSE) Library

A comprehensive Server-Sent Events implementation for real-time, server-to-client notifications in Next.js applications.

## Features

- ✅ **Centralized SSE Manager**: Track active client connections per user/session
- ✅ **Event Dispatching**: Send named events with JSON payloads to specific clients or broadcast to multiple clients
- ✅ **Connection Lifecycle Management**: Handle connect, disconnect, and error scenarios
- ✅ **Backend Integration API**: Clean interface for backend modules to send notifications
- ✅ **Heartbeat/Ping System**: Keep connections alive and detect dead connections
- ✅ **Resource Cleanup**: Proper cleanup of client connections on disconnect/errors
- ✅ **Error Handling & Logging**: Comprehensive error handling and structured logging
- ✅ **React Hook**: Client-side hook for easy SSE integration
- ✅ **tRPC Integration**: Ready-to-use tRPC endpoints for testing and management

## Architecture

### Core Components

1. **SSE Manager** (`src/lib/sse/manager.ts`)
   - Singleton service managing all SSE connections
   - Tracks clients by ID and user associations
   - Handles heartbeat and connection cleanup

2. **API Route** (`src/app/api/sse/route.ts`)
   - Next.js API route handling SSE connections
   - Integrates with NextAuth for user authentication
   - Manages ReadableStream for SSE protocol

3. **Notification Utilities** (`src/lib/sse/notifications.ts`)
   - High-level functions for sending notifications
   - Convenience methods for different notification types
   - Backend integration helpers

4. **Client Hook** (`src/lib/sse/client-hook.ts`)
   - React hook for client-side SSE connections
   - Automatic reconnection and error handling
   - Message state management

5. **tRPC Router** (`src/features/sse/router.ts`)
   - Testing and management endpoints
   - Statistics and connection monitoring
   - Demo functionality

## Usage

### Backend Integration

#### Send User Notifications

```typescript
import { notifications } from "@/lib/sse";

// Send success notification
notifications.success(userId, "Operation completed successfully!");

// Send error notification
notifications.error(userId, "Something went wrong", "Error Title");

// Send custom notification
sendUserNotification(userId, {
  type: "info",
  title: "Custom Notification",
  message: "This is a custom message",
  data: { customField: "value" },
});
```

#### Broadcast Notifications

```typescript
import { broadcasts } from "@/lib/sse";

// Broadcast to all connected users
broadcasts.info("System maintenance in 5 minutes");

// Custom broadcast
broadcastNotification({
  type: "warning",
  title: "System Alert",
  message: "Please save your work",
  data: { maintenanceTime: "2024-01-01T10:00:00Z" },
});
```

#### Send System Events

```typescript
import { sendUserSystemEvent, broadcastSystemEvent } from "@/lib/sse";

// Send system event to specific user
sendUserSystemEvent(userId, {
  event: "user_profile_updated",
  data: { profileId: "123", changes: ["name", "email"] },
});

// Broadcast system event
broadcastSystemEvent({
  event: "server_maintenance",
  data: { startTime: "2024-01-01T10:00:00Z", duration: "30min" },
});
```

### Frontend Integration

#### Using the React Hook

```typescript
import { useSSE } from "@/lib/sse";

function MyComponent() {
  const {
    isConnected,
    isConnecting,
    lastMessage,
    messages,
    error,
    connect,
    disconnect,
    clearMessages
  } = useSSE({
    onConnect: () => console.log("Connected to SSE"),
    onDisconnect: () => console.log("Disconnected from SSE"),
    onMessage: (message) => {
      console.log("Received:", message);

      // Handle different message types
      if (message.type === "notification") {
        showNotification(message.data);
      } else if (message.type === "system") {
        handleSystemEvent(message.data);
      }
    },
    onError: (error) => console.error("SSE Error:", error)
  });

  return (
    <div>
      <div>Status: {isConnected ? "Connected" : "Disconnected"}</div>
      {lastMessage && (
        <div>Last message: {JSON.stringify(lastMessage.data)}</div>
      )}
    </div>
  );
}
```

### tRPC Integration

```typescript
import { api } from "@/trpc/react";

function AdminPanel() {
  const sendNotification = api.sse.sendSuccess.useMutation();
  const { data: stats } = api.sse.getStats.useQuery();

  const handleSendNotification = async () => {
    await sendNotification.mutateAsync({
      message: "Hello from admin!",
      title: "Admin Message"
    });
  };

  return (
    <div>
      <div>Active connections: {stats?.totalConnections}</div>
      <button onClick={handleSendNotification}>
        Send Test Notification
      </button>
    </div>
  );
}
```

## Configuration

### SSE Manager Configuration

```typescript
import { SSEManager } from "@/lib/sse/manager";

const manager = new SSEManager({
  heartbeatInterval: 30000, // 30 seconds
  connectionTimeout: 60000, // 60 seconds
  maxConnections: 1000, // Maximum concurrent connections
});
```

### Client Hook Configuration

```typescript
const sse = useSSE({
  url: "/api/sse", // SSE endpoint URL
  reconnect: true, // Enable auto-reconnection
  reconnectInterval: 3000, // 3 seconds between reconnection attempts
  maxReconnectAttempts: 5, // Maximum reconnection attempts
  onConnect: () => {}, // Connection established callback
  onDisconnect: () => {}, // Connection lost callback
  onError: (error) => {}, // Error callback
  onMessage: (message) => {}, // Message received callback
});
```

## Event Types

### Standard Event Types

- `connection` - Connection status events
- `heartbeat` - Keep-alive ping messages
- `notification` - User notifications
- `system` - System events

### Message Format

```typescript
interface SSEMessage {
  type: string; // Event type
  data: any; // Event payload
  id?: string; // Optional event ID
  timestamp: number; // Client-side timestamp
}
```

### Notification Payload

```typescript
interface NotificationPayload {
  title?: string; // Optional title
  message: string; // Main message
  type?: "info" | "success" | "warning" | "error"; // Notification type
  data?: Record<string, any>; // Additional data
  timestamp?: number; // Optional timestamp
}
```

## Demo

Visit `/sse-demo` to see the SSE system in action. The demo page includes:

- Real-time connection status
- Connection statistics
- Test notification sending
- Message history display
- Various notification types
- Broadcast functionality

## Error Handling

The SSE system includes comprehensive error handling:

- **Connection Errors**: Automatic reconnection with exponential backoff
- **Dead Connection Detection**: Heartbeat system removes stale connections
- **Resource Cleanup**: Proper cleanup on client disconnect
- **Error Logging**: Structured logging for debugging

## Performance Considerations

- **Connection Limits**: Configurable maximum connections per instance
- **Memory Management**: Automatic cleanup of dead connections
- **Heartbeat Optimization**: Configurable heartbeat intervals
- **Message Queuing**: No message queuing (real-time only)

## Security

- **Authentication**: Integrates with NextAuth for user identification
- **CORS**: Configurable CORS headers
- **Rate Limiting**: Can be integrated with existing rate limiting
- **Input Validation**: All inputs validated through tRPC schemas

## Monitoring

Use the stats endpoint to monitor SSE performance:

```typescript
import { getSSEStats } from "@/lib/sse";

const stats = getSSEStats();
console.log({
  totalConnections: stats.totalConnections,
  uniqueUsers: stats.uniqueUsers,
  connectionsByUser: stats.connectionsByUser,
});
```
