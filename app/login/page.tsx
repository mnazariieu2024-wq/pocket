import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = { title: "Log in — Pocket" };

export default function LoginPage() {
  return (
    <div className="container auth-page">
      <AuthForm mode="login" />
    </div>
  );
}
