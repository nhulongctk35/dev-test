"use client";

/**
 * SSE Demo Component
 *
 * A simple UI component to demonstrate and test SSE functionality.
 */

import { useState } from "react";
import Link from "next/link";
import { useSSE } from "@/lib/sse/client";
import { api } from "@/trpc/react";
import { usePublicSession } from "../../auth/client";

export function SSEDemo() {
  const session = usePublicSession();
  const [testMessage, setTestMessage] = useState("");
  const [testTitle, setTestTitle] = useState("");
  const [notificationType, setNotificationType] = useState<
    "info" | "success" | "warning" | "error"
  >("info");

  // SSE Hook
  const {
    isConnected,
    isConnecting,
    lastMessage,
    messages,
    error,
    connect,
    disconnect,
    clearMessages,
  } = useSSE({
    onConnect: () => console.log("SSE Connected!"),
    onDisconnect: () => console.log("SSE Disconnected!"),
    onError: (error) => console.error("SSE Error:", error),
    onMessage: (message) => console.log("SSE Message:", message),
  });

  // tRPC mutations for testing
  const sendTestNotification = api.sse.sendTestNotification.useMutation();
  const sendTestSystemEvent = api.sse.sendTestSystemEvent.useMutation();
  const broadcastTestNotification =
    api.sse.broadcastTestNotification.useMutation();
  const sendSuccess = api.sse.sendSuccess.useMutation();
  const sendError = api.sse.sendError.useMutation();
  const sendInfo = api.sse.sendInfo.useMutation();
  const sendWarning = api.sse.sendWarning.useMutation();

  // SSE Stats query (only when authenticated)
  const { data: stats, refetch: refetchStats } = api.sse.getStats.useQuery(
    undefined,
    {
      refetchInterval: 5000,
      enabled: !!session?.user,
    },
  );

  const handleSendTestNotification = async () => {
    if (!testMessage.trim() || !session?.user) return;

    try {
      await sendTestNotification.mutateAsync({
        type: notificationType,
        title: testTitle.trim() || undefined,
        message: testMessage.trim(),
        data: { timestamp: Date.now(), source: "demo" },
      });
      setTestMessage("");
      setTestTitle("");
    } catch (error) {
      console.error("Failed to send test notification:", error);
    }
  };

  const handleSendSystemEvent = async () => {
    if (!session?.user) return;

    try {
      await sendTestSystemEvent.mutateAsync({
        event: "demo_system_event",
        data: {
          message: "This is a test system event",
          timestamp: Date.now(),
          source: "demo",
        },
      });
    } catch (error) {
      console.error("Failed to send system event:", error);
    }
  };

  const handleBroadcastNotification = async () => {
    if (!testMessage.trim() || !session?.user) return;

    try {
      await broadcastTestNotification.mutateAsync({
        type: notificationType,
        title: testTitle.trim() || undefined,
        message: `[BROADCAST] ${testMessage.trim()}`,
        data: { timestamp: Date.now(), source: "demo_broadcast" },
      });
    } catch (error) {
      console.error("Failed to broadcast notification:", error);
    }
  };

  const handleQuickNotification = async (
    type: "success" | "error" | "info" | "warning",
  ) => {
    if (!session?.user) return;

    const messages = {
      success: "Operation completed successfully!",
      error: "Something went wrong!",
      info: "Here's some information for you.",
      warning: "Please be careful with this action.",
    };

    try {
      const mutation = {
        success: sendSuccess,
        error: sendError,
        info: sendInfo,
        warning: sendWarning,
      }[type];
      await mutation.mutateAsync({
        message: messages[type],
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Notification`,
        data: { timestamp: Date.now(), source: "quick_demo" },
      });
    } catch (error) {
      console.error(`Failed to send ${type} notification:`, error);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-md">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">
          Server-Sent Events (SSE) Demo
        </h1>

        {/* Authentication Status */}
        <div className="mb-4 rounded-lg border border-gray-300 p-3">
          {session?.user ? (
            <div className="rounded border border-green-300 bg-green-100 p-3 text-green-800">
              ✅ Authenticated as{" "}
              <strong className="text-green-900">
                {session.user.name ?? session.user.email}
              </strong>
              <div className="mt-1 text-sm text-green-700">
                You can test all SSE features including sending notifications.
              </div>
            </div>
          ) : (
            <div className="rounded border border-blue-300 bg-blue-100 p-3 text-blue-800">
              ℹ️ Not authenticated - You can still connect to SSE and receive
              messages, but sending test notifications requires authentication.
              <div className="mt-1 text-sm text-blue-700">
                <Link
                  href="/api/auth/signin"
                  className="font-medium text-blue-800 underline hover:no-underline"
                >
                  Sign in
                </Link>{" "}
                to test the full functionality.
              </div>
            </div>
          )}
        </div>

        {/* Connection Status */}
        <div className="mb-6 rounded-lg border border-gray-300 bg-white p-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div
                className={`h-3 w-3 rounded-full ${
                  isConnected
                    ? "bg-green-500"
                    : isConnecting
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
              />
              <span className="text-sm font-medium text-gray-900">
                {isConnected
                  ? "Connected"
                  : isConnecting
                    ? "Connecting..."
                    : "Disconnected"}
              </span>
            </div>

            <button
              onClick={isConnected ? disconnect : connect}
              className={`rounded px-3 py-1 text-sm font-medium ${
                isConnected
                  ? "border border-red-300 bg-red-100 text-red-800 hover:bg-red-200"
                  : "border border-green-300 bg-green-100 text-green-800 hover:bg-green-200"
              }`}
            >
              {isConnected ? "Disconnect" : "Connect"}
            </button>

            <button
              onClick={clearMessages}
              className="rounded border border-gray-300 bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800 hover:bg-gray-200"
            >
              Clear Messages
            </button>
          </div>

          {error && (
            <div className="mt-2 rounded border border-red-300 bg-red-100 p-2 text-sm text-red-800">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        {/* Connection Stats */}
        {stats && (
          <div className="mb-6 rounded-lg border border-gray-300 bg-white p-4">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Connection Statistics
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-gray-800">
                <span className="font-medium text-gray-900">
                  Total Connections:
                </span>{" "}
                {stats.totalConnections}
              </div>
              <div className="text-gray-800">
                <span className="font-medium text-gray-900">Unique Users:</span>{" "}
                {stats.uniqueUsers}
              </div>
            </div>
          </div>
        )}

        {/* Test Controls */}
        <div className="space-y-4 rounded-lg border border-gray-300 bg-white p-4">
          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-900">
              Send Test Notification
            </h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900">
                  Notification Type
                </label>
                <select
                  value={notificationType}
                  onChange={(e) =>
                    setNotificationType(
                      e.target.value as
                        | "info"
                        | "success"
                        | "warning"
                        | "error",
                    )
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  placeholder="Enter notification title..."
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900">
                  Message
                </label>
                <textarea
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Enter your test message..."
                  rows={3}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={handleSendTestNotification}
                  disabled={
                    !testMessage.trim() ||
                    sendTestNotification.isPending ||
                    !session?.user
                  }
                  className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  title={!session?.user ? "Authentication required" : ""}
                >
                  {sendTestNotification.isPending ? "Sending..." : "Send to Me"}
                </button>

                <button
                  onClick={handleBroadcastNotification}
                  disabled={
                    !testMessage.trim() ||
                    broadcastTestNotification.isPending ||
                    !session?.user
                  }
                  className="rounded-md bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                  title={!session?.user ? "Authentication required" : ""}
                >
                  {broadcastTestNotification.isPending
                    ? "Broadcasting..."
                    : "Broadcast to All"}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6">
            <h3 className="mb-3 text-lg font-semibold text-gray-900">
              Quick Test Actions
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleQuickNotification("success")}
                disabled={!session?.user}
                className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                title={!session?.user ? "Authentication required" : ""}
              >
                Send Success
              </button>
              <button
                onClick={() => handleQuickNotification("error")}
                disabled={!session?.user}
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                title={!session?.user ? "Authentication required" : ""}
              >
                Send Error
              </button>
              <button
                onClick={() => handleQuickNotification("info")}
                disabled={!session?.user}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                title={!session?.user ? "Authentication required" : ""}
              >
                Send Info
              </button>
              <button
                onClick={() => handleQuickNotification("warning")}
                disabled={!session?.user}
                className="rounded-md bg-yellow-600 px-3 py-2 text-sm font-medium text-white hover:bg-yellow-700 disabled:cursor-not-allowed disabled:opacity-50"
                title={!session?.user ? "Authentication required" : ""}
              >
                Send Warning
              </button>
              <button
                onClick={handleSendSystemEvent}
                disabled={!session?.user}
                className="rounded-md bg-gray-600 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                title={!session?.user ? "Authentication required" : ""}
              >
                Send System Event
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Display */}
      <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-md">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Received Messages ({messages.length})
        </h2>

        {lastMessage && (
          <div className="mb-4 rounded border border-l-4 border-blue-300 border-l-blue-500 bg-blue-100 p-3">
            <h4 className="font-medium text-blue-900">Latest Message:</h4>
            <div className="mt-1 text-sm text-blue-800">
              <div>
                <strong className="text-blue-900">Type:</strong>{" "}
                {lastMessage.type}
              </div>
              <div>
                <strong className="text-blue-900">Data:</strong>{" "}
                <pre className="inline font-mono text-xs text-blue-800">
                  {JSON.stringify(lastMessage.data, null, 2)}
                </pre>
              </div>
              <div>
                <strong className="text-blue-900">Time:</strong>{" "}
                {new Date(lastMessage.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}

        <div className="max-h-96 space-y-2 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="rounded-lg border border-gray-200 bg-gray-50 py-8 text-center text-gray-600">
              No messages received yet. Try sending a test notification!
            </p>
          ) : (
            messages
              .slice()
              .reverse()
              .map((message, index) => (
                <div
                  key={`${message.timestamp}-${index}`}
                  className={`rounded-lg border border-l-4 p-3 ${
                    message.type === "notification"
                      ? "border-green-300 border-l-green-500 bg-green-100"
                      : message.type === "system"
                        ? "border-yellow-300 border-l-yellow-500 bg-yellow-100"
                        : message.type === "heartbeat"
                          ? "border-gray-300 border-l-gray-500 bg-gray-100"
                          : "border-blue-300 border-l-blue-500 bg-blue-100"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {message.type.toUpperCase()}
                        {message.id && (
                          <span className="ml-2 text-xs text-gray-600">
                            ID: {message.id}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm">
                        <pre className="font-mono text-xs whitespace-pre-wrap text-gray-800">
                          {JSON.stringify(message.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                    <div className="ml-4 text-xs font-medium text-gray-600">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
