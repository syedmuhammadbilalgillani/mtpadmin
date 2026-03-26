"use client"

import * as React from "react"

import { DataTable, type DataTableColumn } from "@/components/tables/data-table"
import { Button } from "@/components/ui/button"

type DemoUserRow = {
  id: string
  name: string
  email: string
  status: "active" | "pending" | "blocked"
  verified: boolean
  createdAt: string
  balance: number
  tags: string[]
  progress: number
  website: string
}

export default function DataTableExample() {
  const [payloadPreview, setPayloadPreview] = React.useState<string>("")
  const [selectedUserKeys, setSelectedUserKeys] = React.useState<string[]>([])

  const tableData: DemoUserRow[] = React.useMemo(
    () => [
      {
        id: "u_1001",
        name: "John Doe",
        email: "john@company.com",
        status: "active",
        verified: true,
        createdAt: "2026-03-20T10:15:00Z",
        balance: 1234.56,
        tags: ["admin", "finance", "ops"],
        progress: 78,
        website: "https://example.com",
      },
      {
        id: "u_1002",
        name: "Ayesha Khan",
        email: "ayesha@company.com",
        status: "pending",
        verified: false,
        createdAt: "2026-03-18T08:00:00Z",
        balance: 98.1,
        tags: ["manager"],
        progress: 35,
        website: "https://nextjs.org",
      },
      {
        id: "u_1003",
        name: "Sam Lee",
        email: "sam@company.com",
        status: "blocked",
        verified: false,
        createdAt: "2026-02-01T18:30:00Z",
        balance: 0,
        tags: ["viewer", "trial", "support"],
        progress: 10,
        website: "https://react.dev",
      },
    ],
    []
  )

  const tableColumns: DataTableColumn<DemoUserRow>[] = React.useMemo(
    () => [
      { id: "name", header: "Name", type: "text", accessor: (r) => r.name, priority: 1 },
      {
        id: "email",
        header: "Email",
        type: "text",
        accessor: (r) => r.email,
        priority: 2,
        hideBelow: "md",
      },
      {
        id: "status",
        header: "Status",
        type: "status",
        accessor: (r) => r.status,
        priority: 3,
        statusVariantMap: {
          active: "default",
          pending: "secondary",
          blocked: "destructive",
        },
      },
      {
        id: "verified",
        header: "Verified",
        type: "boolean",
        accessor: (r) => r.verified,
        trueLabel: "Verified",
        falseLabel: "Not verified",
        hideBelow: "md",
        priority: 7,
      },
      {
        id: "createdAt",
        header: "Created",
        type: "datetime",
        accessor: (r) => r.createdAt,
        hideBelow: "md",
        priority: 8,
      },
      {
        id: "balance",
        header: "Balance",
        type: "currency",
        accessor: (r) => r.balance,
        align: "right",
        hideBelow: "lg",
        priority: 9,
        format: { currency: "USD" },
      },
      {
        id: "tags",
        header: "Tags",
        type: "tags",
        accessor: (r) => r.tags,
        hideBelow: "lg",
        priority: 10,
        maxTags: 2,
      },
      {
        id: "progress",
        header: "Onboarding",
        type: "progress",
        accessor: (r) => r.progress,
        hideBelow: "lg",
        priority: 11,
      },
      {
        id: "website",
        header: "Website",
        type: "link",
        accessor: (r) => r.website,
        href: (r) => r.website,
        hideBelow: "xl",
        priority: 12,
      },
      {
        id: "actions",
        header: "Actions",
        type: "actions",
        align: "right",
        priority: 4,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => alert(`View ${row.id}`)}>
              View
            </Button>
            <Button size="sm" variant="outline" onClick={() => alert(`Edit ${row.id}`)}>
              Edit
            </Button>
          </div>
        ),
      },
    ],
    []
  )

  return (
    <section className="rounded-xl border bg-background p-4 md:p-6">
      <div className="mb-6 space-y-1">
        <h2 className="text-lg font-semibold">DataTable</h2>
        <p className="text-sm text-muted-foreground">
          Reusable table example with typed columns, responsive mapping, and optional row selection.
        </p>
      </div>
      <DataTable<DemoUserRow>
        data={tableData}
        columns={tableColumns}
        getRowId={(row) => row.id}
        caption="Demo users table"
        enableRowSelection
        selectedRowKeys={selectedUserKeys}
        onSelectedRowKeysChange={setSelectedUserKeys}
        onSelectedRowsChange={(rows) => {
          setPayloadPreview(
            JSON.stringify(
              {
                selectedKeys: rows.map((row) => row.id),
                selectedRows: rows,
              },
              null,
              2
            )
          )
        }}
        onRowClick={(row) => setPayloadPreview(JSON.stringify(row, null, 2))}
      />
      <p className="mt-3 text-xs text-muted-foreground">
        Selected keys: {selectedUserKeys.length ? selectedUserKeys.join(", ") : "None"}
      </p>
      <div className="mt-4 space-y-2">
        <h3 className="text-sm font-medium">Table Payload Preview</h3>
        <pre className="overflow-auto rounded-md border bg-muted p-3 text-xs">{payloadPreview}</pre>
      </div>
    </section>
  )
}
