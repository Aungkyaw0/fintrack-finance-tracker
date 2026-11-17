"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { stores, storeMembers, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type StoreRole = "owner" | "manager" | "staff";

export interface MemberWithUser {
  id: string; // storeMembers.id
  userId: string;
  role: StoreRole;
  joinedAt: Date;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  isOwner: boolean;
}

/**
 * Returns the current authenticated user's role for a specific store.
 */
export async function getUserStoreRole(
  storeId: string
): Promise<StoreRole | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  try {
    const [store] = await db
      .select({ ownerId: stores.ownerId })
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (!store) return null;
    if (store.ownerId === user.id) return "owner";

    const [member] = await db
      .select({ role: storeMembers.role })
      .from(storeMembers)
      .where(
        and(eq(storeMembers.storeId, storeId), eq(storeMembers.userId, user.id))
      )
      .limit(1);

    return (member?.role as StoreRole) || null;
  } catch (err) {
    console.error("Failed to get store role:", err);
    return null;
  }
}

/**
 * Get all members of a store, including owner and staff.
 */
export async function getStoreMembers(
  storeId: string
): Promise<MemberWithUser[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  try {
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (!store) return [];

    const rows = await db
      .select({
        id: storeMembers.id,
        userId: storeMembers.userId,
        role: storeMembers.role,
        joinedAt: storeMembers.joinedAt,
        email: users.email,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
      })
      .from(storeMembers)
      .innerJoin(users, eq(users.id, storeMembers.userId))
      .where(eq(storeMembers.storeId, storeId));

    // Map rows and tag store owner
    const mapped: MemberWithUser[] = rows.map((r) => ({
      ...r,
      role: r.userId === store.ownerId ? "owner" : (r.role as StoreRole),
      isOwner: r.userId === store.ownerId,
    }));

    // If owner is somehow not in storeMembers, fetch and prepend owner
    if (!mapped.some((m) => m.userId === store.ownerId)) {
      const [ownerUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, store.ownerId))
        .limit(1);

      if (ownerUser) {
        mapped.unshift({
          id: "owner-" + store.id,
          userId: ownerUser.id,
          role: "owner",
          joinedAt: store.createdAt,
          email: ownerUser.email,
          fullName: ownerUser.fullName,
          avatarUrl: ownerUser.avatarUrl,
          isOwner: true,
        });
      }
    }

    return mapped;
  } catch (error) {
    console.error("Failed to fetch store members:", error);
    return [];
  }
}

/**
 * Invite an existing user to a store as Manager or Staff (Cashier).
 */
export async function inviteMemberAction(
  storeId: string,
  email: string,
  role: "manager" | "staff"
) {
  const currentRole = await getUserStoreRole(storeId);
  if (!currentRole || (currentRole !== "owner" && currentRole !== "manager")) {
    return { error: "Only the store owner or manager can invite members." };
  }

  // Managers can only invite staff, not other managers
  if (currentRole === "manager" && role === "manager") {
    return { error: "Only the store owner can assign the Manager role." };
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    return { error: "Please provide a valid email address." };
  }

  try {
    // 1. Find user by email in PostgreSQL users table
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (!targetUser) {
      return {
        error:
          "No registered user found with this email. Please ask them to register on FinTrack first.",
      };
    }

    // 2. Check if already a member
    const [existingMember] = await db
      .select()
      .from(storeMembers)
      .where(
        and(
          eq(storeMembers.storeId, storeId),
          eq(storeMembers.userId, targetUser.id)
        )
      )
      .limit(1);

    if (existingMember) {
      return { error: "This user is already a member of this store." };
    }

    // 3. Add to store members
    await db.insert(storeMembers).values({
      storeId,
      userId: targetUser.id,
      role,
    });

    revalidatePath(`/stores/${storeId}/settings`);
    revalidatePath("/dashboard");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to invite member:", err);
    return { error: "Failed to invite member. Please try again." };
  }
}

/**
 * Update member role (Owner only).
 */
export async function updateMemberRoleAction(
  storeId: string,
  memberId: string,
  newRole: "manager" | "staff"
) {
  const currentRole = await getUserStoreRole(storeId);
  if (currentRole !== "owner") {
    return { error: "Only the store owner can change member roles." };
  }

  try {
    const [member] = await db
      .select()
      .from(storeMembers)
      .where(
        and(eq(storeMembers.id, memberId), eq(storeMembers.storeId, storeId))
      )
      .limit(1);

    if (!member) {
      return { error: "Member not found" };
    }

    await db
      .update(storeMembers)
      .set({ role: newRole })
      .where(eq(storeMembers.id, memberId));

    revalidatePath(`/stores/${storeId}/settings`);
    revalidatePath("/dashboard");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("Failed to update role:", err);
    return { error: "Failed to update role." };
  }
}

/**
 * Remove a member from the store.
 */
export async function removeMemberAction(storeId: string, memberId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  const currentRole = await getUserStoreRole(storeId);
  if (currentRole !== "owner") {
    return { error: "Only the store owner can remove team members." };
  }

  try {
    const [member] = await db
      .select()
      .from(storeMembers)
      .where(
        and(eq(storeMembers.id, memberId), eq(storeMembers.storeId, storeId))
      )
      .limit(1);

    if (!member) {
      return { error: "Member record not found" };
    }

    const [store] = await db
      .select({ ownerId: stores.ownerId })
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (store && member.userId === store.ownerId) {
      return { error: "The store owner cannot be removed." };
    }

    await db.delete(storeMembers).where(eq(storeMembers.id, memberId));

    revalidatePath(`/stores/${storeId}/settings`);
    revalidatePath("/dashboard");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("Failed to remove member:", err);
    return { error: "Failed to remove member." };
  }
}

