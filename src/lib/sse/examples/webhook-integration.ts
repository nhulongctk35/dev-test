/**
 * Example: SSE Integration with Webhook Handlers
 *
 * This file demonstrates how to integrate SSE notifications
 * with webhook handlers and other backend processes.
 */

import { notifications, sendUserSystemEvent, broadcasts } from "@/lib/sse";

/**
 * Example: Mux Video Processing Webhook
 *
 * When a video finishes processing, notify the user
 */
export async function handleMuxVideoReady(webhookData: {
  userId: string;
  videoId: string;
  playbackId: string;
  status: string;
}) {
  const { userId, videoId, playbackId, status } = webhookData;

  if (status === "ready") {
    // Send success notification to user
    notifications.success(
      userId,
      "Your video is ready to view!",
      "Video Processing Complete",
      {
        videoId,
        playbackId,
        action: "view_video",
        url: `/videos/${videoId}`,
      },
    );

    // Send system event for UI updates
    sendUserSystemEvent(userId, {
      event: "video_processing_complete",
      data: {
        videoId,
        playbackId,
        status: "ready",
        timestamp: Date.now(),
      },
    });
  } else if (status === "errored") {
    // Send error notification
    notifications.error(
      userId,
      "There was an error processing your video. Please try uploading again.",
      "Video Processing Failed",
      {
        videoId,
        action: "retry_upload",
        supportUrl: "/support",
      },
    );
  }
}

/**
 * Example: Payment Processing
 *
 * Notify users about payment status changes
 */
export async function handlePaymentStatusChange(paymentData: {
  userId: string;
  paymentId: string;
  status: "succeeded" | "failed" | "pending";
  amount: number;
  currency: string;
}) {
  const { userId, paymentId, status, amount, currency } = paymentData;

  switch (status) {
    case "succeeded":
      notifications.success(
        userId,
        `Payment of ${amount} ${currency.toUpperCase()} was successful!`,
        "Payment Confirmed",
        {
          paymentId,
          amount,
          currency,
          action: "view_receipt",
          url: `/payments/${paymentId}`,
        },
      );
      break;

    case "failed":
      notifications.error(
        userId,
        "Your payment could not be processed. Please check your payment method.",
        "Payment Failed",
        {
          paymentId,
          amount,
          currency,
          action: "retry_payment",
          url: `/payments/retry/${paymentId}`,
        },
      );
      break;

    case "pending":
      notifications.info(
        userId,
        "Your payment is being processed. We'll notify you when it's complete.",
        "Payment Processing",
        {
          paymentId,
          amount,
          currency,
        },
      );
      break;
  }
}

/**
 * Example: User Mention in Comments
 *
 * Notify users when they're mentioned
 */
export async function handleUserMention(mentionData: {
  mentionedUserId: string;
  mentionerUserId: string;
  mentionerName: string;
  contentType: "comment" | "post" | "message";
  contentId: string;
  contentPreview: string;
}) {
  const {
    mentionedUserId,
    mentionerName,
    contentType,
    contentId,
    contentPreview,
  } = mentionData;

  notifications.info(
    mentionedUserId,
    `${mentionerName} mentioned you in a ${contentType}: "${contentPreview}"`,
    "You were mentioned",
    {
      contentType,
      contentId,
      action: "view_content",
      url: `/${contentType}s/${contentId}`,
    },
  );

  // Also send a system event for real-time UI updates
  sendUserSystemEvent(mentionedUserId, {
    event: "user_mentioned",
    data: {
      contentType,
      contentId,
      mentionerName,
      timestamp: Date.now(),
    },
  });
}

/**
 * Example: System Maintenance Notifications
 *
 * Broadcast system-wide notifications
 */
export async function notifySystemMaintenance(maintenanceData: {
  startTime: string;
  endTime: string;
  description: string;
  affectedServices: string[];
}) {
  const { startTime, endTime, description, affectedServices } = maintenanceData;

  // Broadcast warning notification
  broadcasts.warning(
    `Scheduled maintenance: ${description}. Services may be unavailable from ${startTime} to ${endTime}.`,
    "System Maintenance Scheduled",
    {
      startTime,
      endTime,
      affectedServices,
      action: "view_status",
      url: "/status",
    },
  );
}

/**
 * Example: Real-time Collaboration
 *
 * Notify users about document changes
 */
export async function handleDocumentUpdate(updateData: {
  documentId: string;
  editorUserId: string;
  editorName: string;
  collaboratorUserIds: string[];
  changeType: "edit" | "comment" | "share";
  changeDescription: string;
}) {
  const {
    documentId,
    editorName,
    collaboratorUserIds,
    changeType,
    changeDescription,
  } = updateData;

  // Notify all collaborators except the editor
  for (const userId of collaboratorUserIds) {
    if (userId !== updateData.editorUserId) {
      notifications.info(
        userId,
        `${editorName} ${changeDescription}`,
        "Document Updated",
        {
          documentId,
          changeType,
          action: "view_document",
          url: `/documents/${documentId}`,
        },
      );

      // Send system event for real-time UI updates
      sendUserSystemEvent(userId, {
        event: "document_updated",
        data: {
          documentId,
          editorName,
          changeType,
          timestamp: Date.now(),
        },
      });
    }
  }
}

/**
 * Example: Background Job Completion
 *
 * Notify users when long-running jobs complete
 */
export async function handleJobCompletion(jobData: {
  userId: string;
  jobId: string;
  jobType: string;
  status: "completed" | "failed";
  result?: any;
  error?: string;
}) {
  const { userId, jobId, jobType, status, result, error } = jobData;

  if (status === "completed") {
    notifications.success(
      userId,
      `Your ${jobType} job has completed successfully!`,
      "Job Completed",
      {
        jobId,
        jobType,
        result,
        action: "view_results",
        url: `/jobs/${jobId}/results`,
      },
    );
  } else {
    notifications.error(
      userId,
      `Your ${jobType} job failed: ${error}`,
      "Job Failed",
      {
        jobId,
        jobType,
        error,
        action: "retry_job",
        url: `/jobs/${jobId}/retry`,
      },
    );
  }
}

/**
 * Example: Social Features
 *
 * Notify users about social interactions
 */
export async function handleSocialInteraction(interactionData: {
  targetUserId: string;
  actorUserId: string;
  actorName: string;
  interactionType: "like" | "follow" | "share" | "comment";
  contentType?: "post" | "video" | "comment";
  contentId?: string;
}) {
  const { targetUserId, actorName, interactionType, contentType, contentId } =
    interactionData;

  let message = "";
  let actionUrl = "";

  switch (interactionType) {
    case "like":
      message = `${actorName} liked your ${contentType}`;
      actionUrl = `/${contentType}s/${contentId}`;
      break;
    case "follow":
      message = `${actorName} started following you`;
      actionUrl = `/profile/${interactionData.actorUserId}`;
      break;
    case "share":
      message = `${actorName} shared your ${contentType}`;
      actionUrl = `/${contentType}s/${contentId}`;
      break;
    case "comment":
      message = `${actorName} commented on your ${contentType}`;
      actionUrl = `/${contentType}s/${contentId}#comments`;
      break;
  }

  notifications.info(targetUserId, message, "New Activity", {
    interactionType,
    contentType,
    contentId,
    actorName,
    action: "view_activity",
    url: actionUrl,
  });
}
