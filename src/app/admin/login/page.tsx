import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Admin Sign In",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="glass-card w-full max-w-md rounded-2xl p-8 sm:p-10">
        <div className="mb-8 text-center">
          <p className="text-label-sm text-primary mb-2 font-mono tracking-widest uppercase">
            Expervia Admin
          </p>
          <h1 className="font-display text-headline-md text-on-surface font-bold">
            Sign in to continue
          </h1>
          <p className="text-on-surface-variant mt-2 text-sm">
            Community application review — authorized staff only.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
