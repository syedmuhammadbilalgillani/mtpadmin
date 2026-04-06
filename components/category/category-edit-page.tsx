"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { DynamicForm, type DynamicFormSection } from "@/components/forms/dynamic-form";
import { Button } from "@/components/ui/button";

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  backgroundImageUrl?: string | null;
  quantityDimension?: string | null;
  quantityAllowedUnits?: string[] | null;
  quantityDefaultUnit?: string | null;
  priceCurrency?: string | null;
  pricePerDimension?: string | null;
  priceAllowedPerUnits?: string[] | null;
  priceDefaultPerUnit?: string | null;
};

type CategoryListResponse = {
  data: Category[];
};

type UpdateCategoryValues = {
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

export default function CategoryEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const categoryId = String(params?.id ?? "");
  const [message, setMessage] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const updateImageRef = React.useRef<HTMLInputElement>(null);
  const updateBackgroundImageRef = React.useRef<HTMLInputElement>(null);

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

  const sections = React.useMemo<DynamicFormSection<UpdateCategoryValues>[]>(
    () => [
      {
        id: "update-step-1",
        title: "Step 1: Update Basic Info",
        description: "Edit category identity fields.",
        fields: [
          {
            type: "input",
            name: "name",
            label: "Name",
            placeholder: "Updated name",
            rules: { required: "Name is required" },
            colSpan: 6,
          },
          {
            type: "input",
            name: "slug",
            label: "Slug",
            placeholder: "updated-slug",
            rules: { required: "Slug is required" },
            colSpan: 6,
          },
          {
            type: "textarea",
            name: "description",
            label: "Description",
            placeholder: "Updated description",
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
        id: "update-step-2",
        title: "Step 2: Update Unit Policy",
        description: "Adjust fixed quantity and price unit rules for this category.",
        fields: [
          {
            type: "select",
            name: "quantityDimension",
            label: "Quantity Dimension",
            options: dimensionOptions,
            colSpan: 6,
          },
          {
            type: "input",
            name: "quantityAllowedUnitsText",
            label: "Quantity Allowed Units (comma-separated)",
            placeholder: "kg, g, ton",
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

  const form = useForm<UpdateCategoryValues>({
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

  React.useEffect(() => {
    async function loadCategory() {
      if (!categoryId) return;
      setIsLoading(true);
      try {
        const response = await request<CategoryListResponse>("/api/server/categories");
        const category = (response.data ?? []).find((item) => item.id === categoryId);
        if (!category) {
          setMessage("Category not found");
          return;
        }
        form.reset({
          name: category.name ?? "",
          slug: category.slug ?? "",
          description: category.description ?? "",
          imageUrl: category.imageUrl ?? "",
          backgroundImageUrl: category.backgroundImageUrl ?? "",
          quantityDimension: category.quantityDimension ?? "none",
          quantityAllowedUnitsText: (category.quantityAllowedUnits ?? []).join(", "),
          quantityDefaultUnit: category.quantityDefaultUnit ?? "",
          priceCurrency: category.priceCurrency ?? "PKR",
          pricePerDimension: category.pricePerDimension ?? "none",
          priceAllowedPerUnitsText: (category.priceAllowedPerUnits ?? []).join(", "),
          priceDefaultPerUnit: category.priceDefaultPerUnit ?? "",
        });
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Failed to load category");
      } finally {
        setIsLoading(false);
      }
    }
    void loadCategory();
  }, [categoryId, form]);

  async function onSubmit(values: UpdateCategoryValues) {
    try {
      const imageFile = updateImageRef.current?.files?.[0];
      const backgroundImageFile = updateBackgroundImageRef.current?.files?.[0];
      if (imageFile || backgroundImageFile) {
        const formData = new FormData();
        if (imageFile) formData.append("image", imageFile);
        if (backgroundImageFile) formData.append("backgroundImage", backgroundImageFile);
        formData.append("name", values.name.trim());
        formData.append("slug", values.slug.trim().toLowerCase());
        if (values.description.trim()) formData.append("description", values.description.trim());
        if (values.imageUrl.trim()) formData.append("imageUrl", values.imageUrl.trim());
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
        await request(`/api/server/categories/${categoryId}`, { method: "PATCH", body: formData });
      } else {
        await request(`/api/server/categories/${categoryId}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: values.name.trim(),
            slug: values.slug.trim().toLowerCase(),
            description: values.description.trim() || undefined,
            imageUrl: values.imageUrl.trim() || undefined,
            backgroundImageUrl: values.backgroundImageUrl.trim() || undefined,
            quantityDimension: values.quantityDimension !== "none" ? values.quantityDimension : undefined,
            quantityAllowedUnits: parseUnitsText(values.quantityAllowedUnitsText),
            quantityDefaultUnit: values.quantityDefaultUnit.trim() || undefined,
            priceCurrency: values.priceCurrency.trim().toUpperCase() || undefined,
            pricePerDimension: values.pricePerDimension !== "none" ? values.pricePerDimension : undefined,
            priceAllowedPerUnits: parseUnitsText(values.priceAllowedPerUnitsText),
            priceDefaultPerUnit: values.priceDefaultPerUnit.trim() || undefined,
          }),
        });
      }

      if (updateImageRef.current) updateImageRef.current.value = "";
      if (updateBackgroundImageRef.current) updateBackgroundImageRef.current.value = "";
      router.push("/modules/category");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to update category");
    }
  }

  return (
    <main className="min-h-screen bg-muted/30 p-6 md:p-10">
      <section className="mx-auto w-full max-w-4xl space-y-6">
        <div className="rounded-xl border bg-background p-4 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Update Category</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Edit category basics and unit-policy rules on one guided page.
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

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading category details...</p>
          ) : (
            <DynamicForm<UpdateCategoryValues>
              form={form}
              sections={sections}
              submitLabel="Update Category"
              footer={
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Upload New Category Image (optional, replaces current image)
                    </label>
                    <input
                      ref={updateImageRef}
                      type="file"
                      accept="image/*"
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Upload New Background Image (optional, replaces current background image)
                    </label>
                    <input
                      ref={updateBackgroundImageRef}
                      type="file"
                      accept="image/*"
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              }
              onSubmit={onSubmit}
            />
          )}
        </section>
      </section>
    </main>
  );
}
