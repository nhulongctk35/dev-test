/**
 * SSE Demo Page (Universal Route)
 *
 * A page to demonstrate the Server-Sent Events functionality.
 * Accessible without authentication.
 */

import { SSEDemo } from "@/features/sse";

export default function SSEDemoPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <SSEDemo />
    </div>
  );
}

export const metadata = {
  title: "SSE Demo - Real-time Notifications",
  description:
    "Demonstration of Server-Sent Events for real-time notifications",
};
