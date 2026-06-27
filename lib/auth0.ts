import { Auth0Client } from "@auth0/nextjs-auth0/server";

// Auth0 is the identity layer (human approver login + machine identity for the
// agent). It's optional locally: when the env isn't set, the app runs without
// login and the agent uses localhost dev auth.
export const auth0Configured = Boolean(
  process.env.AUTH0_DOMAIN && process.env.AUTH0_CLIENT_ID && process.env.AUTH0_SECRET,
);

export const auth0 = auth0Configured ? new Auth0Client() : null;

export async function getOptionalUser(): Promise<{ email?: string | null; name?: string | null } | null> {
  if (!auth0) return null;
  try {
    const session = await auth0.getSession();
    return session?.user ?? null;
  } catch {
    return null;
  }
}
