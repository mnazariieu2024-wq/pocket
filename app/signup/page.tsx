import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = { title: "Sign up — Pocket" };

export default function SignupPage() {
  return (
    <div className="container auth-page">
      <AuthForm mode="signup" />
    </div>
  );
}
