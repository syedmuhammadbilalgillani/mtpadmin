"use client";

import * as React from "react";
import Link from "next/link";

import { DataTable, type DataTableColumn } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deletePost, listPosts, type AdminPost } from "@/lib/posts";

export default function PostAdminPanel() {
  const [rows, setRows] = React.useState<AdminPost[]>([]);
  const [query, setQuery] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await listPosts({ q: query.trim() || undefined, page: 1, pageSize: 50 });
      setRows(res.data ?? []);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const columns = React.useMemo<DataTableColumn<AdminPost>[]>(
    () => [
      { id: "title", header: "Title", accessor: (r) => r.title, type: "text", priority: 1 },
      {
        id: "category",
        header: "Category",
        accessor: (r) => (typeof r.categoryId === "object" && r.categoryId ? r.categoryId.name : ""),
        type: "text",
        priority: 2,
        hideBelow: "md",
      },
      {
        id: "city",
        header: "City",
        accessor: (r) => (typeof r.locationId === "object" && r.locationId ? r.locationId.name : ""),
        type: "text",
        priority: 3,
        hideBelow: "lg",
      },
      { id: "price", header: "Price", accessor: (r) => r.price, type: "number", align: "right", priority: 4 },
      { id: "status", header: "Status", accessor: (r) => r.status, type: "badge", priority: 5, hideBelow: "md" },
      { id: "listingType", header: "Listing", accessor: (r) => r.listingType, type: "badge", priority: 6, hideBelow: "md" },
    {
        id: "actions",
        header: "Actions",
        type: "actions",
        align: "right",
        priority: 7,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Link href={`/modules/post/${row.id}/edit`}>
              <Button size="sm" variant="outline">
                Edit
              </Button>
            </Link>
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                try {
                  const ok = window.confirm(`Delete post "${row.title}"?`);
                  if (!ok) return;
                  await deletePost(row.id);
                  setMessage("Post deleted successfully");
                  await load();
                } catch (e) {
                  setMessage(e instanceof Error ? e.message : "Failed to delete post");
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
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.title?.toLowerCase().includes(q) || r.shortDescription?.toLowerCase().includes(q));
  }, [query, rows]);

  return (
    <main className="min-h-screen bg-muted/30 p-6 md:p-10">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <div className="rounded-xl border bg-background p-4 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Post Admin</h1>
              <p className="mt-1 text-sm text-muted-foreground">Create and manage posts linked to categories.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search posts..."
                className="w-full sm:w-72"
              />
              <Link href="/modules/post/create">
                <Button className="w-full sm:w-auto">Create Post</Button>
              </Link>
            </div>
          </div>

          {message ? <div className="mt-4 rounded-md border border-muted p-2 text-sm">{message}</div> : null}
        </div>

        <section className="rounded-xl border bg-background p-4 md:p-6">
          <DataTable<AdminPost>
            data={filtered}
            columns={columns}
            getRowId={(row) => String(row.id)}
            isLoading={isLoading}
            caption="Admin posts"
          />
        </section>
      </section>
    </main>
  );
}

