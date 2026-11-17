"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await loginAction({
        email,
        password,
      });

      if (res.error) {
        toast.error(res.error || "Login failed. Please check your credentials.");
        setLoading(false);
        return;
      }

      toast.success("Welcome back!");
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to connect to authentication server.";
      toast.error(msg);
      setLoading(false);
    }
  }

  return (
    <Card className="border border-border/80 shadow-lg shadow-black/5 dark:shadow-black/20 backdrop-blur-xs">
      <CardHeader className="space-y-3 pb-4">
        {/* Mobile Tab Switcher */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-muted/80 border border-border/50 text-xs font-semibold">
          <button
            type="button"
            className="py-2 text-center rounded-lg bg-card text-foreground shadow-2xs font-bold transition-all"
          >
            {t("auth.login")}
          </button>
          <Link
            href="/auth/register"
            className="py-2 text-center rounded-lg text-muted-foreground hover:text-foreground transition-all"
          >
            {t("auth.register")}
          </Link>
        </div>

        <div className="pt-2">
          <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">
            {t("auth.loginTitle")}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm mt-1 text-muted-foreground">
            {t("auth.email")} &amp; {t("auth.password")}
          </CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4 pt-1 pb-6">
          {/* Email input with icon */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold">
              {t("auth.email")}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="pl-10 h-11 text-sm bg-background border-border"
              />
            </div>
          </div>

          {/* Password input with icon & toggle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold">
                {t("auth.password")}
              </Label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="pl-10 pr-10 h-11 text-sm bg-background border-border"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3.5 pt-5 pb-5 border-t border-border/50">
          <Button
            type="submit"
            className="w-full h-11 text-sm font-semibold gap-2 shadow-sm"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t("common.loading")}...</span>
              </>
            ) : (
              <>
                <span>{t("auth.login")}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secure SSL Encrypted Connection</span>
          </div>

          <p className="text-xs text-center text-muted-foreground pt-1">
            {t("auth.noAccount")}{" "}
            <Link
              href="/auth/register"
              className="text-primary hover:underline font-semibold"
            >
              {t("auth.register")}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
