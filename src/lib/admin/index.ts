import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

/**
 * Check if a user is an admin
 * Supports both database isAdmin field and ADMIN_EMAILS env var for bootstrapping
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, isAdmin: true },
  });

  if (!user) return false;
  if (user.isAdmin) return true;

  // Fallback to env allowlist for bootstrapping
  const adminEmails =
    process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase()) ||
    [];
  return adminEmails.includes(user.email.toLowerCase());
}

/**
 * Server component helper - redirects if not admin
 * Use in server components at the top of the function
 */
export async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const admin = await isUserAdmin(session.user.id);

  if (!admin) {
    redirect("/dashboard");
  }

  return session;
}

/**
 * API route helper - returns error response data if not admin
 * Use in API routes to check admin status
 */
export async function requireAdminApi(): Promise<
  | { session: { user: { id: string; email?: string; name?: string } }; error: null }
  | { session: null; error: string; status: number }
> {
  const session = await auth();

  if (!session?.user?.id) {
    return { session: null, error: "Unauthorized", status: 401 };
  }

  const admin = await isUserAdmin(session.user.id);

  if (!admin) {
    return { session: null, error: "Forbidden - Admin access required", status: 403 };
  }

  return { session: session as { user: { id: string; email?: string; name?: string } }, error: null };
}
