"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { DynamicForm, type DynamicFormSection } from "@/components/forms/dynamic-form";
import { Button } from "@/components/ui/button";

type CreateCategoryValues = {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  backgroundImageUrl: string;
  quantityDimension: string;
  quantityAllowedUnitsText: string;
  quantityDefaultUnit: string;
  priceCurrency: string;
  pricePerDimension: string;
  priceAllowedPerUnitsText: string;
  priceDefaultPerUnit: string;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const headers = new Headers(init?.headers);
  if (!isFormData && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const res = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : {};
  if (!res.ok) {
    const message =
      typeof data === "object" &&
      data &&
      "message" in data &&
      typeof (data as { message?: unknown }).message === "string"
        ? (data as { message: string }).message
        : "Request failed";
    throw new Error(message);
  }
  return data as T;
}

export default function CategoryCreatePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(0);
  const [message, setMessage] = React.useState("");
  const createImageRef = React.useRef<HTMLInputElement>(null);
  const createBackgroundImageRef = React.useRef<HTMLInputElement>(null);

  const dimensionOptions = React.useMemo(
    () => [
      { label: "Not Set", value: "none" },
      { label: "Mass", value: "mass" },
      { label: "Volume", value: "volume" },
      { label: "Count", value: "count" },
      { label: "Length", value: "length" },
      { label: "Area", value: "area" },
      { label: "Energy Density", value: "energy_density" },
      { label: "Percentage", value: "percentage" },
    ],
    [],
  );

  const parseUnitsText = React.useCallback((value: string): string[] => {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }, []);

  const createSections = React.useMemo<DynamicFormSection<CreateCategoryValues>[]>(
    () => [
      {
        id: "create-step-1",
        title: "Step 1: Basic Info",
        description:
          "Create the category identity used across the system. Start with a clear name and slug so this category is easy to find later.",
        fields: [
          {
            type: "input",
            name: "name",
            label: "Category Name",
            placeholder: "Coal",
            rules: { required: "Name is required" },
            colSpan: 6,
          },
          {
            type: "input",
            name: "slug",
            label: "Slug",
            placeholder: "coal",
            rules: { required: "Slug is required" },
            helperText: "Slug should be short and unique. It is used in APIs and URLs.",
            colSpan: 6,
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
            name: "imageUrl",
            label: "Image URL (optional)",
            placeholder: "https://...",
            colSpan: 6,
          },
          {
            type: "input",
            name: "backgroundImageUrl",
            label: "Background Image URL (optional)",
            placeholder: "https://...",
            colSpan: 6,
          },
        ],
      },
      {
        id: "create-step-2",
        title: "Step 2: Quantity & Price Unit Policy",
        description:
          "Define how quantity and price-per-unit are validated for posts in this category. Keep fields empty if you want to allow flexibility for now.",
        fields: [
          {
            type: "select",
            name: "quantityDimension",
            label: "Quantity Dimension",
            options: dimensionOptions,
            helperText: "Use 'Not Set' to keep this category unrestricted for now.",
            colSpan: 6,
          },
          {
            type: "input",
            name: "quantityAllowedUnitsText",
            label: "Quantity Allowed Units (comma-separated)",
            placeholder: "kg, g, ton",
            helperText: "Example: kg, g, ton",
            colSpan: 6,
          },
          {
            type: "input",
            name: "quantityDefaultUnit",
            label: "Quantity Default Unit",
            placeholder: "kg",
            colSpan: 4,
          },
          {
            type: "input",
            name: "priceCurrency",
            label: "Price Currency",
            placeholder: "PKR",
            helperText: "ISO-like code used in this category (e.g. PKR, USD).",
            colSpan: 4,
          },
          {
            type: "select",
            name: "pricePerDimension",
            label: "Price Per Dimension",
            options: dimensionOptions,
            colSpan: 4,
          },
          {
            type: "input",
            name: "priceAllowedPerUnitsText",
            label: "Price Allowed Per Units (comma-separated)",
            placeholder: "kg, ton",
            colSpan: 6,
          },
          {
            type: "input",
            name: "priceDefaultPerUnit",
            label: "Price Default Per Unit",
            placeholder: "kg",
            colSpan: 6,
          },
        ],
      },
    ],
    [dimensionOptions],
  );

  const form = useForm<CreateCategoryValues>({
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      imageUrl: "",
      backgroundImageUrl: "",
      quantityDimension: "none",
      quantityAllowedUnitsText: "",
      quantityDefaultUnit: "",
      priceCurrency: "PKR",
      pricePerDimension: "none",
      priceAllowedPerUnitsText: "",
      priceDefaultPerUnit: "",
    },
  });

  const steps = createSections;
  const totalSteps = steps.length;

  async function goToNextStep() {
    if (currentStep >= totalSteps - 1) return;
    const currentSection = steps[currentStep];
    const fieldNames = currentSection.fields.map((field) => field.name);
    const isValid = await form.trigger(fieldNames, { shouldFocus: true });
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
    }
  }

  async function onSubmit(values: CreateCategoryValues) {
    try {
      const formData = new FormData();
      formData.append("name", values.name.trim());
      formData.append("slug", values.slug.trim().toLowerCase());
      if (values.description.trim()) {
        formData.append("description", values.description.trim());
      }
      if (values.imageUrl.trim()) {
        formData.append("imageUrl", values.imageUrl.trim());
      }
      if (values.backgroundImageUrl.trim()) {
        formData.append("backgroundImageUrl", values.backgroundImageUrl.trim());
      }
      if (values.quantityDimension !== "none") {
        formData.append("quantityDimension", values.quantityDimension);
      }
      const quantityAllowedUnits = parseUnitsText(values.quantityAllowedUnitsText);
      if (quantityAllowedUnits.length > 0) {
        formData.append("quantityAllowedUnits", JSON.stringify(quantityAllowedUnits));
      }
      if (values.quantityDefaultUnit.trim()) {
        formData.append("quantityDefaultUnit", values.quantityDefaultUnit.trim());
      }
      if (values.priceCurrency.trim()) {
        formData.append("priceCurrency", values.priceCurrency.trim().toUpperCase());
      }
      if (values.pricePerDimension !== "none") {
        formData.append("pricePerDimension", values.pricePerDimension);
      }
      const priceAllowedPerUnits = parseUnitsText(values.priceAllowedPerUnitsText);
      if (priceAllowedPerUnits.length > 0) {
        formData.append("priceAllowedPerUnits", JSON.stringify(priceAllowedPerUnits));
      }
      if (values.priceDefaultPerUnit.trim()) {
        formData.append("priceDefaultPerUnit", values.priceDefaultPerUnit.trim());
      }
      const imageFile = createImageRef.current?.files?.[0];
      const backgroundFile = createBackgroundImageRef.current?.files?.[0];
      if (imageFile) formData.append("image", imageFile);
      if (backgroundFile) formData.append("backgroundImage", backgroundFile);

      await request("/api/server/categories", {
        method: "POST",
        body: formData,
      });
      if (createImageRef.current) createImageRef.current.value = "";
      if (createBackgroundImageRef.current) createBackgroundImageRef.current.value = "";
      router.push("/modules/category");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to create category");
    }
  }

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
            <Button asChild variant="outline">
              <Link href="/modules/category">Back to Category Admin</Link>
            </Button>
          </div>
        </div>

        <section className="rounded-xl border bg-background p-4 md:p-6">
          <div className="mb-6 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            Step {currentStep + 1} of {totalSteps}: {steps[currentStep]?.title}
          </div>

          {message ? (
            <div className="mb-4 rounded-md border border-muted p-2 text-sm">{message}</div>
          ) : null}

          <DynamicForm<CreateCategoryValues>
            form={form}
            sections={[steps[currentStep]]}
            hideSubmitButton
            onSubmit={onSubmit}
            footer={
              currentStep === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Optional: you can upload files instead of URLs, or use both.
                  </p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Upload Image (optional)</label>
                      <input
                        ref={createImageRef}
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
              ) : null
            }
          />

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
              disabled={currentStep === 0}
            >
              Previous Step
            </Button>
            {currentStep < totalSteps - 1 ? (
              <Button type="button" onClick={goToNextStep}>
                Next Step
              </Button>
            ) : (
              <Button type="button" onClick={form.handleSubmit(onSubmit)}>
                Create Category
              </Button>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
