"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@workspace/ui/components/login-form";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("auth:token");
    if (token) {
      // Verify token is valid by decoding it locally
      try {
        const parts = token.split(".");
        if (parts.length === 3 && parts[1]) {
          const payload = JSON.parse(atob(parts[1]));
          // Check if token is not expired
          const currentTime = Math.floor(Date.now() / 1000);
          if (payload.exp && payload.exp > currentTime) {
            router.push("/notes");
            return;
          }
        }
      } catch {
        // Token is invalid
      }
      // Remove invalid token
      localStorage.removeItem("auth:token");
    }
    setCheckingAuth(false);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("auth:token", data.token);
        router.push("/notes");
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="text-primary mx-auto mb-4 h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoginForm
          email={email}
          password={password}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
          onSignUp={() => router.push("/auth/register")}
        />
      </div>
    </div>
  );
}
