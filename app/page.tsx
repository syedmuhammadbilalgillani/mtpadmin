"use client"

import FormBuilder from "@/components/forms/form-builder"
import DataTableExample from "@/components/tables/datatable-example"
import { Badge } from "@/components/ui/badge"

export default function Home() {
  return (
    <main className="min-h-screen bg-muted/30 p-6 md:p-10">
      <section className="mx-auto w-full max-w-6xl space-y-8">
        <div className="rounded-xl border bg-background p-4 md:p-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Dynamic Builder Playground</h1>
            <p className="text-sm text-muted-foreground">
              Reusable Form + DataTable components (schema-driven) built with shadcn UI.
            </p>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="secondary">Responsive</Badge>
            <Badge variant="secondary">Typed</Badge>
            <Badge variant="secondary">Reusable</Badge>
          </div>
        </div>

        <DataTableExample />

        <section className="rounded-xl border bg-background p-4 md:p-6">
          <div className="mb-6 space-y-1">
            <h2 className="text-lg font-semibold">Dynamic Form</h2>
            <p className="text-sm text-muted-foreground">
              Reusable, schema-driven form builder (React Hook Form + shadcn UI).
            </p>
          </div>
          <FormBuilder />
        </section>
      </section>
    </main>
  )
}
