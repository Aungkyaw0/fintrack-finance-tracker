"use server";

import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import type { Locale } from "@/i18n/request";

export async function setLocaleAction(locale: Locale) {
  const cookieStore = await cookies();
  cookieStore.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });

  const currentUser = await getCurrentUser();
  if (currentUser) {
    try {
      await db
        .update(users)
        .set({ preferredLanguage: locale, updatedAt: new Date() })
        .where(eq(users.id, currentUser.id));
    } catch (e) {
      console.error("Failed to update user preferred language:", e);
    }
  }

  return { success: true };
}
