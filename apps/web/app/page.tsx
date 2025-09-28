"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { FileText, Users, Shield } from "lucide-react";

export default function LandingPage() {
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
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">MultiNotes</span>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => router.push("/auth/login")}>
              Sign In
            </Button>
            <Button onClick={() => router.push("/auth/register")}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Organize Your Thoughts,<br />
            <span className="text-primary">Collaborate Seamlessly</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            MultiNotes is a powerful note-taking platform designed for teams.
            Create, share, and organize your ideas with rich formatting and
            real-time collaboration.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => router.push("/auth/register")}>
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push("/auth/login")}>
              Sign In
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <FileText className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Rich Text Editor</CardTitle>
              <CardDescription>
                Write with style using our powerful editor with support for
                headings, lists, code blocks, and more.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Team Collaboration</CardTitle>
              <CardDescription>
                Invite team members to your organization and collaborate
                on notes in real-time.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Secure & Private</CardTitle>
              <CardDescription>
                Your notes are encrypted and stored securely. Control who
                has access to your organization's content.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to get organized?
            </h2>
            <p className="text-lg mb-6 opacity-90">
              Join thousands of teams already using MultiNotes to streamline
              their workflow and boost productivity.
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => router.push("/auth/register")}
            >
              Create Your Account
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background/80 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2025 MultiNotes. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
