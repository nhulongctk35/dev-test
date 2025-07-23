/**
 * Client-safe exports for the authentication module.
 * This file only exports client-side components and hooks.
 */

// Client-side hooks
export { useSession } from "./hooks/useSession";
export { usePublicSession } from "./hooks/usePublicSession";

// Client-side providers
export { SessionProvider } from "./contexts/SessionContext";
export { PublicSessionProvider } from "./contexts/PublicSessionContext";

// Public types that are safe for client-side use
export * from "./types/public";
