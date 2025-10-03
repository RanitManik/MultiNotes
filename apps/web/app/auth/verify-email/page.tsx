import { Suspense } from "react";
import { redirect } from "next/navigation";

interface VerifyEmailPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function VerifyEmailContent({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  const token = params.token as string;

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md space-y-6 rounded-lg border p-6 shadow-lg">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Invalid Verification Link</h1>
            <p className="text-muted-foreground">
              The verification link is invalid or has expired.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // This will trigger the API route
  redirect(`/api/auth/verify-email?token=${token}`);
}

export default async function VerifyEmailPage(props: VerifyEmailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="w-full max-w-md space-y-6 rounded-lg border p-6 shadow-lg">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Verifying...</h1>
              <p className="text-muted-foreground">
                Please wait while we verify your email.
              </p>
            </div>
          </div>
        </div>
      }
    >
      <VerifyEmailContent searchParams={props.searchParams} />
    </Suspense>
  );
}
