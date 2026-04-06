"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { DynamicForm, type DynamicFormSection } from "@/components/forms/dynamic-form";
import { Button } from "@/components/ui/button";

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
};

type UpdateAttributeValues = {
  name: string;
  slug: string;
  dataType: "string" | "number" | "enum";
  unit: string;
  dimension: string;
  allowedUnitsText: string;
  defaultUnit: string;
  isRequired: boolean;
  isFilterable: boolean;
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

export default function MarketplaceEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const attributeId = String(params?.id ?? "");
  const [message, setMessage] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentStep, setCurrentStep] = React.useState(0);

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

  const sections = React.useMemo<DynamicFormSection<UpdateAttributeValues>[]>(
    () => [
      {
        id: "attribute-step-1",
        title: "Step 1: Attribute Identity",
        description: "Update name, slug, and data type for this attribute.",
        fields: [
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
            colSpan: 6,
          },
        ],
      },
      {
        id: "attribute-step-2",
        title: "Step 2: Unit Rules",
        description:
          "Optional for string/enum. For number attributes, keep units and dimension consistent.",
        fields: [
          {
            type: "input",
            name: "unit",
            label: "Unit (optional)",
            placeholder: "kcal/kg",
            colSpan: 4,
          },
          {
            type: "select",
            name: "dimension",
            label: "Dimension",
            options: dimensionOptions,
            colSpan: 4,
          },
          {
            type: "input",
            name: "defaultUnit",
            label: "Default Unit",
            placeholder: "kg",
            colSpan: 4,
          },
          {
            type: "input",
            name: "allowedUnitsText",
            label: "Allowed Units (comma-separated)",
            placeholder: "kg, g, ton",
            colSpan: 12,
          },
        ],
      },
      {
        id: "attribute-step-3",
        title: "Step 3: Behavior Flags",
        description: "Update default validation and filter behavior for this attribute.",
        fields: [
          {
            type: "switch",
            name: "isRequired",
            label: "Required by default",
            colSpan: 6,
          },
          {
            type: "switch",
            name: "isFilterable",
            label: "Filterable",
            colSpan: 6,
          },
        ],
      },
    ],
    [dimensionOptions],
  );

  const form = useForm<UpdateAttributeValues>({
    defaultValues: {
      name: "",
      slug: "",
      dataType: "string",
      unit: "",
      dimension: "inherit",
      allowedUnitsText: "",
      defaultUnit: "",
      isRequired: false,
      isFilterable: false,
    },
  });

  React.useEffect(() => {
    async function loadAttribute() {
      if (!attributeId) return;
      setIsLoading(true);
      try {
        const list = await request<Attribute[]>("/api/server/marketplace/attributes");
        const attribute = list.find((item) => item.id === attributeId);
        if (!attribute) {
          setMessage("Attribute not found");
          return;
        }
        form.reset({
          name: attribute.name ?? "",
          slug: attribute.slug ?? "",
          dataType: attribute.dataType ?? "string",
          unit: attribute.unit ?? "",
          dimension: attribute.dimension ?? "inherit",
          allowedUnitsText: (attribute.allowedUnits ?? []).join(", "),
          defaultUnit: attribute.defaultUnit ?? "",
          isRequired: Boolean(attribute.isRequired),
          isFilterable: Boolean(attribute.isFilterable),
        });
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Failed to load attribute");
      } finally {
        setIsLoading(false);
      }
    }
    void loadAttribute();
  }, [attributeId, form]);

  async function goToNextStep() {
    if (currentStep >= sections.length - 1) return;
    const fieldNames = sections[currentStep].fields.map((field) => field.name);
    const isValid = await form.trigger(fieldNames, { shouldFocus: true });
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, sections.length - 1));
    }
  }

  async function onSubmit(values: UpdateAttributeValues) {
    try {
      await request(`/api/server/marketplace/attributes/${attributeId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: values.name.trim(),
          slug: values.slug.trim().toLowerCase(),
          dataType: values.dataType,
          unit: values.unit.trim() || undefined,
          dimension: values.dimension !== "inherit" ? values.dimension : undefined,
          allowedUnits: parseUnitsText(values.allowedUnitsText),
          defaultUnit: values.defaultUnit.trim() || undefined,
          isRequired: values.isRequired,
          isFilterable: values.isFilterable,
        }),
      });
      router.push("/modules/marketplace");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to update attribute");
    }
  }

  return (
    <main className="min-h-screen bg-muted/30 p-6 md:p-10">
      <section className="mx-auto w-full max-w-4xl space-y-6">
        <div className="rounded-xl border bg-background p-4 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Update Marketplace Attribute</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Edit this attribute using the same guided steps used for creation.
              </p>
            </div>
            <Link href="/modules/marketplace">
              <Button variant="outline">Back to Marketplace Admin</Button>
            </Link>
          </div>
        </div>

        <section className="rounded-xl border bg-background p-4 md:p-6">
          <div className="mb-6 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            Step {currentStep + 1} of {sections.length}: {sections[currentStep]?.title}
          </div>
          {message ? (
            <div className="mb-4 rounded-md border border-muted p-2 text-sm">{message}</div>
          ) : null}
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading attribute details...</p>
          ) : (
            <>
              <DynamicForm<UpdateAttributeValues>
                form={form}
                sections={[sections[currentStep]]}
                hideSubmitButton
                onSubmit={onSubmit}
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
                {currentStep < sections.length - 1 ? (
                  <Button type="button" onClick={goToNextStep}>
                    Next Step
                  </Button>
                ) : (
                  <Button type="button" onClick={form.handleSubmit(onSubmit)}>
                    Update Attribute
                  </Button>
                )}
              </div>
            </>
          )}
        </section>
      </section>
    </main>
  );
}
