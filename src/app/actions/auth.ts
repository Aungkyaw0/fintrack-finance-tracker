"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function loginAction(formData: {
  email: string;
  password: string;
}) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email.trim(),
      password: formData.password,
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: unknown) {
    console.error("Login action error:", err);
    return {
      error:
        err instanceof Error
          ? err.message
          : "Failed to authenticate with server. Please try again.",
    };
  }
}

export async function registerAction(formData: {
  email: string;
  password: string;
  fullName: string;
}) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email: formData.email.trim(),
      password: formData.password,
      options: {
        data: { full_name: formData.fullName.trim() },
      },
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: unknown) {
    console.error("Register action error:", err);
    return {
      error:
        err instanceof Error
          ? err.message
          : "Failed to create account. Please try again.",
    };
  }
}

export async function signOutAction() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("Sign out action error:", err);
    return { error: "Failed to sign out." };
  }
}

