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
  createPostFeature,
  deletePostFeature,
  listPostFeatures,
  updatePostFeature,
  type PostFeatureRow,
} from "@/lib/post-features"
import { listFeaturePlans, type FeaturePlanRow } from "@/lib/feature-plans"

type FeatureFormValues = {
  planId: string
  startDate: string
}

const featureFormSections = (planOptions: { label: string; value: string }[]): DynamicFormSection<FeatureFormValues>[] => [
  {
    id: "assign",
    title: "New feature window",
    description: "Pick a plan and optional start time. End date follows the plan duration if omitted on the server.",
    fields: [
      {
        type: "select",
        name: "planId",
        label: "Feature plan",
        placeholder: "Select plan",
        options: planOptions,
        required: true,
        rules: { required: "Select a plan" },
        colSpan: 12,
      },
      {
        type: "input",
        name: "startDate",
        label: "Start (optional)",
        inputType: "datetime-local",
        helperText: "Leave empty to start now.",
        colSpan: 12,
      },
    ],
  },
]

export type PostFeatureDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  postId: number | null
  postTitle?: string
  onSaved?: () => void
}

export function PostFeatureDialog({ open, onOpenChange, postId, postTitle, onSaved }: PostFeatureDialogProps) {
  const [plans, setPlans] = React.useState<FeaturePlanRow[]>([])
  const [features, setFeatures] = React.useState<PostFeatureRow[]>([])
  const [loadingPlans, setLoadingPlans] = React.useState(false)
  const [loadingFeatures, setLoadingFeatures] = React.useState(false)
  const [error, setError] = React.useState("")
  const [formKey, setFormKey] = React.useState(0)

  const planOptions = React.useMemo(
    () =>
      plans
        .filter((p) => p.isActive)
        .map((p) => ({
          label: `${p.name} (${p.durationDays}d · $${Number(p.price).toFixed(2)})`,
          value: String(p.id),
        })),
    [plans],
  )

  const refreshFeatures = React.useCallback(async () => {
    if (postId == null) return
    setLoadingFeatures(true)
    setError("")
    try {
      const list = await listPostFeatures(postId)
      setFeatures(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load features")
      setFeatures([])
    } finally {
      setLoadingFeatures(false)
    }
  }, [postId])

  React.useEffect(() => {
    if (!open || postId == null) return

    let cancelled = false
    ;(async () => {
      setLoadingPlans(true)
      setError("")
      try {
        const raw = await listFeaturePlans()
        const list = Array.isArray(raw) ? raw : []
        if (!cancelled) setPlans(list)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load plans")
      } finally {
        if (!cancelled) setLoadingPlans(false)
      }
    })()

    void refreshFeatures()
    setFormKey((k) => k + 1)

    return () => {
      cancelled = true
    }
  }, [open, postId, refreshFeatures])

  const featureColumns = React.useMemo<DataTableColumn<PostFeatureRow>[]>(() => {
    if (postId == null) return []
    const pid = postId
    return [
      {
        id: "plan",
        header: "Plan",
        accessor: (r) => r.plan?.name ?? "—",
        type: "text",
        priority: 1,
      },
      {
        id: "start",
        header: "Start",
        accessor: (r) => r.startDate,
        type: "datetime",
        priority: 2,
        hideBelow: "md",
      },
      {
        id: "end",
        header: "End",
        accessor: (r) => r.endDate,
        type: "datetime",
        priority: 3,
        hideBelow: "md",
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
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  await updatePostFeature(pid, row.id, { isActive: !row.isActive })
                  await refreshFeatures()
                  onSaved?.()
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Update failed")
                }
              }}
            >
              {row.isActive ? "Deactivate" : "Activate"}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                if (!window.confirm("Remove this feature window?")) return
                try {
                  await deletePostFeature(pid, row.id)
                  await refreshFeatures()
                  onSaved?.()
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Delete failed")
                }
              }}
            >
              Remove
            </Button>
          </div>
        ),
      },
    ]
  }, [postId, refreshFeatures, onSaved])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl" showCloseButton>
        <DialogHeader>
          <DialogTitle>Feature post</DialogTitle>
          <DialogDescription>
            {postTitle ? (
              <>
                Manage featured placement for <span className="font-medium text-foreground">{postTitle}</span>.
              </>
            ) : (
              "Assign a feature plan and manage active windows."
            )}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div>
        ) : null}

        {loadingPlans ? (
          <p className="text-sm text-muted-foreground">Loading plans…</p>
        ) : planOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active feature plans. Create plans in the backend first.</p>
        ) : (
          <FormBuilder<FeatureFormValues>
            key={formKey}
            sections={featureFormSections(planOptions)}
            defaultValues={{ planId: "", startDate: "" }}
            submitLabel="Add feature"
            onSubmit={async (values) => {
              if (postId == null) return
              setError("")
              try {
                const startDate =
                  values.startDate.trim() !== ""
                    ? new Date(values.startDate).toISOString()
                    : undefined
                await createPostFeature(postId, {
                  planId: Number(values.planId),
                  startDate,
                })
                await refreshFeatures()
                onSaved?.()
                setFormKey((k) => k + 1)
              } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to create feature")
              }
            }}
          />
        )}

        <div className="space-y-2 border-t pt-4">
          <h3 className="text-sm font-medium">Current feature windows</h3>
          <DataTable<PostFeatureRow>
            data={features}
            columns={featureColumns}
            getRowId={(row) => String(row.id)}
            isLoading={loadingFeatures}
            emptyText="No feature windows for this post."
            enablePagination={features.length > 10}
            caption="Post features"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}