"use client";

import * as React from "react";
import Link from "next/link";
import { DynamicForm, type DynamicField } from "@/components/forms/dynamic-form";
import { DataTable, type DataTableColumn } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";

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
  dimension?: string | null;
  allowedUnits?: string[] | null;
  defaultUnit?: string | null;
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
  dimension?: string | null;
  allowedUnits?: string[];
  defaultUnit?: string | null;
  options: { value: string; label: string }[];
};

type CategoryAttributesResponse = {
  category: {
    id: string;
    name: string;
    slug: string;
    fixedFields?: {
      quantity: { dimension: string | null; allowedUnits: string[]; defaultUnit: string | null };
      price: {
        currency: string | null;
        perDimension: string | null;
        allowedPerUnits: string[];
        defaultPerUnit: string | null;
      };
    };
  };
  fields: CategoryField[];
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
  dimensionOverride: "inherit" | "mass" | "volume" | "count" | "length" | "area" | "energy_density" | "percentage";
  allowedUnitsOverrideText: string;
  defaultUnitOverride: string;
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
  const [categorySchema, setCategorySchema] = React.useState<CategoryAttributesResponse["category"] | null>(null);
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
      setCategorySchema(response.category ?? null);
      setCategoryFields(response.fields ?? []);
    } catch (e) {
      setCategorySchema(null);
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

  const dimensionOptions = React.useMemo(
    () => [
      { label: "Inherit / Not Set", value: "inherit" },
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
        colSpan: 6,
      },
      {
        type: "input",
        name: "label",
        label: "Option Label",
        placeholder: "ROM",
        rules: { required: "Label is required" },
        colSpan: 6,
      },
      {
        type: "input",
        name: "sortOrder",
        label: "Sort Order",
        inputType: "number",
        rules: { valueAsNumber: true },
        colSpan: 6,
      },
    ],
    [enumAttributes],
  );

  const mappingSections = React.useMemo(
    () => [
      {
        id: "mapping-step-1",
        title: "Step 1: Select Category + Attribute",
        fields: [
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
        ] satisfies DynamicField<MapAttributeValues>[],
      },
      {
        id: "mapping-step-2",
        title: "Step 2: Override Rules",
        description: "Use 'inherit' unless this category needs a different behavior.",
        fields: [
      {
        type: "input",
        name: "sortOrder",
        label: "Sort Order",
        inputType: "number",
        rules: { valueAsNumber: true },
        colSpan: 6,
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
        colSpan: 6,
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
        colSpan: 12,
      },
      {
        type: "select",
        name: "dimensionOverride",
        label: "Dimension Override",
        options: dimensionOptions,
        colSpan: 6,
      },
      {
        type: "input",
        name: "defaultUnitOverride",
        label: "Default Unit Override",
        placeholder: "kg",
        colSpan: 6,
      },
      {
        type: "input",
        name: "allowedUnitsOverrideText",
        label: "Allowed Units Override (comma-separated)",
        placeholder: "kg, g, ton",
        colSpan: 12,
      },
        ] satisfies DynamicField<MapAttributeValues>[],
      },
    ],
    [attributes, categories, dimensionOptions],
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
        id: "dimension",
        header: "Dimension",
        accessor: (row) => row.dimension ?? "—",
        type: "text",
        priority: 7,
      },
      {
        id: "allowedUnits",
        header: "Allowed Units",
        accessor: (row) => (row.allowedUnits ?? []).join(", ") || "—",
        type: "text",
        priority: 8,
      },
      {
        id: "options",
        header: "Options",
        accessor: (row) => row.options?.length ?? 0,
        type: "number",
        align: "right",
        priority: 9,
      },
      {
        id: "actions",
        header: "Actions",
        type: "actions",
        align: "right",
        priority: 10,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Link href={`/modules/marketplace/${row.id}/edit`}>
              <Button size="sm" variant="outline">
                Edit
              </Button>
            </Link>
          </div>
        ),
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
      {
        id: "units",
        header: "Units",
        accessor: (row) => (row.allowedUnits ?? []).join(", ") || row.unit || "—",
        type: "text",
        priority: 7,
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

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section className="rounded-xl border bg-background p-4 md:p-6">
            <h2 className="mb-2 text-lg font-semibold">Create Attribute</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Use the guided 3-step form to define attribute identity, unit rules, and behavior.
            </p>
            <Link href="/modules/marketplace/create">
              <Button>Create Attribute</Button>
            </Link>
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
              sections={mappingSections}
              defaultValues={{
                categoryId: selectedCategoryId || "",
                attributeId: "",
                sortOrder: 0,
                isRequiredOverride: "inherit",
                isFilterableOverride: "inherit",
                dimensionOverride: "inherit",
                allowedUnitsOverrideText: "",
                defaultUnitOverride: "",
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
                  if (values.dimensionOverride !== "inherit") {
                    body.dimensionOverride = values.dimensionOverride;
                  }
                  const allowedUnitsOverride = parseUnitsText(values.allowedUnitsOverrideText);
                  if (allowedUnitsOverride.length > 0) {
                    body.allowedUnitsOverride = allowedUnitsOverride;
                  }
                  if (values.defaultUnitOverride.trim()) {
                    body.defaultUnitOverride = values.defaultUnitOverride.trim();
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
          {categorySchema?.fixedFields ? (
            <div className="rounded-md border p-3 text-sm">
              <p className="font-medium">Selected Category Fixed Field Rules</p>
              <p className="text-muted-foreground">
                Quantity:{" "}
                {categorySchema.fixedFields.quantity.dimension
                  ? `${categorySchema.fixedFields.quantity.dimension} (${categorySchema.fixedFields.quantity.allowedUnits.join(", ") || "no units"})`
                  : "Not set"}
              </p>
              <p className="text-muted-foreground">
                Price:{" "}
                {categorySchema.fixedFields.price.currency &&
                categorySchema.fixedFields.price.perDimension
                  ? `${categorySchema.fixedFields.price.currency} / ${categorySchema.fixedFields.price.perDimension} (${categorySchema.fixedFields.price.allowedPerUnits.join(", ") || "no units"})`
                  : "Not set"}
              </p>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}

