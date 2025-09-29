"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RegisterForm } from "@workspace/ui/components/register-form";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"github" | "google" | null>(
    null
  );
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerEmail,
          password: registerPassword,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(
          data.message ||
            "Registration successful! Please check your email to verify your account."
        );
        setError("");
      } else {
        setError(data.error || "Registration failed");
        setSuccess("");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="animate-fade-up animate-duration-250 w-full max-w-md">
        <RegisterForm
          email={registerEmail}
          password={registerPassword}
          firstName={firstName}
          lastName={lastName}
          onEmailChange={setRegisterEmail}
          onPasswordChange={setRegisterPassword}
          onFirstNameChange={setFirstName}
          onLastNameChange={setLastName}
          onSubmit={handleRegister}
          loading={loading}
          oauthLoading={oauthLoading}
          error={error}
          success={success}
          onSignIn={() => router.push("/auth/login")}
          onGitHubSignIn={async () => {
            setOauthLoading("github");
            try {
              await signIn("github", { callbackUrl: "/auth/complete" });
            } catch (error) {
              setOauthLoading(null);
              setError("GitHub sign-up failed");
            }
          }}
          onGoogleSignIn={async () => {
            setOauthLoading("google");
            try {
              await signIn("google", { callbackUrl: "/auth/complete" });
            } catch (error) {
              setOauthLoading(null);
              setError("Google sign-up failed");
            }
          }}
        />
      </div>
    </div>
  );
}
