"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RegisterForm } from "@workspace/ui/components/register-form";
import { signIn, useSession } from "next-auth/react";

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
  const { data: session, status } = useSession();

  // Handle redirect after successful registration and login
  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated" && session) {
      const hasTenant = (session.user as any)?.tenantId;
      if (hasTenant) {
        router.push("/notes");
      } else {
        router.push("/organization/setup");
      }
    }
  }, [session, status, router]);

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
          data.message || "Registration successful! You are now logged in."
        );
        setError("");

        // Automatically log the user in after successful registration
        const signInResult = await signIn("credentials", {
          email: registerEmail,
          password: registerPassword,
          redirect: false,
        });

        if (signInResult?.ok) {
          // Redirect will be handled by the useSession effect
        } else {
          setError(
            "Registration successful but login failed. Please try logging in manually."
          );
        }
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
