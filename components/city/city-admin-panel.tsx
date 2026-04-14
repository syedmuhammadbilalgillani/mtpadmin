"use client";

import * as React from "react";

import type { DynamicField } from "@/components/forms/dynamic-form";
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
import { requestJson } from "@/lib/request";

type AdminState = {
  id: string;
  name: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
};

type CityRow = {
  id: string;
  name: string;
  // server returns relation object if you include it; to be safe support both:
  state?: { id: string; name: string } | string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type CityFormValues = {
  name: string;
  stateId: string;
  latitude: number;
  longitude: number;
};

function toNumberOrUndefined(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default function CityAdminPanel() {
  const [cities, setCities] = React.useState<CityRow[]>([]);
  const [states, setStates] = React.useState<AdminState[]>([]);
  const [editingCity, setEditingCity] = React.useState<CityRow | null>(null);

  const [message, setMessage] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = React.useState(false);

  const loadCities = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await requestJson<unknown>("/api/server/city");

      const list = Array.isArray(res)
        ? (res as CityRow[])
        : typeof res === "object" && res && "data" in (res as Record<string, unknown>)
          ? (((res as { data?: unknown }).data as CityRow[]) ?? [])
          : [];

      setCities(list);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to load cities");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadStates = React.useCallback(async () => {
    try {
      const res = await requestJson<unknown>("/api/server/state");
      const list = Array.isArray(res)
        ? (res as AdminState[])
        : typeof res === "object" && res && "data" in (res as Record<string, unknown>)
          ? (((res as { data?: unknown }).data as AdminState[]) ?? [])
          : [];
      setStates(list);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to load states");
    }
  }, []);

  React.useEffect(() => {
    void loadStates();
    void loadCities();
  }, [loadCities, loadStates]);

  const stateOptions = React.useMemo(
    () =>
      states.map((s) => ({
        label: `${s.name} (${s.country})`,
        value: s.id,
      })),
    [states],
  );

  const createFields = React.useMemo<DynamicField<CityFormValues>[]>(
    () => [
      {
        type: "input",
        name: "name",
        label: "City Name",
        placeholder: "Lahore",
        rules: { required: "City name is required" },
        colSpan: 6,
      },
      {
        type: "select",
        name: "stateId",
        label: "State",
        placeholder: "Select state",
        options: stateOptions,
        rules: { required: "State is required" },
        colSpan: 6,
      },
      {
        type: "input",
        name: "latitude",
        label: "Latitude (optional)",
        placeholder: "31.5204",
        inputType: "number",
        rules: { valueAsNumber: true },
        colSpan: 6,
      },
      {
        type: "input",
        name: "longitude",
        label: "Longitude (optional)",
        placeholder: "74.3587",
        inputType: "number",
        rules: { valueAsNumber: true },
        colSpan: 6,
      },
    ],
    [stateOptions],
  );

  const updateFields = createFields;

  const cityColumns = React.useMemo<DataTableColumn<CityRow>[]>(
    () => [
      { id: "name", header: "Name", accessor: (row) => row.name, type: "text", priority: 1 },
      {
        id: "state",
        header: "State",
        accessor: (row) => {
          const s = row.state;
          if (!s) return "";
          if (typeof s === "string") return s;
          return s.name ?? "";
        },
        type: "text",
        priority: 2,
        hideBelow: "md",
      },
      {
        id: "lat",
        header: "Lat",
        accessor: (row) => row.latitude ?? null,
        type: "number",
        priority: 3,
        hideBelow: "lg",
      },
      {
        id: "lng",
        header: "Lng",
        accessor: (row) => row.longitude ?? null,
        type: "number",
        priority: 4,
        hideBelow: "lg",
      },
      {
        id: "actions",
        header: "Actions",
        type: "actions",
        align: "right",
        priority: 5,
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
                  await requestJson(`/api/server/city/${row.id}`, { method: "DELETE" });
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
                Create and manage cities. Cities are linked to a state.
              </p>
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger render={<Button>Create City</Button>} />
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create City</DialogTitle>
                  <DialogDescription>Fill in city details and save.</DialogDescription>
                </DialogHeader>

                <FormBuilder<CityFormValues>
                  fields={createFields}
                  defaultValues={{
                    name: "",
                    stateId: "",
                    latitude: 0,
                    longitude: 0,
                  }}
                  submitLabel="Create City"
                  onSubmit={async (values) => {
                    try {
                      await requestJson("/api/server/city", {
                        method: "POST",
                        body: JSON.stringify({
                          name: values.name.trim(),
                          stateId: values.stateId,
                          latitude: toNumberOrUndefined(values.latitude),
                          longitude: toNumberOrUndefined(values.longitude),
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
          <DataTable<CityRow>
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

            <FormBuilder<CityFormValues>
              key={editingCity?.id ?? "edit-city"}
              fields={updateFields}
              defaultValues={{
                name: editingCity?.name ?? "",
                stateId:
                  typeof editingCity?.state === "object" && editingCity?.state
                    ? editingCity.state.id
                    : "",
                latitude: (editingCity?.latitude ?? 0) as number,
                longitude: (editingCity?.longitude ?? 0) as number,
              }}
              submitLabel="Update City"
              onSubmit={async (values) => {
                try {
                  if (!editingCity?.id) throw new Error("No city selected for update");

                  await requestJson(`/api/server/city/${editingCity.id}`, {
                    method: "PATCH",
                    body: JSON.stringify({
                      name: values.name.trim(),
                      stateId: values.stateId,
                      latitude: toNumberOrUndefined(values.latitude),
                      longitude: toNumberOrUndefined(values.longitude),
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