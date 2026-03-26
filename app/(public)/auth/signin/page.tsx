"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import { DynamicForm, type DynamicField, type DynamicFormSection } from "@/components/forms/dynamic-form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SignInValues = {
  email: string;
  password: string;
  rememberMe: boolean;
};

const fields: DynamicField<SignInValues>[] = [
  {
    type: "input",
    name: "email",
    label: "Email",
    placeholder: "admin@company.com",
    inputType: "email",
    required: true,
    rules: {
      required: "Email is required",
      pattern: { value: /\S+@\S+\.\S+/, message: "Enter a valid email address" },
    },
    colSpan: 12,
  },
  {
    type: "input",
    name: "password",
    label: "Password",
    placeholder: "••••••••",
    inputType: "password",
    required: true,
    rules: { required: "Password is required" },
    colSpan: 12,
  },
  {
    type: "checkbox",
    name: "rememberMe",
    label: "Keep me signed in",
    colSpan: 12,
  },
];

const sections: DynamicFormSection<SignInValues>[] = [
  {
    id: "signin",
    title: "Sign in",
    description: "Use your admin email and password to continue.",
    fields,
  },
];

function SignInInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center px-4 py-10 md:grid-cols-2 md:gap-10">
        <section className="hidden md:block">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              Admin Panel
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
            <p className="max-w-md text-sm text-muted-foreground">
              Sign in to manage data, review tables, and use the dynamic form builder components.
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="rounded-xl border bg-background p-5 shadow-sm md:p-6">
            <DynamicForm<SignInValues>
              sections={sections}
              defaultValues={{ email: "", password: "", rememberMe: true }}
              submitLabel="Sign in"
              isSubmitting={isSubmitting}
              transformValues={(values) => ({
                ...values,
                email: values.email.trim().toLowerCase(),
              })}
              footer={
                <div className="flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      setError(null);
                      router.push("/");
                    }}
                  >
                    Back
                  </Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={() => router.push("/auth/signup")}>
                    Create admin
                  </Button>
                </div>
              }
              onSubmit={async (values) => {
                setError(null);
                setIsSubmitting(true);
                try {
                  const res = await signIn("credentials", {
                    redirect: false,
                    email: values.email,
                    password: values.password,
                    callbackUrl,
                  });
                  if (!res?.ok) {
                    setError(res?.error ?? "Sign in failed");
                    return;
                  }
                  router.push(res.url ?? callbackUrl);
                  router.refresh();
                } finally {
                  setIsSubmitting(false);
                }
              }}
            />

            {error ? (
              <div className={cn("mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive")}>
                {error}
              </div>
            ) : null}

            <p className="mt-4 text-xs text-muted-foreground">
              Tip: make sure your server is running and `AUTH_API_URL` points to it.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <React.Suspense
      fallback={
        <main className="min-h-screen bg-muted/30">
          <div className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
            <div className="w-full rounded-xl border bg-background p-5 shadow-sm md:p-6">
              <div className="h-5 w-24 animate-pulse rounded bg-muted" />
              <div className="mt-4 h-10 w-full animate-pulse rounded bg-muted" />
              <div className="mt-3 h-10 w-full animate-pulse rounded bg-muted" />
              <div className="mt-4 h-10 w-full animate-pulse rounded bg-muted" />
            </div>
          </div>
        </main>
      }
    >
      <SignInInner />
    </React.Suspense>
  );
}
