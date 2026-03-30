"use client";

import * as React from "react";

import { type DynamicField } from "@/components/forms/dynamic-form";
import { FormBuilder } from "@/components/forms/form-builder";
import { DataTable, type DataTableColumn } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type City = {
  id: string;
  name: string;
  state?: string | null;
  country: string;
};

type CreateCityValues = {
  name: string;
  state: string;
  country: string;
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

export default function CityAdminPanel() {
  const [cities, setCities] = React.useState<City[]>([]);
  const [editingCity, setEditingCity] = React.useState<City | null>(null);
  const [message, setMessage] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = React.useState(false);

  const loadCities = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await request<unknown>("/api/server/city");

      const list = Array.isArray(res)
        ? res
        : typeof res === "object" && res && "data" in (res as Record<string, unknown>)
          ? ((res as { data?: unknown }).data as City[]) ?? []
          : [];

      setCities(list);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to load cities");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadCities();
  }, [loadCities]);

  const createFields = React.useMemo<DynamicField<CreateCityValues>[]>(
    () => [
      {
        type: "input",
        name: "name",
        label: "City Name",
        placeholder: "London",
        rules: { required: "City name is required", minLength: { value: 1, message: "City is required" } },
        colSpan: 6,
      },
      {
        type: "input",
        name: "state",
        label: "State / Province (optional)",
        placeholder: "Ontario",
        rules: {
          maxLength: { value: 255, message: "State must be <= 255 characters" },
        },
        colSpan: 6,
      },
      {
        type: "input",
        name: "country",
        label: "Country",
        placeholder: "Canada",
        rules: {
          required: "Country is required",
          minLength: { value: 1, message: "Country is required" },
          maxLength: { value: 255, message: "Country must be <= 255 characters" },
        },
        colSpan: 12,
      },
    ],
    [],
  );

  const updateFields = React.useMemo<DynamicField<CreateCityValues>[]>(
    () => [
      {
        type: "input",
        name: "name",
        label: "City Name",
        placeholder: "Updated city name",
        rules: { required: "City name is required", minLength: { value: 1, message: "City is required" } },
        colSpan: 6,
      },
      {
        type: "input",
        name: "state",
        label: "State / Province (optional)",
        placeholder: "Updated state (optional)",
        rules: { maxLength: { value: 255, message: "State must be <= 255 characters" } },
        colSpan: 6,
      },
      {
        type: "input",
        name: "country",
        label: "Country",
        placeholder: "Updated country",
        rules: {
          required: "Country is required",
          minLength: { value: 1, message: "Country is required" },
          maxLength: { value: 255, message: "Country must be <= 255 characters" },
        },
        colSpan: 12,
      },
    ],
    [],
  );

  const cityColumns = React.useMemo<DataTableColumn<City>[]>(
    () => [
      { id: "name", header: "Name", accessor: (row) => row.name, type: "text", priority: 1 },
      {
        id: "state",
        header: "State",
        accessor: (row) => row.state ?? "",
        type: "text",
        priority: 2,
      },
      {
        id: "country",
        header: "Country",
        accessor: (row) => row.country,
        type: "text",
        priority: 3,
      },
      {
        id: "actions",
        header: "Actions",
        type: "actions",
        align: "right",
        priority: 4,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingCity(row);
                setIsUpdateDialogOpen(true);
              }}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                try {
                  await request(`/api/server/city/${row.id}`, { method: "DELETE" });
                  setMessage("City deleted successfully");
                  if (editingCity?.id === row.id) setEditingCity(null);
                  await loadCities();
                } catch (e) {
                  setMessage(e instanceof Error ? e.message : "Failed to delete city");
                }
              }}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [editingCity?.id, loadCities],
  );

  return (
    <main className="min-h-screen bg-muted/30 p-6 md:p-10">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <div className="rounded-xl border bg-background p-4 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">City Admin</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                City CRUD with admin-only backend endpoints.
              </p>
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger render={<Button>Create City</Button>} />
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create City</DialogTitle>
                  <DialogDescription>Fill in city details and save.</DialogDescription>
                </DialogHeader>

                <FormBuilder<CreateCityValues>
                  fields={createFields}
                  defaultValues={{ name: "", state: "", country: "" }}
                  submitLabel="Create City"
                  onSubmit={async (values) => {
                    try {
                      const trimmedState = values.state.trim();
                      await request("/api/server/city", {
                        method: "POST",
                        body: JSON.stringify({
                          name: values.name.trim(),
                          country: values.country.trim(),
                          ...(trimmedState ? { state: trimmedState } : {}),
                        }),
                      });
                      setMessage("City created successfully");
                      setIsCreateDialogOpen(false);
                      await loadCities();
                    } catch (e) {
                      setMessage(e instanceof Error ? e.message : "Failed to create city");
                    }
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          {message ? (
            <div className="mt-4 rounded-md border border-muted p-2 text-sm">{message}</div>
          ) : null}
        </div>

        <section className="rounded-xl border bg-background p-4 md:p-6">
          <h2 className="mb-4 text-lg font-semibold">Cities</h2>
          <DataTable<City>
            data={cities}
            columns={cityColumns}
            getRowId={(row) => row.id}
            isLoading={isLoading}
            caption="Admin cities"
          />
        </section>

        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Update City</DialogTitle>
              <DialogDescription>
                Update details for {editingCity?.name ?? "selected city"}.
              </DialogDescription>
            </DialogHeader>

            <FormBuilder<CreateCityValues>
              key={editingCity?.id ?? "edit-city"}
              fields={updateFields}
              defaultValues={{
                name: editingCity?.name ?? "",
                state: editingCity?.state ?? "",
                country: editingCity?.country ?? "",
              }}
              submitLabel="Update City"
              onSubmit={async (values) => {
                try {
                  if (!editingCity?.id) {
                    throw new Error("No city selected for update");
                  }

                  const trimmedState = values.state.trim();
                  await request(`/api/server/city/${editingCity.id}`, {
                    method: "PATCH",
                    body: JSON.stringify({
                      name: values.name.trim(),
                      country: values.country.trim(),
                      ...(trimmedState ? { state: trimmedState } : {}),
                    }),
                  });

                  setMessage("City updated successfully");
                  setIsUpdateDialogOpen(false);
                  await loadCities();
                } catch (e) {
                  setMessage(e instanceof Error ? e.message : "Failed to update city");
                }
              }}
            />
          </DialogContent>
        </Dialog>
      </section>
    </main>
  );
}

