"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { DynamicFormSection } from "@/components/forms/dynamic-form";
import { FormBuilder } from "@/components/forms/form-builder";
import { DataTable, type DataTableColumn } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import {
  addCategoryField,
  deleteCategoryField,
  getCategory,
  updateCategoryField,
  type AdminCategoryField,
  type AdminCategoryFieldType,
} from "@/lib/categories";
import { requestJson } from "@/lib/request";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { DynamicField } from "@/components/forms/dynamic-form";

type UpdateCategoryValues = {
  name: string;
  description: string;
  iconImageUrl: string;
  backgroundImageUrl: string;
  isActive: boolean;
};

type UpsertFieldValues = {
  name: string;
  key: string;
  placeholder: string;
  fieldType: AdminCategoryFieldType;
  optionsText: string;
  unit: string;
  required: boolean;
  order: number;
};

function parseOptionsText(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export default function CategoryEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const categoryId = Number(params?.id ?? 0);
  const [message, setMessage] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [categoryFields, setCategoryFields] = React.useState<AdminCategoryField[]>([]);
  const [fieldsQuery, setFieldsQuery] = React.useState("");
  const [isCreateFieldOpen, setIsCreateFieldOpen] = React.useState(false);
  const [editingField, setEditingField] = React.useState<AdminCategoryField | null>(null);
  const [isEditFieldOpen, setIsEditFieldOpen] = React.useState(false);
  const updateIconRef = React.useRef<HTMLInputElement>(null);
  const updateBackgroundImageRef = React.useRef<HTMLInputElement>(null);

  const sections = React.useMemo<DynamicFormSection<UpdateCategoryValues>[]>(
    () => [
      {
        id: "update-step-1",
        title: "Update Category",
        description: "Edit category basics and images.",
        fields: [
          {
            type: "input",
            name: "name",
            label: "Name",
            placeholder: "Updated name",
            rules: { required: "Name is required" },
            colSpan: 12,
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
            name: "iconImageUrl",
            label: "Icon Image URL (optional)",
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
          {
            type: "switch",
            name: "isActive",
            label: "Active",
            colSpan: 6,
          },
        ],
      },
    ],
    [],
  );

  const form = useForm<UpdateCategoryValues>({
    defaultValues: {
      name: "",
      description: "",
      iconImageUrl: "",
      backgroundImageUrl: "",
      isActive: false,
    },
  });

  React.useEffect(() => {
    async function loadCategory() {
      if (!categoryId || Number.isNaN(categoryId)) return;
      setIsLoading(true);
      try {
        const category = await getCategory(categoryId);
        console.log("category", category);
        form.reset({
          name: category.name ?? "",
          description: category.description ?? "",
          iconImageUrl: category.iconImageUrl ?? "",
          backgroundImageUrl: category.backgroundImageUrl ?? "",
          isActive: category.isActive ?? false,
        });
        setCategoryFields([...(category.fields ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Failed to load category");
      } finally {
        setIsLoading(false);
      }
    }
    void loadCategory();
  }, [categoryId, form]);

  const reloadFields = React.useCallback(async () => {
    const category = await getCategory(categoryId);
    setCategoryFields([...(category.fields ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
  }, [categoryId]);

  async function onSubmit(values: UpdateCategoryValues) {
    try {
      const iconFile = updateIconRef.current?.files?.[0];
      const backgroundImageFile = updateBackgroundImageRef.current?.files?.[0];
      if (iconFile || backgroundImageFile) {
        const formData = new FormData();
        formData.append("name", values.name.trim());
        if (values.description.trim()) formData.append("description", values.description.trim());
        if (values.iconImageUrl.trim()) formData.append("iconImage", values.iconImageUrl.trim());
        if (values.backgroundImageUrl.trim()) formData.append("backgroundImage", values.backgroundImageUrl.trim());
        if (values.isActive !== undefined) formData.append("isActive", values.isActive.toString());
        if (iconFile) formData.set("iconImage", iconFile);
        if (backgroundImageFile) formData.set("backgroundImage", backgroundImageFile);

        await requestJson(`/api/server/categories/${categoryId}`, {
          method: "PATCH",
          body: formData,
        });
      } else {
        await requestJson(`/api/server/categories/${categoryId}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: values.name.trim(),
            description: values.description.trim() || undefined,
            iconImage: values.iconImageUrl.trim() || undefined,
            backgroundImage: values.backgroundImageUrl.trim() || undefined,
            isActive: values.isActive !== undefined ? values.isActive : undefined,
          }),
        });
      }

      if (updateIconRef.current) updateIconRef.current.value = "";
      if (updateBackgroundImageRef.current) updateBackgroundImageRef.current.value = "";
      router.push("/modules/category");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to update category");
    }
  }

  const fieldTypeOptions = React.useMemo(
    () => [
      { label: "Text", value: "text" as const },
      { label: "Number", value: "number" as const },
      { label: "Select", value: "select" as const },
      { label: "Multi Select", value: "multi-select" as const },
    ],
    [],
  );

  const upsertFieldFields = React.useMemo<DynamicField<UpsertFieldValues>[]>(
    () => [
      {
        type: "input",
        name: "name",
        label: "Field Name",
        placeholder: "Grade",
        rules: { required: "Field name is required" },
        colSpan: 6,
      },
      {
        type: "input",
        name: "key",
        label: "Key",
        placeholder: "grade",
        helperText: "Used in saved field values. Keep it short and stable.",
        rules: { required: "Key is required" },
        colSpan: 6,
      },
      {
        type: "input",
        name: "placeholder",
        label: "Placeholder",
        placeholder: "Enter grade",
        rules: { required: "Placeholder is required" },
        colSpan: 12,
      },
      {
        type: "select",
        name: "fieldType",
        label: "Field Type",
        options: fieldTypeOptions,
        rules: { required: "Field type is required" },
        colSpan: 6,
      },
      {
        type: "input",
        name: "unit",
        label: "Unit (optional)",
        placeholder: "tons",
        colSpan: 3,
      },
      {
        type: "input",
        name: "order",
        label: "Order",
        inputType: "number",
        inputProps: { min: 0, step: 1 },
        rules: { valueAsNumber: true, min: { value: 0, message: "Order must be 0+" } },
        colSpan: 3,
      },
      {
        type: "switch",
        name: "required",
        label: "Required",
        colSpan: 6,
      },
      {
        type: "textarea",
        name: "optionsText",
        label: "Options (comma-separated, optional)",
        placeholder: "A, B, C",
        helperText: "Only needed for select/multi-select.",
        colSpan: 12,
      },
    ],
    [fieldTypeOptions],
  );

  const filteredFields = React.useMemo(() => {
    const q = fieldsQuery.trim().toLowerCase();
    if (!q) return categoryFields;
    return categoryFields.filter((f) => {
      return (
        f.name?.toLowerCase().includes(q) ||
        f.key?.toLowerCase().includes(q) ||
        f.fieldType?.toLowerCase().includes(q)
      );
    });
  }, [categoryFields, fieldsQuery]);

  const fieldColumns = React.useMemo<DataTableColumn<AdminCategoryField>[]>(
    () => [
      { id: "order", header: "Order", accessor: (row) => row.order ?? 0, type: "number", priority: 1, align: "right" },
      { id: "name", header: "Name", accessor: (row) => row.name, type: "text", priority: 2 },
      { id: "key", header: "Key", accessor: (row) => row.key, type: "text", priority: 3, hideBelow: "md" },
      { id: "fieldType", header: "Type", accessor: (row) => row.fieldType, type: "badge", priority: 4 },
      { id: "required", header: "Required", accessor: (row) => row.required, type: "boolean", priority: 5, hideBelow: "md" },
      { id: "unit", header: "Unit", accessor: (row) => row.unit ?? "", type: "text", priority: 6, hideBelow: "lg" },
      {
        id: "actions",
        header: "Actions",
        type: "actions",
        align: "right",
        priority: 7,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingField(row);
                setIsEditFieldOpen(true);
              }}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                try {
                  const ok = window.confirm(`Delete field "${row.name}"?`);
                  if (!ok) return;
                  await deleteCategoryField(row.id);
                  setMessage("Field deleted successfully");
                  await reloadFields();
                } catch (e) {
                  setMessage(e instanceof Error ? e.message : "Failed to delete field");
                }
              }}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [reloadFields],
  );

  return (
    <main className="min-h-screen bg-muted/30 p-6 md:p-10">
      <section className="mx-auto w-full max-w-5xl space-y-6">
        <div className="rounded-xl border bg-background p-4 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Update Category</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Edit category basics, images, and dynamic fields.
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
            <FormBuilder<UpdateCategoryValues>
              form={form}
              sections={sections}
              submitLabel="Update Category"
              footer={
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Upload New Icon Image (optional, replaces current icon)
                    </label>
                    <input
                      ref={updateIconRef}
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

        <section className="rounded-xl border bg-background p-4 md:p-6">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Category Fields</h2>
              <p className="text-xs text-muted-foreground">
                These fields appear on posts within this category.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={fieldsQuery}
                onChange={(e) => setFieldsQuery(e.target.value)}
                placeholder="Search fields..."
                className="w-full sm:w-72"
              />
              <Dialog open={isCreateFieldOpen} onOpenChange={setIsCreateFieldOpen}>
                <DialogTrigger render={<Button>Add Field</Button>} />
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Field</DialogTitle>
                    <DialogDescription>Create a new dynamic field for this category.</DialogDescription>
                  </DialogHeader>
                  <FormBuilder<UpsertFieldValues>
                    fields={upsertFieldFields}
                    defaultValues={{
                      name: "",
                      key: "",
                      placeholder: "",
                      fieldType: "text",
                      optionsText: "",
                      unit: "",
                      required: false,
                      order: categoryFields.length,
                    }}
                    submitLabel="Create Field"
                    onSubmit={async (values) => {
                      try {
                        await addCategoryField(categoryId, {
                          name: values.name.trim(),
                          key: values.key.trim(),
                          placeholder: values.placeholder.trim(),
                          fieldType: values.fieldType,
                          unit: values.unit.trim() || undefined,
                          required: values.required,
                          order: values.order,
                          options: parseOptionsText(values.optionsText),
                        });
                        setMessage("Field created successfully");
                        setIsCreateFieldOpen(false);
                        await reloadFields();
                      } catch (e) {
                        setMessage(e instanceof Error ? e.message : "Failed to create field");
                      }
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <DataTable<AdminCategoryField>
            data={filteredFields}
            columns={fieldColumns}
            getRowId={(row) => String(row.id)}
            caption="Category fields"
          />
        </section>

        <Dialog open={isEditFieldOpen} onOpenChange={setIsEditFieldOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Update Field</DialogTitle>
              <DialogDescription>
                Update details for {editingField?.name ?? "selected field"}.
              </DialogDescription>
            </DialogHeader>
            <FormBuilder<UpsertFieldValues>
              key={editingField?.id ?? "edit-field"}
              fields={upsertFieldFields}
              defaultValues={{
                name: editingField?.name ?? "",
                key: editingField?.key ?? "",
                placeholder: editingField?.placeholder ?? "",
                fieldType: (editingField?.fieldType ?? "text") as AdminCategoryFieldType,
                optionsText: (editingField?.options ?? []).join(", "),
                unit: editingField?.unit ?? "",
                required: editingField?.required ?? false,
                order: editingField?.order ?? 0,
              }}
              submitLabel="Update Field"
              onSubmit={async (values) => {
                try {
                  if (!editingField?.id) throw new Error("No field selected");
                  await updateCategoryField(editingField.id, {
                    name: values.name.trim(),
                    key: values.key.trim(),
                    placeholder: values.placeholder.trim(),
                    fieldType: values.fieldType,
                    unit: values.unit.trim() || undefined,
                    required: values.required,
                    order: values.order,
                    options: parseOptionsText(values.optionsText),
                  });
                  setMessage("Field updated successfully");
                  setIsEditFieldOpen(false);
                  setEditingField(null);
                  await reloadFields();
                } catch (e) {
                  setMessage(e instanceof Error ? e.message : "Failed to update field");
                }
              }}
            />
          </DialogContent>
        </Dialog>
      </section>
    </main>
  );
}
