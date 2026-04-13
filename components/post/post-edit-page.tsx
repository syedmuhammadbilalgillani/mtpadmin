"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import type { DynamicFormSection } from "@/components/forms/dynamic-form";
import type { DynamicField } from "@/components/forms/dynamic-form";
import { FormBuilder } from "@/components/forms/form-builder";
import { Button } from "@/components/ui/button";
import { requestJson } from "@/lib/request";
import {
  getPost,
  updatePost,
  type AdminListingType,
  type AdminPostStatus,
} from "@/lib/posts";
import {
  getCategory,
  listCategories,
  type AdminCategory,
  type AdminCategoryField,
} from "@/lib/categories";

type City = { id: string; name: string };

type PostFormValues = {
  title: string;
  shortDescription: string;
  categoryId: string;
  locationId: string;
  price: number;
  labReportUrl: string;
  status: AdminPostStatus;
  listingType: AdminListingType;
  imagesText: string;
} & Record<string, unknown>;

function parseImagesText(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function fieldKey(fieldId: number) {
  return `field_${fieldId}`;
}

export default function PostEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const postId = Number(params?.id ?? 0);

  const [message, setMessage] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [categories, setCategories] = React.useState<AdminCategory[]>([]);
  const [cities, setCities] = React.useState<City[]>([]);
  const [categoryFields, setCategoryFields] = React.useState<
    AdminCategoryField[]
  >([]);

  const form = useForm<PostFormValues>({
    defaultValues: {
      title: "",
      shortDescription: "",
      categoryId: "",
      locationId: "",
      price: 0,
      labReportUrl: "",
      status: "draft",
      listingType: "sell",
      imagesText: "",
    },
  });

  React.useEffect(() => {
    async function loadLookups() {
      try {
        setCategories(await listCategories());
      } catch (e) {
        setMessage(
          e instanceof Error ? e.message : "Failed to load categories",
        );
      }

      try {
        const res = await requestJson<unknown>("/api/server/city");
        const list = Array.isArray(res)
          ? (res as City[])
          : typeof res === "object" &&
              res &&
              "data" in (res as Record<string, unknown>)
            ? (((res as { data?: unknown }).data as City[]) ?? [])
            : [];
        setCities(list);
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Failed to load cities");
      }
    }
    void loadLookups();
  }, []);

  React.useEffect(() => {
    async function loadPost() {
      if (!postId || Number.isNaN(postId)) return;
      setIsLoading(true);
      try {
        const post = await getPost(postId);
        const categoryId =
          typeof post.categoryId === "object" && post.categoryId
            ? post.categoryId.id
            : Number(post.categoryId);
        const locationId =
          typeof post.locationId === "object" && post.locationId
            ? post.locationId.id
            : String(post.locationId ?? "");

        form.reset({
          title: post.title ?? "",
          shortDescription: post.shortDescription ?? "",
          categoryId: categoryId ? String(categoryId) : "",
          locationId: locationId ?? "",
          price: Number(post.price ?? 0),
          labReportUrl: post.labReportUrl ?? "",
          status: post.status ?? "draft",
          listingType: post.listingType ?? "sell",
          imagesText: (post.images ?? []).join("\n"),
        });
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Failed to load post");
      } finally {
        setIsLoading(false);
      }
    }
    void loadPost();
  }, [form, postId]);

  const selectedCategoryId = form.watch("categoryId");
  React.useEffect(() => {
    async function loadFieldsAndValues() {
      const catId = Number(selectedCategoryId);
      if (!catId) {
        setCategoryFields([]);
        return;
      }
      try {
        const category = await getCategory(catId);
        const fields = [...(category.fields ?? [])].sort(
          (a, b) => (a.order ?? 0) - (b.order ?? 0),
        );
        setCategoryFields(fields);

        // Try to populate existing values
        const post = await getPost(postId);
        const valuesByFieldId = new Map<number, unknown>();
        (post.fieldValues ?? []).forEach((fv) => {
          valuesByFieldId.set(fv.field.id, fv.value);
        });
        fields.forEach((f) => {
          const key = fieldKey(f.id);
          const raw = valuesByFieldId.get(f.id);
          if (raw === undefined) return;
          if (f.fieldType === "multi-select") {
            try {
              const parsed = JSON.parse(String(raw));
              form.setValue(key as any, Array.isArray(parsed) ? parsed : []);
            } catch {
              form.setValue(key as any, []);
            }
          } else {
            form.setValue(key as any, String(raw));
          }
        });
      } catch {
        setCategoryFields([]);
      }
    }
    if (postId) void loadFieldsAndValues();
  }, [form, postId, selectedCategoryId]);

  const baseSections = React.useMemo<
    DynamicFormSection<PostFormValues>[]
  >(() => {
    const categoryOptions = categories.map((c) => ({
      label: c.name,
      value: String(c.id),
    }));
    const cityOptions = cities.map((c) => ({ label: c.name, value: c.id }));
    return [
      {
        id: "base",
        title: "Post Details",
        fields: [
          {
            type: "input",
            name: "title",
            label: "Title",
            rules: { required: "Title is required" },
            colSpan: 12,
          },
          {
            type: "textarea",
            name: "shortDescription",
            label: "Short Description",
            rules: { required: "Short description is required" },
            colSpan: 12,
          },
          {
            type: "select",
            name: "categoryId",
            label: "Category",
            options: categoryOptions,
            rules: { required: "Category is required" },
            colSpan: 6,
          },
          {
            type: "select",
            name: "locationId",
            label: "City",
            options: cityOptions,
            rules: { required: "City is required" },
            colSpan: 6,
          },
          {
            type: "input",
            name: "price",
            label: "Price",
            inputType: "number",
            rules: {
              valueAsNumber: true,
              min: { value: 0, message: "Price must be 0+" },
            },
            colSpan: 4,
          },
          {
            type: "select",
            name: "status",
            label: "Status",
            options: [
              { label: "Draft", value: "draft" },
              { label: "Published", value: "published" },
              { label: "Sold", value: "sold" },
            ],
            colSpan: 4,
          },
          {
            type: "select",
            name: "listingType",
            label: "Listing Type",
            options: [
              { label: "Sell", value: "sell" },
              { label: "Buy", value: "buy" },
            ],
            colSpan: 4,
          },
          {
            type: "input",
            name: "labReportUrl",
            label: "Lab Report URL (optional)",
            placeholder: "https://...",
            colSpan: 12,
          },
          {
            type: "textarea",
            name: "imagesText",
            label: "Image URLs (one per line)",
            placeholder: "https://...\nhttps://...",
            colSpan: 12,
          },
        ],
      },
    ];
  }, [categories, cities]);

  const dynamicFields = React.useMemo<DynamicField<PostFormValues>[]>(() => {
    return categoryFields.map((f) => {
      const name = fieldKey(f.id) as keyof PostFormValues;
      const requiredRule = f.required
        ? { required: `${f.name} is required` }
        : undefined;
      if (f.fieldType === "select") {
        const opts = (f.options ?? []).map((o) => ({ label: o, value: o }));
        return {
          type: "select",
          name,
          label: f.name,
          options: opts,
          rules: requiredRule,
          colSpan: 6,
        };
      }
      if (f.fieldType === "multi-select") {
        const opts = (f.options ?? []).map((o) => ({ label: o, value: o }));
        return {
          type: "checkbox-group",
          name,
          label: f.name,
          options: opts,
          direction: "row",
          rules: requiredRule,
          colSpan: 12,
        };
      }
      const inputType = f.fieldType === "number" ? "number" : "text";
      return {
        type: "input",
        name,
        label: f.name,
        placeholder: f.placeholder,
        inputType,
        rules: requiredRule,
        colSpan: 6,
      };
    });
  }, [categoryFields]);

  const sections = React.useMemo<DynamicFormSection<PostFormValues>[]>(() => {
    if (dynamicFields.length === 0) return baseSections;
    return [
      ...baseSections,
      { id: "fields", title: "Category Fields", fields: dynamicFields },
    ];
  }, [baseSections, dynamicFields]);

  return (
    <main className="min-h-screen bg-muted/30 p-6 md:p-10">
      <section className="mx-auto w-full max-w-5xl space-y-6">
        <div className="rounded-xl border bg-background p-4 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Update Post</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Dynamic fields update with the selected category.
              </p>
            </div>
            <Link href="/modules/post">
              <Button variant="outline">Back to Post Admin</Button>
            </Link>
          </div>
        </div>

        <section className="rounded-xl border bg-background p-4 md:p-6">
          {message ? (
            <div className="mb-4 rounded-md border border-muted p-2 text-sm">
              {message}
            </div>
          ) : null}

          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Loading post details...
            </p>
          ) : (
            <FormBuilder<PostFormValues>
              form={form}
              sections={sections}
              submitLabel="Update Post"
              onSubmit={async (values) => {
                try {
                  const catId = Number(values.categoryId);
                  if (!catId) throw new Error("Select a category");
                  if (!values.locationId) throw new Error("Select a city");

                  const fieldValues = categoryFields
                    .map((f) => {
                      const raw = values[fieldKey(f.id)];
                      if (raw === undefined || raw === null || raw === "")
                        return null;
                      if (Array.isArray(raw))
                        return { fieldId: f.id, value: JSON.stringify(raw) };
                      return { fieldId: f.id, value: String(raw) };
                    })
                    .filter(Boolean) as Array<{
                    fieldId: number;
                    value: string;
                  }>;

                  await updatePost(postId, {
                    title: values.title.trim(),
                    shortDescription: values.shortDescription.trim(),
                    categoryId: catId,
                    locationId: values.locationId,
                    price: Number(values.price),
                    labReportUrl: values.labReportUrl.trim() || undefined,
                    status: values.status,
                    listingType: values.listingType,
                    images: parseImagesText(values.imagesText),
                    fieldValues,
                  });

                  router.push("/modules/post");
                } catch (e) {
                  setMessage(
                    e instanceof Error ? e.message : "Failed to update post",
                  );
                }
              }}
            />
          )}
        </section>
      </section>
    </main>
  );
}
