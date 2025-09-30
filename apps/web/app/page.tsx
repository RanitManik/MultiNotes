"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { FileText, Users, Shield, Loader2 } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="from-background to-muted min-h-screen bg-gradient-to-br">
      {/* Header */}
      <header className="bg-background/80 border-b backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <FileText className="text-primary h-8 w-8" />
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
        <div className="mb-16 text-center">
          <h1 className="mb-6 text-4xl font-bold md:text-6xl">
            Organize Your Thoughts,
            <br />
            <span className="text-primary">Collaborate Seamlessly</span>
          </h1>
          <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-xl">
            MultiNotes is a powerful note-taking platform designed for teams.
            Create, share, and organize your ideas with rich formatting and
            real-time collaboration.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" onClick={() => router.push("/auth/register")}>
              Start Free Trial
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push("/auth/login")}
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mb-16 grid gap-8 md:grid-cols-3">
          <Card>
            <CardHeader>
              <FileText className="text-primary mb-4 h-12 w-12" />
              <CardTitle>Rich Text Editor</CardTitle>
              <CardDescription>
                Write with style using our powerful editor with support for
                headings, lists, code blocks, and more.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="text-primary mb-4 h-12 w-12" />
              <CardTitle>Team Collaboration</CardTitle>
              <CardDescription>
                Invite team members to your organization and collaborate on
                notes in real-time.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="text-primary mb-4 h-12 w-12" />
              <CardTitle>Secure & Private</CardTitle>
              <CardDescription>
                Your notes are encrypted and stored securely. Control who has
                access to your organization's content.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-8 text-center">
            <h2 className="mb-4 text-3xl font-bold">Ready to get organized?</h2>
            <p className="mb-6 text-lg opacity-90">
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
      <footer className="bg-background/80 mt-16 border-t backdrop-blur-sm">
        <div className="text-muted-foreground container mx-auto px-4 py-8 text-center">
          <p>&copy; 2025 MultiNotes. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
