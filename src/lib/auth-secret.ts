/**
 * Resolve auth secret across NextAuth naming conventions.
 * `AUTH_SECRET` is used by Auth.js (newer), while `NEXTAUTH_SECRET` is common in legacy setups.
 */
export function getAuthSecret(): string | undefined {
  return process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
}
