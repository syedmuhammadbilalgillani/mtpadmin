"use client";

import * as React from "react";
import Link from "next/link";
import { FormBuilder } from "@/components/forms/form-builder";
import type { DynamicField } from "@/components/forms/dynamic-form";
import { DataTable, type DataTableColumn } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  deleteCategory,
  deleteCategoryPostImage,
  getCategoryPostImages,
  listCategories,
  replaceCategoryPostImages,
  type AdminCategory as Category,
  uploadCategoryPostImages,
} from "@/lib/categories";

type ReplacePostImagesValues = {
  postImagesText: string;
};

export default function CategoryAdminPanel() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [query, setQuery] = React.useState("");
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<number | null>(null);
  const [selectedCategoryImages, setSelectedCategoryImages] = React.useState<string[]>([]);
  const [message, setMessage] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPostImagesDialogOpen, setIsPostImagesDialogOpen] = React.useState(false);

  const postImagesRef = React.useRef<HTMLInputElement>(null);

  const selectedCategory = React.useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );

  const loadCategories = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await listCategories();
      setCategories(list);
      if (selectedCategoryId === null && list.length > 0) {
        setSelectedCategoryId(list[0].id);
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategoryId]);

  const loadCategoryPostImages = React.useCallback(async (categoryId: number | null) => {
    if (!categoryId) {
      setSelectedCategoryImages([]);
      return;
    }
    try {
      setSelectedCategoryImages(await getCategoryPostImages(categoryId));
    } catch (e) {
      setSelectedCategoryImages([]);
      setMessage(e instanceof Error ? e.message : "Failed to load category post images");
    }
  }, []);

  React.useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  React.useEffect(() => {
    void loadCategoryPostImages(selectedCategoryId);
  }, [loadCategoryPostImages, selectedCategoryId]);

  const replacePostImagesFields = React.useMemo<DynamicField<ReplacePostImagesValues>[]>(
    () => [
      {
        type: "textarea",
        name: "postImagesText",
        label: "Replace Post Images (one URL per line)",
        placeholder: "https://...\nhttps://...",
        colSpan: 12,
      },
    ],
    [],
  );

  const filteredCategories = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => {
      return (
        c.name?.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [categories, query]);

  const categoryColumns = React.useMemo<DataTableColumn<Category>[]>(
    () => [
      { id: "name", header: "Name", accessor: (row) => row.name, type: "text", priority: 1 },
      {
        id: "iconImageUrl",
        header: "Icon",
        accessor: (row) => row.iconImageUrl ?? "",
        type: "image",
        priority: 2,
        hideBelow: "md",
      },
      {
        id: "postImagesCount",
        header: "Post Images",
        accessor: (row) => row.postImages?.length ?? 0,
        type: "number",
        align: "right",
        priority: 3,
      },
      {
        id: "backgroundImageUrl",
        header: "Background",
        accessor: (row) => row.backgroundImageUrl ?? "",
        type: "image",
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
              onClick={async () => {
                setSelectedCategoryId(row.id);
                await loadCategoryPostImages(row.id);
                setMessage(`Loaded post images for ${row.name}`);
                setIsPostImagesDialogOpen(true);
              }}
            >
              View Post Images
            </Button>
            <Link href={`/modules/category/${row.id}/edit`}>
              <Button size="sm" variant="outline">
                Edit
              </Button>
            </Link>
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                try {
                  const ok = window.confirm(`Delete category "${row.name}"? This cannot be undone.`);
                  if (!ok) return;

                  await deleteCategory(row.id);
                  setMessage("Category deleted successfully");
                  if (selectedCategoryId === row.id) {
                    setSelectedCategoryId(null);
                    setSelectedCategoryImages([]);
                  }
                  await loadCategories();
                } catch (e) {
                  setMessage(e instanceof Error ? e.message : "Failed to delete category");
                }
              }}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [loadCategories, loadCategoryPostImages, selectedCategoryId],
  );

  return (
    <main className="min-h-screen bg-muted/30 p-6 md:p-10">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <div className="rounded-xl border bg-background p-4 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Category Admin</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Category CRUD with post image management.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search categories..."
                className="w-full sm:w-72"
              />
              <Link href="/modules/category/create">
                <Button className="w-full sm:w-auto">Create Category</Button>
              </Link>
            </div>
          </div>

          {message ? (
            <div className="mt-4 rounded-md border border-muted p-2 text-sm">{message}</div>
          ) : null}
        </div>

        <section className="rounded-xl border bg-background p-4 md:p-6">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <h2 className="text-lg font-semibold">Categories</h2>
            <p className="text-xs text-muted-foreground">
              Showing {filteredCategories.length} of {categories.length}
            </p>
          </div>
          <DataTable<Category>
            data={filteredCategories}
            columns={categoryColumns}
            getRowId={(row) => String(row.id)}
            isLoading={isLoading}
            caption="Admin categories"
          />
        </section>

        <Dialog open={isPostImagesDialogOpen} onOpenChange={setIsPostImagesDialogOpen}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>Category Post Images</DialogTitle>
              <DialogDescription>
                {selectedCategory
                  ? `Manage post images for ${selectedCategory.name}.`
                  : "Select a category from table and click 'View Post Images'."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium">Upload New Post Images</label>
                <div className="flex flex-col gap-3 md:flex-row">
                  <input
                    ref={postImagesRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                  <Button
                    type="button"
                    onClick={async () => {
                      try {
                        if (!selectedCategoryId) throw new Error("Load a category first");
                        const files = postImagesRef.current?.files;
                        if (!files || files.length === 0) {
                          throw new Error("Select at least one image");
                        }
                        await uploadCategoryPostImages(selectedCategoryId, files);
                        if (postImagesRef.current) postImagesRef.current.value = "";
                        setMessage("Post images uploaded successfully");
                        await loadCategories();
                        await loadCategoryPostImages(selectedCategoryId);
                      } catch (e) {
                        setMessage(
                          e instanceof Error ? e.message : "Failed to upload post images",
                        );
                      }
                    }}
                  >
                    Upload Images
                  </Button>
                </div>
              </div>

              <FormBuilder<ReplacePostImagesValues>
                key={`replace-post-images-${selectedCategoryId}-${selectedCategoryImages.length}`}
                fields={replacePostImagesFields}
                defaultValues={{ postImagesText: selectedCategoryImages.join("\n") }}
                submitLabel="Replace All Post Images"
                onSubmit={async (values) => {
                  try {
                    if (!selectedCategoryId) throw new Error("Load a category first");
                    const postImages = values.postImagesText
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean);
                    await replaceCategoryPostImages(selectedCategoryId, postImages);
                    setMessage("Post images list updated successfully");
                    await loadCategories();
                    await loadCategoryPostImages(selectedCategoryId);
                  } catch (e) {
                    setMessage(
                      e instanceof Error ? e.message : "Failed to replace post images",
                    );
                  }
                }}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {selectedCategoryImages.length === 0 ? (
                  <div className="col-span-full rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                    No post images found for selected category.
                  </div>
                ) : (
                  selectedCategoryImages.map((imageUrl) => (
                    <div key={imageUrl} className="space-y-2 rounded-md border p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt="Category post"
                        className="h-36 w-full rounded-md border object-cover"
                      />
                      <p className="truncate text-xs text-muted-foreground" title={imageUrl}>
                        {imageUrl}
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="w-full"
                        onClick={async () => {
                          try {
                            if (!selectedCategoryId) throw new Error("Load a category first");
                            await deleteCategoryPostImage(selectedCategoryId, imageUrl);
                            setMessage("Post image deleted successfully");
                            await loadCategories();
                            await loadCategoryPostImages(selectedCategoryId);
                          } catch (e) {
                            setMessage(
                              e instanceof Error ? e.message : "Failed to delete post image",
                            );
                          }
                        }}
                      >
                        Delete Image
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </section>
    </main>
  );
}
