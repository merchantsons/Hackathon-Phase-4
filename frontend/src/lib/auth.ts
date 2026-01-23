import { createAuthClient } from 'better-auth/react';

const BETTER_AUTH_URL = import.meta.env.VITE_BETTER_AUTH_URL || 
  import.meta.env.VITE_BACKEND_API_URL || 
  'https://fastapi-vert-omega.vercel.app';

// Configure Better Auth client
// Note: Backend uses custom endpoints, so we'll use Better Auth for session management
// and custom API calls for authentication
export const authClient = createAuthClient({
  baseURL: BETTER_AUTH_URL,
  fetchOptions: {
    credentials: 'include',
  },
});

export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
