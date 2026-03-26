"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { DynamicForm, type DynamicField, type DynamicFormSection } from "@/components/forms/dynamic-form";
import { Button } from "@/components/ui/button";

type SignUpValues = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  adminRegisterKey: string;
  isCompany: boolean;
};

const fields: DynamicField<SignUpValues>[] = [
  {
    type: "input",
    name: "fullName",
    label: "Full name",
    placeholder: "Admin User",
    required: true,
    rules: { required: "Full name is required" },
    colSpan: 12,
  },
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
    colSpan: 6,
  },
  {
    type: "input",
    name: "phone",
    label: "Phone",
    placeholder: "+923001234567",
    required: true,
    rules: { required: "Phone is required" },
    colSpan: 6,
  },
  {
    type: "input",
    name: "password",
    label: "Password",
    placeholder: "Minimum 8 characters",
    inputType: "password",
    required: true,
    rules: {
      required: "Password is required",
      minLength: { value: 8, message: "Password must be at least 8 characters" },
    },
    colSpan: 6,
  },
  {
    type: "input",
    name: "confirmPassword",
    label: "Confirm password",
    placeholder: "Re-enter password",
    inputType: "password",
    required: true,
    rules: { required: "Confirm password is required" },
    colSpan: 6,
  },
  {
    type: "input",
    name: "adminRegisterKey",
    label: "Admin register key",
    placeholder: "Enter secure key",
    inputType: "password",
    required: true,
    rules: { required: "Admin register key is required" },
    colSpan: 12,
  },
  {
    type: "checkbox",
    name: "isCompany",
    label: "Company account",
    colSpan: 12,
  },
];

const sections: DynamicFormSection<SignUpValues>[] = [
  {
    id: "signup",
    title: "Create admin account",
    description: "This endpoint requires the admin registration key configured on server.",
    fields,
  },
];

export default function SignUpPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-10">
        <section className="w-full rounded-xl border bg-background p-5 shadow-sm md:p-6">
          <DynamicForm<SignUpValues>
            sections={sections}
            defaultValues={{
              fullName: "",
              email: "",
              phone: "",
              password: "",
              confirmPassword: "",
              adminRegisterKey: "",
              isCompany: false,
            }}
            submitLabel="Create admin account"
            isSubmitting={isSubmitting}
            transformValues={(values) => ({
              ...values,
              email: values.email.trim().toLowerCase(),
              phone: values.phone.trim(),
              fullName: values.fullName.trim(),
            })}
            footer={
              <div className="flex items-center justify-between gap-3">
                <Button type="button" variant="secondary" className="w-full" onClick={() => router.push("/auth/signin")}>
                  Go to sign in
                </Button>
              </div>
            }
            onSubmit={async (values) => {
              setError(null);
              setSuccess(null);

              if (values.password !== values.confirmPassword) {
                setError("Password and confirm password must match");
                return;
              }

              setIsSubmitting(true);
              try {
                const res = await fetch("/api/server/register-admin", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify(values),
                });
                const body = (await res.json().catch(() => ({}))) as { message?: string };
                if (!res.ok) {
                  setError(body?.message ?? "Admin signup failed");
                  return;
                }
                setSuccess("Admin account created successfully. You can now sign in.");
              } finally {
                setIsSubmitting(false);
              }
            }}
          />

          {error ? <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}
          {success ? <p className="mt-4 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700">{success}</p> : null}
        </section>
      </div>
    </main>
  );
}

