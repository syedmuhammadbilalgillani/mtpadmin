"use client";

import * as React from "react";
import { DynamicForm, type DynamicField } from "@/components/forms/dynamic-form";
import { DataTable, type DataTableColumn } from "@/components/tables/data-table";

type AttributeOption = {
  id: string;
  value: string;
  label: string;
  sortOrder: number;
};

type Attribute = {
  id: string;
  name: string;
  slug: string;
  dataType: "string" | "number" | "enum";
  isRequired: boolean;
  isFilterable: boolean;
  unit: string | null;
  options?: AttributeOption[];
};

type Category = { id: string; name: string; slug: string };

type CategoryField = {
  id: string;
  name: string;
  slug: string;
  type: "string" | "number" | "enum";
  required: boolean;
  filterable: boolean;
  unit: string | null;
  options: { value: string; label: string }[];
};

type CategoryAttributesResponse = {
  category: { id: string; name: string; slug: string };
  fields: CategoryField[];
};

type CreateAttributeValues = {
  name: string;
  slug: string;
  dataType: "string" | "number" | "enum";
  unit: string;
  isRequired: boolean;
  isFilterable: boolean;
};

type AddOptionValues = {
  attributeId: string;
  value: string;
  label: string;
  sortOrder: number;
};

type MapAttributeValues = {
  categoryId: string;
  attributeId: string;
  sortOrder: number;
  isRequiredOverride: "inherit" | "true" | "false";
  isFilterableOverride: "inherit" | "true" | "false";
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
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

export default function MarketplaceAdminPanel() {
  const [attributes, setAttributes] = React.useState<Attribute[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState("");
  const [categoryFields, setCategoryFields] = React.useState<CategoryField[]>([]);
  const [message, setMessage] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const loadBaseData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [attrRes, catRes] = await Promise.all([
        request<Attribute[]>("/api/server/marketplace/attributes"),
        request<Category[]>("/api/server/marketplace/categories"),
      ]);
      setAttributes(attrRes);
      setCategories(catRes);
      if (!selectedCategoryId && catRes.length > 0) {
        setSelectedCategoryId(catRes[0].id);
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to load marketplace data");
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategoryId]);

  const loadCategoryMapping = React.useCallback(async (categoryId: string) => {
    if (!categoryId) {
      setCategoryFields([]);
      return;
    }
    try {
      const response = await request<CategoryAttributesResponse>(
        `/api/server/marketplace/categories/${categoryId}/attributes`,
      );
      setCategoryFields(response.fields ?? []);
    } catch (e) {
      setCategoryFields([]);
      setMessage(e instanceof Error ? e.message : "Failed to load category mappings");
    }
  }, []);

  React.useEffect(() => {
    void loadBaseData();
  }, [loadBaseData]);

  React.useEffect(() => {
    void loadCategoryMapping(selectedCategoryId);
  }, [loadCategoryMapping, selectedCategoryId]);

  const enumAttributes = React.useMemo(
    () => attributes.filter((attribute) => attribute.dataType === "enum"),
    [attributes],
  );

  const attributeFormFields = React.useMemo<DynamicField<CreateAttributeValues>[]>(
    () => [
      {
        type: "input",
        name: "name",
        label: "Attribute Name",
        placeholder: "GCV",
        rules: { required: "Name is required" },
        colSpan: 6,
      },
      {
        type: "input",
        name: "slug",
        label: "Slug",
        placeholder: "gcv",
        rules: { required: "Slug is required" },
        colSpan: 6,
      },
      {
        type: "select",
        name: "dataType",
        label: "Data Type",
        options: [
          { label: "String", value: "string" },
          { label: "Number", value: "number" },
          { label: "Enum", value: "enum" },
        ],
        rules: { required: "Data type is required" },
        colSpan: 4,
      },
      {
        type: "input",
        name: "unit",
        label: "Unit (optional)",
        placeholder: "kcal/kg",
        colSpan: 4,
      },
      {
        type: "switch",
        name: "isRequired",
        label: "Required by default",
        colSpan: 2,
      },
      {
        type: "switch",
        name: "isFilterable",
        label: "Filterable",
        colSpan: 2,
      },
    ],
    [],
  );

  const optionFormFields = React.useMemo<DynamicField<AddOptionValues>[]>(
    () => [
      {
        type: "select",
        name: "attributeId",
        label: "Enum Attribute",
        options: enumAttributes.map((attribute) => ({
          label: `${attribute.name} (${attribute.slug})`,
          value: attribute.id,
        })),
        rules: { required: "Select an enum attribute" },
        colSpan: 12,
      },
      {
        type: "input",
        name: "value",
        label: "Option Value",
        placeholder: "ROM",
        rules: { required: "Value is required" },
        colSpan: 4,
      },
      {
        type: "input",
        name: "label",
        label: "Option Label",
        placeholder: "ROM",
        rules: { required: "Label is required" },
        colSpan: 4,
      },
      {
        type: "input",
        name: "sortOrder",
        label: "Sort Order",
        inputType: "number",
        rules: { valueAsNumber: true },
        colSpan: 4,
      },
    ],
    [enumAttributes],
  );

  const mappingFormFields = React.useMemo<DynamicField<MapAttributeValues>[]>(
    () => [
      {
        type: "select",
        name: "categoryId",
        label: "Category",
        options: categories.map((category) => ({
          label: category.name,
          value: category.id,
        })),
        rules: { required: "Select a category" },
        colSpan: 6,
      },
      {
        type: "select",
        name: "attributeId",
        label: "Attribute",
        options: attributes.map((attribute) => ({
          label: `${attribute.name} (${attribute.slug})`,
          value: attribute.id,
        })),
        rules: { required: "Select an attribute" },
        colSpan: 6,
      },
      {
        type: "input",
        name: "sortOrder",
        label: "Sort Order",
        inputType: "number",
        rules: { valueAsNumber: true },
        colSpan: 4,
      },
      {
        type: "select",
        name: "isRequiredOverride",
        label: "Required Override",
        options: [
          { label: "Inherit", value: "inherit" },
          { label: "True", value: "true" },
          { label: "False", value: "false" },
        ],
        colSpan: 4,
      },
      {
        type: "select",
        name: "isFilterableOverride",
        label: "Filterable Override",
        options: [
          { label: "Inherit", value: "inherit" },
          { label: "True", value: "true" },
          { label: "False", value: "false" },
        ],
        colSpan: 4,
      },
    ],
    [attributes, categories],
  );

  const attributeColumns = React.useMemo<DataTableColumn<Attribute>[]>(
    () => [
      { id: "name", header: "Name", accessor: (row) => row.name, type: "text", priority: 1 },
      { id: "slug", header: "Slug", accessor: (row) => row.slug, type: "text", priority: 2 },
      {
        id: "dataType",
        header: "Type",
        accessor: (row) => row.dataType,
        type: "badge",
        priority: 3,
      },
      {
        id: "isRequired",
        header: "Required",
        accessor: (row) => row.isRequired,
        type: "boolean",
        priority: 4,
        trueLabel: "Yes",
        falseLabel: "No",
      },
      {
        id: "isFilterable",
        header: "Filterable",
        accessor: (row) => row.isFilterable,
        type: "boolean",
        priority: 5,
        trueLabel: "Yes",
        falseLabel: "No",
      },
      {
        id: "unit",
        header: "Unit",
        accessor: (row) => row.unit ?? "—",
        type: "text",
        priority: 6,
      },
      {
        id: "options",
        header: "Options",
        accessor: (row) => row.options?.length ?? 0,
        type: "number",
        align: "right",
        priority: 7,
      },
    ],
    [],
  );

  const mappingColumns = React.useMemo<DataTableColumn<CategoryField>[]>(
    () => [
      { id: "name", header: "Field", accessor: (row) => row.name, type: "text", priority: 1 },
      { id: "slug", header: "Slug", accessor: (row) => row.slug, type: "text", priority: 2 },
      { id: "type", header: "Type", accessor: (row) => row.type, type: "badge", priority: 3 },
      {
        id: "required",
        header: "Required",
        accessor: (row) => row.required,
        type: "boolean",
        priority: 4,
      },
      {
        id: "filterable",
        header: "Filterable",
        accessor: (row) => row.filterable,
        type: "boolean",
        priority: 5,
      },
      {
        id: "optionCount",
        header: "Enum Options",
        accessor: (row) => row.options?.length ?? 0,
        type: "number",
        align: "right",
        priority: 6,
      },
    ],
    [],
  );

  return (
    <main className="min-h-screen bg-muted/30 p-6 md:p-10">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <div className="rounded-xl border bg-background p-4 md:p-6">
          <h1 className="text-2xl font-semibold">Marketplace Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage attributes, enum options, and category mappings using dynamic forms and data tables.
          </p>
          {message ? (
            <div className="mt-4 rounded-md border border-muted p-2 text-sm">{message}</div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="rounded-xl border bg-background p-4 md:p-6">
            <h2 className="mb-4 text-lg font-semibold">Create Attribute</h2>
            <DynamicForm<CreateAttributeValues>
              fields={attributeFormFields}
              defaultValues={{
                name: "",
                slug: "",
                dataType: "string",
                unit: "",
                isRequired: false,
                isFilterable: false,
              }}
              submitLabel="Create Attribute"
              onSubmit={async (values) => {
                try {
                  await request("/api/server/marketplace/attributes", {
                    method: "POST",
                    body: JSON.stringify({
                      name: values.name.trim(),
                      slug: values.slug.trim().toLowerCase(),
                      dataType: values.dataType,
                      unit: values.unit.trim() || undefined,
                      isRequired: values.isRequired,
                      isFilterable: values.isFilterable,
                    }),
                  });
                  setMessage("Attribute created successfully");
                  await loadBaseData();
                } catch (e) {
                  setMessage(e instanceof Error ? e.message : "Failed to create attribute");
                }
              }}
            />
          </section>

          <section className="rounded-xl border bg-background p-4 md:p-6">
            <h2 className="mb-4 text-lg font-semibold">Add Enum Option</h2>
            <DynamicForm<AddOptionValues>
              fields={optionFormFields}
              defaultValues={{ attributeId: "", value: "", label: "", sortOrder: 0 }}
              submitLabel="Add Option"
              onSubmit={async (values) => {
                try {
                  await request(`/api/server/marketplace/attributes/${values.attributeId}/options`, {
                    method: "POST",
                    body: JSON.stringify({
                      value: values.value.trim(),
                      label: values.label.trim(),
                      sortOrder: Number(values.sortOrder || 0),
                    }),
                  });
                  setMessage("Option created successfully");
                  await loadBaseData();
                } catch (e) {
                  setMessage(e instanceof Error ? e.message : "Failed to add option");
                }
              }}
            />
          </section>

          <section className="rounded-xl border bg-background p-4 md:p-6">
            <h2 className="mb-4 text-lg font-semibold">Map Category Attribute</h2>
            <DynamicForm<MapAttributeValues>
              fields={mappingFormFields}
              defaultValues={{
                categoryId: selectedCategoryId || "",
                attributeId: "",
                sortOrder: 0,
                isRequiredOverride: "inherit",
                isFilterableOverride: "inherit",
              }}
              submitLabel="Create Mapping"
              onSubmit={async (values) => {
                try {
                  const body: Record<string, unknown> = {
                    sortOrder: Number(values.sortOrder || 0),
                  };
                  if (values.isRequiredOverride !== "inherit") {
                    body.isRequiredOverride = values.isRequiredOverride === "true";
                  }
                  if (values.isFilterableOverride !== "inherit") {
                    body.isFilterableOverride = values.isFilterableOverride === "true";
                  }
                  await request(
                    `/api/server/marketplace/categories/${values.categoryId}/attributes/${values.attributeId}`,
                    {
                      method: "POST",
                      body: JSON.stringify(body),
                    },
                  );
                  setMessage("Mapping created successfully");
                  setSelectedCategoryId(values.categoryId);
                  await loadBaseData();
                  await loadCategoryMapping(values.categoryId);
                } catch (e) {
                  setMessage(e instanceof Error ? e.message : "Failed to create mapping");
                }
              }}
            />
          </section>
        </div>

        <section className="rounded-xl border bg-background p-4 md:p-6">
          <h2 className="mb-4 text-lg font-semibold">Attributes</h2>
          <DataTable<Attribute>
            data={attributes}
            columns={attributeColumns}
            getRowId={(row) => row.id}
            isLoading={isLoading}
            caption="Admin marketplace attributes"
          />
        </section>

        <section className="rounded-xl border bg-background p-4 md:p-6 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="w-full md:max-w-sm">
              <DynamicForm<{ categoryId: string }>
                fields={[
                  {
                    type: "select",
                    name: "categoryId",
                    label: "View Mapping For Category",
                    options: categories.map((category) => ({
                      label: category.name,
                      value: category.id,
                    })),
                  },
                ]}
                defaultValues={{ categoryId: selectedCategoryId || "" }}
                submitLabel="Load Mapping"
                formGridClassName="md:grid-cols-12"
                onSubmit={async (values) => {
                  setSelectedCategoryId(values.categoryId);
                  await loadCategoryMapping(values.categoryId);
                }}
              />
            </div>
          </div>

          <DataTable<CategoryField>
            data={categoryFields}
            columns={mappingColumns}
            getRowId={(row) => row.id}
            caption="Category dynamic fields"
          />
        </section>
      </section>
    </main>
  );
}

