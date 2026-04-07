"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { DynamicFormSection } from "@/components/forms/dynamic-form";
import { FormBuilder } from "@/components/forms/form-builder";
import { Button } from "@/components/ui/button";
import { requestJson } from "@/lib/request";

type CreateCategoryValues = {
  name: string;
  description: string;
  iconImageUrl: string;
  backgroundImageUrl: string;
};

export default function CategoryCreatePage() {
  const router = useRouter();
  const [message, setMessage] = React.useState("");
  const createIconRef = React.useRef<HTMLInputElement>(null);
  const createBackgroundImageRef = React.useRef<HTMLInputElement>(null);

  const createSections = React.useMemo<DynamicFormSection<CreateCategoryValues>[]>(
    () => [
      {
        id: "create-step-1",
        title: "Category Details",
        description:
          "Create the category identity used across the system. Provide a name and optional images.",
        fields: [
          {
            type: "input",
            name: "name",
            label: "Category Name",
            placeholder: "Coal",
            rules: { required: "Name is required" },
            colSpan: 12,
          },
          {
            type: "textarea",
            name: "description",
            label: "Description",
            placeholder: "Category description",
            helperText: "Optional summary shown to users while browsing this category.",
            colSpan: 12,
          },
          {
            type: "input",
            name: "iconImageUrl",
            label: "Icon Image URL (optional)",
            inputType: "url",
            placeholder: "https://...",
            colSpan: 6,
          },
          {
            type: "input",
            name: "backgroundImageUrl",
            label: "Background Image URL (optional)",
            inputType: "url",
            placeholder: "https://...",
            colSpan: 6,
          },
        ],
      },
    ],
    [],
  );

  const form = useForm<CreateCategoryValues>({
    defaultValues: {
      name: "",
      description: "",
      iconImageUrl: "",
      backgroundImageUrl: "",
    },
  });

  const onSubmit = React.useCallback(
    async (values: CreateCategoryValues) => {
      try {
        const formData = new FormData();
        formData.append("name", values.name.trim());
        if (values.description.trim()) {
          formData.append("description", values.description.trim());
        }
        if (values.iconImageUrl.trim()) {
          formData.append("iconImage", values.iconImageUrl.trim());
        }
        if (values.backgroundImageUrl.trim()) {
          formData.append("backgroundImage", values.backgroundImageUrl.trim());
        }

        const iconFile = createIconRef.current?.files?.[0];
        const backgroundFile = createBackgroundImageRef.current?.files?.[0];
        if (iconFile) formData.set("iconImage", iconFile);
        if (backgroundFile) formData.set("backgroundImage", backgroundFile);

        await requestJson("/api/server/categories", {
          method: "POST",
          body: formData,
        });
        if (createIconRef.current) createIconRef.current.value = "";
        if (createBackgroundImageRef.current) createBackgroundImageRef.current.value = "";
        router.push("/modules/category");
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Failed to create category");
      }
    },
    [router],
  );

  return (
    <main className="min-h-screen bg-muted/30 p-6 md:p-10">
      <section className="mx-auto w-full max-w-4xl space-y-6">
        <div className="rounded-xl border bg-background p-4 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Create Category</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Follow each step to create a category with clear validation rules.
              </p>
            </div>
            <Link href="/modules/category">
              <Button variant="outline">Back to Category Admin</Button>
            </Link>
          </div>
        </div>

        <section className="rounded-xl border bg-background p-4 md:p-6">
          {message ? (
            <div className="mb-4 rounded-md border border-muted p-2 text-sm">{message}</div>
          ) : null}

          <FormBuilder<CreateCategoryValues>
            form={form}
            sections={createSections}
            submitLabel="Create Category"
            onSubmit={onSubmit}
            footer={
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Optional: upload files instead of URLs (or use both).
                </p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Upload Icon Image (optional)</label>
                    <input
                      ref={createIconRef}
                      type="file"
                      accept="image/*"
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Upload Background Image (optional)
                    </label>
                    <input
                      ref={createBackgroundImageRef}
                      type="file"
                      accept="image/*"
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            }
          />
        </section>
      </section>
    </main>
  );
}
