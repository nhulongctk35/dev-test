/**
 * SSE tRPC Router
 *
 * Provides tRPC endpoints for testing and managing SSE functionality.
 */

import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/lib/trpc";
import {
  sendUserNotification,
  sendUserSystemEvent,
  broadcastNotification,
  broadcastSystemEvent,
  getSSEStats,
  notifications,
  broadcasts,
} from "@/lib/sse";

export const sseRouter = createTRPCRouter({
  /**
   * Get SSE connection statistics
   */
  getStats: publicProcedure.query(() => {
    return getSSEStats();
  }),

  /**
   * Send a test notification to the current user
   */
  sendTestNotification: protectedProcedure
    .input(
      z.object({
        type: z.enum(["info", "success", "warning", "error"]).default("info"),
        title: z.string().optional(),
        message: z.string(),
        data: z.record(z.any()).optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const sentCount = sendUserNotification(ctx.session.user.id, {
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data,
      });

      return {
        success: true,
        sentToClients: sentCount,
        message: `Notification sent to ${sentCount} client(s)`,
      };
    }),

  /**
   * Send a test system event to the current user
   */
  sendTestSystemEvent: protectedProcedure
    .input(
      z.object({
        event: z.string(),
        data: z.record(z.any()),
      }),
    )
    .mutation(({ ctx, input }) => {
      const sentCount = sendUserSystemEvent(ctx.session.user.id, {
        event: input.event,
        data: input.data,
      });

      return {
        success: true,
        sentToClients: sentCount,
        message: `System event sent to ${sentCount} client(s)`,
      };
    }),

  /**
   * Broadcast a test notification to all users
   */
  broadcastTestNotification: protectedProcedure
    .input(
      z.object({
        type: z.enum(["info", "success", "warning", "error"]).default("info"),
        title: z.string().optional(),
        message: z.string(),
        data: z.record(z.any()).optional(),
      }),
    )
    .mutation(({ input }) => {
      const sentCount = broadcastNotification({
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data,
      });

      return {
        success: true,
        sentToClients: sentCount,
        message: `Notification broadcasted to ${sentCount} client(s)`,
      };
    }),

  /**
   * Broadcast a test system event to all users
   */
  broadcastTestSystemEvent: protectedProcedure
    .input(
      z.object({
        event: z.string(),
        data: z.record(z.any()),
      }),
    )
    .mutation(({ input }) => {
      const sentCount = broadcastSystemEvent({
        event: input.event,
        data: input.data,
      });

      return {
        success: true,
        sentToClients: sentCount,
        message: `System event broadcasted to ${sentCount} client(s)`,
      };
    }),

  /**
   * Send convenience notifications
   */
  sendSuccess: protectedProcedure
    .input(
      z.object({
        message: z.string(),
        title: z.string().optional(),
        data: z.record(z.any()).optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const sentCount = notifications.success(
        ctx.session.user.id,
        input.message,
        input.title,
        input.data,
      );

      return {
        success: true,
        sentToClients: sentCount,
        message: `Success notification sent to ${sentCount} client(s)`,
      };
    }),

  sendError: protectedProcedure
    .input(
      z.object({
        message: z.string(),
        title: z.string().optional(),
        data: z.record(z.any()).optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const sentCount = notifications.error(
        ctx.session.user.id,
        input.message,
        input.title,
        input.data,
      );

      return {
        success: true,
        sentToClients: sentCount,
        message: `Error notification sent to ${sentCount} client(s)`,
      };
    }),

  sendInfo: protectedProcedure
    .input(
      z.object({
        message: z.string(),
        title: z.string().optional(),
        data: z.record(z.any()).optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const sentCount = notifications.info(
        ctx.session.user.id,
        input.message,
        input.title,
        input.data,
      );

      return {
        success: true,
        sentToClients: sentCount,
        message: `Info notification sent to ${sentCount} client(s)`,
      };
    }),

  sendWarning: protectedProcedure
    .input(
      z.object({
        message: z.string(),
        title: z.string().optional(),
        data: z.record(z.any()).optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const sentCount = notifications.warning(
        ctx.session.user.id,
        input.message,
        input.title,
        input.data,
      );

      return {
        success: true,
        sentToClients: sentCount,
        message: `Warning notification sent to ${sentCount} client(s)`,
      };
    }),

  /**
   * Broadcast convenience notifications
   */
  broadcastSuccess: protectedProcedure
    .input(
      z.object({
        message: z.string(),
        title: z.string().optional(),
        data: z.record(z.any()).optional(),
      }),
    )
    .mutation(({ input }) => {
      const sentCount = broadcasts.success(
        input.message,
        input.title,
        input.data,
      );

      return {
        success: true,
        sentToClients: sentCount,
        message: `Success notification broadcasted to ${sentCount} client(s)`,
      };
    }),

  broadcastError: protectedProcedure
    .input(
      z.object({
        message: z.string(),
        title: z.string().optional(),
        data: z.record(z.any()).optional(),
      }),
    )
    .mutation(({ input }) => {
      const sentCount = broadcasts.error(
        input.message,
        input.title,
        input.data,
      );

      return {
        success: true,
        sentToClients: sentCount,
        message: `Error notification broadcasted to ${sentCount} client(s)`,
      };
    }),

  broadcastInfo: protectedProcedure
    .input(
      z.object({
        message: z.string(),
        title: z.string().optional(),
        data: z.record(z.any()).optional(),
      }),
    )
    .mutation(({ input }) => {
      const sentCount = broadcasts.info(input.message, input.title, input.data);

      return {
        success: true,
        sentToClients: sentCount,
        message: `Info notification broadcasted to ${sentCount} client(s)`,
      };
    }),

  broadcastWarning: protectedProcedure
    .input(
      z.object({
        message: z.string(),
        title: z.string().optional(),
        data: z.record(z.any()).optional(),
      }),
    )
    .mutation(({ input }) => {
      const sentCount = broadcasts.warning(
        input.message,
        input.title,
        input.data,
      );

      return {
        success: true,
        sentToClients: sentCount,
        message: `Warning notification broadcasted to ${sentCount} client(s)`,
      };
    }),
});
