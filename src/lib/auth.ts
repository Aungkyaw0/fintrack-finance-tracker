import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const getCurrentUser = cache(async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  try {
    // Check if user exists in public.users
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (existing) {
      return existing;
    }

    // Auto-sync into public.users if not present
    const fullName =
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "User";

    const [created] = await db
      .insert(users)
      .values({
        id: user.id,
        email: user.email!,
        fullName,
        avatarUrl: user.user_metadata?.avatar_url || null,
        preferredLanguage: "my",
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: user.email!,
          updatedAt: new Date(),
        },
      })
      .returning();

    return created;
  } catch (err) {
    console.error("Error fetching/syncing current user:", err);
    return null;
  }
});
