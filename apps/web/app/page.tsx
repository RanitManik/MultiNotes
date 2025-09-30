"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
            <Image
              src="/logo.svg"
              alt="MultiNotes Logo"
              width={32}
              height={32}
            />
            <span className="text-xl font-bold md:text-2xl">MultiNotes</span>
          </div>
          <div className="flex gap-2 md:gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="md:size-default"
              onClick={() => router.push("/auth/login")}
            >
              Sign In
            </Button>
            <Button
              size="sm"
              className="md:size-default"
              onClick={() => router.push("/auth/register")}
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="mb-12 text-center md:mb-16">
          <h1 className="mb-4 text-3xl font-bold md:text-5xl lg:text-6xl">
            Organize Your Thoughts,
            <br />
            <span className="text-primary">Collaborate Seamlessly</span>
          </h1>
          <p className="text-muted-foreground mx-auto mb-6 max-w-2xl px-4 text-base md:text-lg lg:text-xl">
            MultiNotes is a powerful note-taking platform designed for teams.
            Create, share, and organize your ideas with rich formatting and
            real-time collaboration.
          </p>
          <div className="flex flex-col justify-center gap-3 px-4 sm:flex-row md:gap-4">
            <Button
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => router.push("/auth/register")}
            >
              Start Free Trial
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => router.push("/auth/login")}
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mb-12 grid grid-cols-1 gap-6 md:mb-16 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          <Card>
            <CardHeader className="text-center md:text-left">
              <FileText className="text-primary mx-auto mb-4 h-10 w-10 md:mx-0 md:h-12 md:w-12" />
              <CardTitle className="text-lg md:text-xl">
                Rich Text Editor
              </CardTitle>
              <CardDescription className="text-sm md:text-base">
                Write with style using our powerful editor with support for
                headings, lists, code blocks, and more.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="text-center md:text-left">
              <Users className="text-primary mx-auto mb-4 h-10 w-10 md:mx-0 md:h-12 md:w-12" />
              <CardTitle className="text-lg md:text-xl">
                Team Collaboration
              </CardTitle>
              <CardDescription className="text-sm md:text-base">
                Invite team members to your organization and collaborate on
                notes in real-time.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="text-center md:text-left">
              <Shield className="text-primary mx-auto mb-4 h-10 w-10 md:mx-0 md:h-12 md:w-12 lg:mx-auto" />
              <CardTitle className="text-lg md:text-xl">
                Secure & Private
              </CardTitle>
              <CardDescription className="text-sm md:text-base">
                Your notes are encrypted and stored securely. Control who has
                access to your organization's content.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-6 text-center md:p-8">
            <h2 className="mb-3 text-2xl font-bold md:mb-4 md:text-3xl">
              Ready to get organized?
            </h2>
            <p className="mb-4 px-4 text-base opacity-90 md:mb-6 md:px-0 md:text-lg">
              Join thousands of teams already using MultiNotes to streamline
              their workflow and boost productivity.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => router.push("/auth/register")}
            >
              Create Your Account
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-background/80 mt-12 border-t backdrop-blur-sm md:mt-16">
        <div className="text-muted-foreground container mx-auto px-4 py-6 text-center text-sm md:py-8 md:text-base">
          <p>&copy; 2025 MultiNotes. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
