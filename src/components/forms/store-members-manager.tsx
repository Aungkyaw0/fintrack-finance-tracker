"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MemberWithUser,
  StoreRole,
  inviteMemberAction,
  updateMemberRoleAction,
  removeMemberAction,
} from "@/app/actions/members";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  UserPlus,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Trash2,
  Loader2,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function StoreMembersManager({
  storeId,
  members,
  currentUserRole,
}: {
  storeId: string;
  members: MemberWithUser[];
  currentUserRole: StoreRole | null;
}) {
  const router = useRouter();
  const [openInvite, setOpenInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"manager" | "staff">("staff");
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const isOwner = currentUserRole === "owner";
  const canInvite = isOwner || currentUserRole === "manager";

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    const res = await inviteMemberAction(storeId, email, role);
    setLoading(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    toast.success("Team member added successfully!");
    setEmail("");
    setRole("staff");
    setOpenInvite(false);
    router.refresh();
  }

  async function handleRoleChange(memberId: string, newRole: "manager" | "staff") {
    const res = await updateMemberRoleAction(storeId, memberId, newRole);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Role updated successfully!");
      router.refresh();
    }
  }

  async function handleRemove(memberId: string, name: string) {
    if (!confirm(`Are you sure you want to remove ${name} from this store?`)) {
      return;
    }

    setRemovingId(memberId);
    const res = await removeMemberAction(storeId, memberId);
    setRemovingId(null);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Member removed from store.");
      router.refresh();
    }
  }

  const roleBadges: Record<
    StoreRole,
    { label: string; className: string; icon: React.ReactNode }
  > = {
    owner: {
      label: "Owner (ပိုင်ရှင်)",
      className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      icon: <Crown className="w-3 h-3 mr-1 text-amber-500" />,
    },
    manager: {
      label: "Manager (မန်နေဂျာ)",
      className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      icon: <ShieldCheck className="w-3 h-3 mr-1 text-blue-500" />,
    },
    staff: {
      label: "Staff / Cashier (အရောင်းစာရေး)",
      className: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
      icon: <UserCheck className="w-3 h-3 mr-1 text-slate-500" />,
    },
  };

  return (
    <Card className="border bg-card">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <CardTitle className="text-base font-bold text-foreground">
              Team &amp; Staff Members (အဖွဲ့ဝင်များ)
            </CardTitle>
          </div>
          <CardDescription className="text-xs mt-0.5">
            Manage who can record sales, view reports, or configure store settings.
          </CardDescription>
        </div>

        {canInvite && (
          <Dialog open={openInvite} onOpenChange={setOpenInvite}>
            <DialogTrigger
              render={
                <Button size="sm" className="gap-1.5 shadow-xs font-semibold">
                  <UserPlus className="w-4 h-4" />
                  <span>Invite Member</span>
                </Button>
              }
            />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-foreground">
                  Invite Store Member
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Grant a colleague access to this store.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleInvite} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="mem-email" className="text-xs font-medium text-foreground">
                    Email Address
                  </Label>
                  <Input
                    id="mem-email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background text-foreground"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Must be registered with this email on FinTrack.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="mem-role" className="text-xs font-medium text-foreground">
                    Role &amp; Permissions
                  </Label>
                  <Select
                    value={role}
                    onValueChange={(val) => setRole((val as "manager" | "staff") || "staff")}
                  >
                    <SelectTrigger id="mem-role" className="w-full bg-background text-foreground">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {isOwner && (
                        <SelectItem value="manager">
                          <div className="space-y-0.5 text-left py-1">
                            <span className="font-semibold block text-xs">Manager</span>
                            <span className="text-[11px] text-muted-foreground block">
                              Can manage inventory, sales, purchases, expenses &amp; view reports.
                            </span>
                          </div>
                        </SelectItem>
                      )}
                      <SelectItem value="staff">
                        <div className="space-y-0.5 text-left py-1">
                          <span className="font-semibold block text-xs">
                            Staff / Cashier (အရောင်းစာရေး)
                          </span>
                          <span className="text-[11px] text-muted-foreground block">
                            Can record sales &amp; check inventory counts. Hidden from expenses, net profit, and store settings.
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOpenInvite(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={loading} className="gap-1.5">
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Confirm Invite</span>
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        <div className="divide-y border rounded-xl overflow-hidden bg-card">
          {members.map((m) => {
            const badge = roleBadges[m.role] || roleBadges.staff;
            const displayName = m.fullName || m.email.split("@")[0];

            return (
              <div
                key={m.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 gap-3 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0 uppercase">
                    {displayName.slice(0, 2)}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground truncate">
                        {m.fullName || displayName}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] py-0.5 px-2 font-medium flex items-center ${badge.className}`}
                      >
                        {badge.icon}
                        <span>{badge.label}</span>
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                  </div>
                </div>

                {/* Actions: change role or remove member */}
                {isOwner && !m.isOwner && (
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Select
                      value={m.role}
                      onValueChange={(val) =>
                        handleRoleChange(m.id, val as "manager" | "staff")
                      }
                    >
                      <SelectTrigger className="h-8 text-xs w-32 bg-background text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="staff">Staff / Cashier</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(m.id, m.fullName || m.email)}
                      disabled={removingId === m.id}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Remove member"
                    >
                      {removingId === m.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

