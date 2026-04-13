"use client"

import * as React from "react"

import { FormBuilder } from "@/components/forms/form-builder"
import type { DynamicFormSection } from "@/components/forms/dynamic-form"
import { DataTable, type DataTableColumn } from "@/components/tables/data-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  createFeaturePlan,
  deleteFeaturePlan,
  listFeaturePlans,
  updateFeaturePlan,
  type FeaturePlanRow,
} from "@/lib/feature-plans"

type PlanFormValues = {
  name: string
  durationDays: number
  price: number
  isActive: boolean
}

const planFormSections: DynamicFormSection<PlanFormValues>[] = [
  {
    id: "plan",
    title: "Plan details",
    fields: [
      {
        type: "input",
        name: "name",
        label: "Name",
        placeholder: "e.g. 7-day featured",
        required: true,
        rules: { required: "Name is required" },
        colSpan: 12,
      },
      {
        type: "input",
        name: "durationDays",
        label: "Duration (days)",
        inputType: "number",
        inputProps: { min: 1, step: 1 },
        required: true,
        rules: {
          required: "Duration is required",
          valueAsNumber: true,
          min: { value: 1, message: "At least 1 day" },
        },
        colSpan: 6,
      },
      {
        type: "input",
        name: "price",
        label: "Price",
        inputType: "number",
        inputProps: { min: 0, step: 0.01 },
        required: true,
        rules: {
          required: "Price is required",
          valueAsNumber: true,
          min: { value: 0, message: "Price must be 0 or more" },
        },
        colSpan: 6,
      },
      {
        type: "switch",
        name: "isActive",
        label: "Active",
        helperText: "Inactive plans can be hidden from selectors.",
        colSpan: 12,
      },
    ],
  },
]

const emptyDefaults: PlanFormValues = {
  name: "",
  durationDays: 7,
  price: 0,
  isActive: true,
}

export default function FeaturePlanAdminPanel() {
  const [rows, setRows] = React.useState<FeaturePlanRow[]>([])
  const [message, setMessage] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<FeaturePlanRow | null>(null)
  const [formKey, setFormKey] = React.useState(0)

  const load = React.useCallback(async () => {
    setIsLoading(true)
    setMessage("")
    try {
      const list = await listFeaturePlans()
      setRows(list)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to load feature plans")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setFormKey((k) => k + 1)
    setDialogOpen(true)
  }

  const openEdit = (row: FeaturePlanRow) => {
    setEditing(row)
    setFormKey((k) => k + 1)
    setDialogOpen(true)
  }

  const columns = React.useMemo<DataTableColumn<FeaturePlanRow>[]>(
    () => [
      { id: "name", header: "Name", accessor: (r) => r.name, type: "text", priority: 1 },
      {
        id: "duration",
        header: "Days",
        accessor: (r) => r.durationDays,
        type: "number",
        priority: 2,
        align: "right",
      },
      {
        id: "price",
        header: "Price",
        accessor: (r) => Number(r.price),
        type: "currency",
        priority: 3,
        align: "right",
      },
      {
        id: "active",
        header: "Active",
        accessor: (r) => r.isActive,
        type: "boolean",
        trueLabel: "Yes",
        falseLabel: "No",
        priority: 4,
      },
      {
        id: "actions",
        header: "Actions",
        type: "actions",
        align: "right",
        priority: 5,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                if (!window.confirm(`Delete plan "${row.name}"?`)) return
                try {
                  await deleteFeaturePlan(row.id)
                  setMessage("Plan deleted")
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

  const dialogDefaults: PlanFormValues = editing
    ? {
        name: editing.name,
        durationDays: editing.durationDays,
        price: Number(editing.price),
        isActive: editing.isActive,
      }
    : emptyDefaults

  return (
    <main className="min-h-screen bg-muted/30 p-6 md:p-10">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <div className="rounded-xl border bg-background p-4 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Feature plans</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Catalog of paid featured listing durations used when assigning post features.
              </p>
            </div>
            <Button onClick={openCreate}>Create plan</Button>
          </div>
          {message ? <div className="mt-4 rounded-md border border-muted p-2 text-sm">{message}</div> : null}
        </div>

        <section className="rounded-xl border bg-background p-4 md:p-6">
          <DataTable<FeaturePlanRow>
            data={rows}
            columns={columns}
            getRowId={(row) => String(row.id)}
            isLoading={isLoading}
            caption="Feature plans"
          />
        </section>
      </section>

      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o)
          if (!o) setEditing(null)
        }}
      >
        <DialogContent className="sm:max-w-lg" showCloseButton>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit feature plan" : "Create feature plan"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update plan details below." : "Add a new plan for featured listings."}
            </DialogDescription>
          </DialogHeader>

          <FormBuilder<PlanFormValues>
            key={`${editing?.id ?? "new"}-${formKey}`}
            sections={planFormSections}
            defaultValues={dialogDefaults}
            submitLabel={editing ? "Save changes" : "Create plan"}
            onSubmit={async (values) => {
              setMessage("")
              try {
                if (editing) {
                  await updateFeaturePlan(editing.id, {
                    name: values.name,
                    durationDays: values.durationDays,
                    price: values.price,
                    isActive: values.isActive,
                  })
                  setMessage("Plan updated")
                } else {
                  await createFeaturePlan({
                    name: values.name,
                    durationDays: values.durationDays,
                    price: values.price,
                    isActive: values.isActive,
                  })
                  setMessage("Plan created")
                }
                setDialogOpen(false)
                setEditing(null)
                await load()
              } catch (e) {
                setMessage(e instanceof Error ? e.message : "Save failed")
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </main>
  )
}