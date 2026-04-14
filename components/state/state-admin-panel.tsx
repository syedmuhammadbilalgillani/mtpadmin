"use client"

import * as React from "react"

import { FormBuilder } from "@/components/forms/form-builder"
import type { DynamicFormSection } from "@/components/forms/dynamic-form"
import { DataTable, type DataTableColumn } from "@/components/tables/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  bulkInsertStates,
  createState,
  deleteState,
  listStates,
  updateState,
  type AdminState,
} from "@/lib/states"

type StateFormValues = {
  name: string
  country: string
  latitude: string
  longitude: string
}

const stateSections: DynamicFormSection<StateFormValues>[] = [
  {
    id: "state",
    title: "State",
    fields: [
      {
        type: "input",
        name: "name",
        label: "Name",
        placeholder: "Punjab",
        required: true,
        rules: { required: "Name is required" },
        colSpan: 6,
      },
      {
        type: "input",
        name: "country",
        label: "Country",
        placeholder: "Pakistan",
        required: true,
        rules: { required: "Country is required" },
        colSpan: 6,
      },
      {
        type: "input",
        name: "latitude",
        label: "Latitude (optional)",
        inputType: "number",
        inputProps: { step: "any" },
        colSpan: 6,
      },
      {
        type: "input",
        name: "longitude",
        label: "Longitude (optional)",
        inputType: "number",
        inputProps: { step: "any" },
        colSpan: 6,
      },
    ],
  },
]

function parseBulkLines(text: string): Array<{
  name: string
  country: string
  latitude?: number
  longitude?: number
}> {
  // Format: Name,Country,Lat?,Lng?
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(",").map((p) => p.trim())
      const name = parts[0] ?? ""
      const country = parts[1] ?? ""
      const latRaw = parts[2]
      const lngRaw = parts[3]
      const latitude = latRaw ? Number(latRaw) : undefined
      const longitude = lngRaw ? Number(lngRaw) : undefined
      return {
        name,
        country,
        latitude: latitude !== undefined && Number.isFinite(latitude) ? latitude : undefined,
        longitude: longitude !== undefined && Number.isFinite(longitude) ? longitude : undefined,
      }
    })
    .filter((x) => x.name.length > 0 && x.country.length > 0)
}

export default function StateAdminPanel() {
  const [rows, setRows] = React.useState<AdminState[]>([])
  const [query, setQuery] = React.useState("")
  const [message, setMessage] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  const [editOpen, setEditOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<AdminState | null>(null)
  const [formKey, setFormKey] = React.useState(0)

  const [bulkOpen, setBulkOpen] = React.useState(false)
  const [bulkText, setBulkText] = React.useState("")
  const [bulkIgnoreDup, setBulkIgnoreDup] = React.useState(true)

  const load = React.useCallback(async () => {
    setIsLoading(true)
    setMessage("")
    try {
      const list = await listStates({ q: query.trim() || undefined })
      setRows(list)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to load states")
      setRows([])
    } finally {
      setIsLoading(false)
    }
  }, [query])

  React.useEffect(() => {
    void load()
  }, [load])

  const columns = React.useMemo<DataTableColumn<AdminState>[]>(
    () => [
      { id: "name", header: "Name", accessor: (r) => r.name, type: "text", priority: 1 },
      { id: "country", header: "Country", accessor: (r) => r.country, type: "text", priority: 2, hideBelow: "md" },
      { id: "lat", header: "Lat", accessor: (r) => r.latitude ?? null, type: "number", priority: 3, hideBelow: "lg" },
      { id: "lng", header: "Lng", accessor: (r) => r.longitude ?? null, type: "number", priority: 4, hideBelow: "lg" },
      {
        id: "actions",
        header: "Actions",
        type: "actions",
        align: "right",
        priority: 5,
        cell: ({ row }) => (
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditing(row)
                setFormKey((k) => k + 1)
                setEditOpen(true)
              }}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                if (!window.confirm(`Delete state "${row.name}"?`)) return
                try {
                  await deleteState(row.id)
                  setMessage("State deleted")
                  await load()
                } catch (e) {
                  setMessage(e instanceof Error ? e.message : "Delete failed")
                }
              }}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [load],
  )

  const defaultValues: StateFormValues = editing
    ? {
        name: editing.name ?? "",
        country: editing.country ?? "",
        latitude: editing.latitude === null || editing.latitude === undefined ? "" : String(editing.latitude),
        longitude: editing.longitude === null || editing.longitude === undefined ? "" : String(editing.longitude),
      }
    : { name: "", country: "", latitude: "", longitude: "" }

  return (
    <main className="min-h-screen bg-muted/30 p-6 md:p-10">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <div className="rounded-xl border bg-background p-4 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">States</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage states used for cities. You can also bulk insert from comma-separated lines.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search state..."
                className="w-full sm:w-72"
              />
              <Button
                variant="outline"
                onClick={() => {
                  setBulkText("")
                  setBulkIgnoreDup(true)
                  setBulkOpen(true)
                }}
              >
                Bulk insert
              </Button>
              <Button
                onClick={() => {
                  setEditing(null)
                  setFormKey((k) => k + 1)
                  setEditOpen(true)
                }}
              >
                Create state
              </Button>
            </div>
          </div>

          {message ? (
            <div className="mt-4 rounded-md border border-muted p-2 text-sm">{message}</div>
          ) : null}
        </div>

        <section className="rounded-xl border bg-background p-4 md:p-6">
          <DataTable<AdminState>
            data={rows}
            columns={columns}
            getRowId={(row) => row.id}
            isLoading={isLoading}
            caption="States"
          />
        </section>
      </section>

      {/* Create/Edit dialog */}
      <Dialog
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o)
          if (!o) setEditing(null)
        }}
      >
        <DialogContent className="sm:max-w-lg" showCloseButton>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit state" : "Create state"}</DialogTitle>
            <DialogDescription>
              Name and country are required. Latitude/longitude are optional.
            </DialogDescription>
          </DialogHeader>

          <FormBuilder<StateFormValues>
            key={`${editing?.id ?? "new"}-${formKey}`}
            sections={stateSections}
            defaultValues={defaultValues}
            submitLabel={editing ? "Save changes" : "Create"}
            onSubmit={async (values) => {
              setMessage("")
              try {
                const lat = values.latitude.trim() ? Number(values.latitude) : undefined
                const lng = values.longitude.trim() ? Number(values.longitude) : undefined

                const payload = {
                  name: values.name.trim(),
                  country: values.country.trim(),
                  latitude: lat !== undefined && Number.isFinite(lat) ? lat : undefined,
                  longitude: lng !== undefined && Number.isFinite(lng) ? lng : undefined,
                }

                if (editing) {
                  await updateState(editing.id, payload)
                  setMessage("State updated")
                } else {
                  await createState(payload)
                  setMessage("State created")
                }

                setEditOpen(false)
                setEditing(null)
                await load()
              } catch (e) {
                setMessage(e instanceof Error ? e.message : "Save failed")
              }
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Bulk insert dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="sm:max-w-2xl" showCloseButton>
          <DialogHeader>
            <DialogTitle>Bulk insert states</DialogTitle>
            <DialogDescription>
              Paste lines in format: <span className="font-mono">Name,Country,Latitude(optional),Longitude(optional)</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <textarea
              className="min-h-48 w-full rounded-md border bg-background p-3 text-sm"
              placeholder={"Punjab,Pakistan,31.1471,75.3412\nSindh,Pakistan\nKhyber Pakhtunkhwa,Pakistan"}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
            />

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={bulkIgnoreDup}
                onChange={(e) => setBulkIgnoreDup(e.target.checked)}
              />
              Ignore duplicates
            </label>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setBulkOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  setMessage("")
                  try {
                    const items = parseBulkLines(bulkText)
                    if (items.length === 0) throw new Error("No valid lines found")

                    const res = await bulkInsertStates({
                      ignoreDuplicates: bulkIgnoreDup,
                      items,
                    })

                    setMessage(
                      typeof res === "object" && res && "inserted" in res
                        ? `Bulk insert done (inserted: ${(res as any).inserted ?? "?"}, skipped: ${(res as any).skipped ?? 0})`
                        : "Bulk insert done",
                    )

                    setBulkOpen(false)
                    setBulkText("")
                    await load()
                  } catch (e) {
                    setMessage(e instanceof Error ? e.message : "Bulk insert failed")
                  }
                }}
              >
                Insert
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}