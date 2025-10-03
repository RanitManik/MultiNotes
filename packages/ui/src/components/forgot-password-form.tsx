import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

export function ForgotPasswordForm({
  className,
  onSubmit,
  email,
  onEmailChange,
  loading = false,
  error,
  success,
  onBackToLogin,
  ...props
}: React.ComponentProps<"form"> & {
  email?: string;
  onEmailChange?: (value: string) => void;
  loading?: boolean;
  error?: string;
  success?: string;
  onBackToLogin?: () => void;
}) {
  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={onSubmit}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <img
          src="/logo.svg"
          alt="lucide note Logo"
          className="mx-auto h-16 w-16"
        />
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="text-muted-foreground text-balance text-sm">
          Enter your email address and we&apos;ll send you a link to reset your
          password
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={e => onEmailChange?.(e.target.value)}
            disabled={loading}
          />
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Send reset link"
          )}
        </Button>
      </div>
      <div className="text-center text-sm">
        Remember your password?{" "}
        <button
          type="button"
          onClick={onBackToLogin}
          className="cursor-pointer underline underline-offset-4 hover:underline"
        >
          Back to login
        </button>
      </div>
    </form>
  );
}
