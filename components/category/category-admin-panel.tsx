"use client";

import * as React from "react";
import { DynamicForm, type DynamicField } from "@/components/forms/dynamic-form";
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

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  backgroundImageUrl?: string | null;
  postImages?: string[] | null;
};

type CategoryListResponse = {
  data: Category[];
};

type CreateCategoryValues = {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  backgroundImageUrl: string;
};

type UpdateCategoryValues = {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  backgroundImageUrl: string;
};

type ReplacePostImagesValues = {
  postImagesText: string;
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

export default function CategoryAdminPanel() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState("");
  const [selectedCategoryImages, setSelectedCategoryImages] = React.useState<string[]>([]);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);
  const [message, setMessage] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = React.useState(false);
  const [isPostImagesDialogOpen, setIsPostImagesDialogOpen] = React.useState(false);

  const createImageRef = React.useRef<HTMLInputElement>(null);
  const createBackgroundImageRef = React.useRef<HTMLInputElement>(null);
  const updateImageRef = React.useRef<HTMLInputElement>(null);
  const updateBackgroundImageRef = React.useRef<HTMLInputElement>(null);
  const postImagesRef = React.useRef<HTMLInputElement>(null);

  const selectedCategory = React.useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );

  const loadCategories = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await request<CategoryListResponse>("/api/server/categories");
      const list = response.data ?? [];
      setCategories(list);
      if (!selectedCategoryId && list.length > 0) {
        setSelectedCategoryId(list[0].id);
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategoryId]);

  const loadCategoryPostImages = React.useCallback(async (categoryId: string) => {
    if (!categoryId) {
      setSelectedCategoryImages([]);
      return;
    }
    try {
      const response = await request<{ postImages: string[] }>(
        `/api/server/categories/${categoryId}/post-images`,
      );
      setSelectedCategoryImages(response.postImages ?? []);
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

  const createFields = React.useMemo<DynamicField<CreateCategoryValues>[]>(
    () => [
      {
        type: "input",
        name: "name",
        label: "Category Name",
        placeholder: "Coal",
        rules: { required: "Name is required" },
        colSpan: 6,
      },
      {
        type: "input",
        name: "slug",
        label: "Slug",
        placeholder: "coal",
        rules: { required: "Slug is required" },
        colSpan: 6,
      },
      {
        type: "textarea",
        name: "description",
        label: "Description",
        placeholder: "Category description",
        colSpan: 12,
      },
      {
        type: "input",
        name: "imageUrl",
        label: "Image URL (optional)",
        placeholder: "https://...",
        colSpan: 6,
      },
      {
        type: "input",
        name: "backgroundImageUrl",
        label: "Background Image URL (optional)",
        placeholder: "https://...",
        colSpan: 6,
      },
    ],
    [],
  );

  const updateFields = React.useMemo<DynamicField<UpdateCategoryValues>[]>(
    () => [
      {
        type: "input",
        name: "name",
        label: "Name",
        placeholder: "Updated name",
        rules: { required: "Name is required" },
        colSpan: 6,
      },
      {
        type: "input",
        name: "slug",
        label: "Slug",
        placeholder: "updated-slug",
        rules: { required: "Slug is required" },
        colSpan: 6,
      },
      {
        type: "textarea",
        name: "description",
        label: "Description",
        placeholder: "Updated description",
        colSpan: 12,
      },
      {
        type: "input",
        name: "imageUrl",
        label: "Image URL (optional)",
        placeholder: "https://...",
        colSpan: 6,
      },
      {
        type: "input",
        name: "backgroundImageUrl",
        label: "Background Image URL (optional)",
        placeholder: "https://...",
        colSpan: 6,
      },
    ],
    [],
  );

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

  const categoryColumns = React.useMemo<DataTableColumn<Category>[]>(
    () => [
      { id: "name", header: "Name", accessor: (row) => row.name, type: "text", priority: 1 },
      { id: "slug", header: "Slug", accessor: (row) => row.slug, type: "text", priority: 2 },
      {
        id: "image",
        header: "Image",
        accessor: (row) => row.imageUrl ?? "",
        type: "image",
        priority: 3,
      },
      {
        id: "postImagesCount",
        header: "Post Images",
        accessor: (row) => row.postImages?.length ?? 0,
        type: "number",
        align: "right",
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
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingCategory(row);
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
                  await request(`/api/server/categories/${row.id}`, { method: "DELETE" });
                  setMessage("Category deleted successfully");
                  if (selectedCategoryId === row.id) {
                    setSelectedCategoryId("");
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
                Category CRUD and post images in a simpler flow.
              </p>
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger render={<Button>Create Category</Button>} />
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Create Category</DialogTitle>
                  <DialogDescription>
                    Fill category details and optionally upload image/background image.
                  </DialogDescription>
                </DialogHeader>

                <DynamicForm<CreateCategoryValues>
                  fields={createFields}
                  defaultValues={{
                    name: "",
                    slug: "",
                    description: "",
                    imageUrl: "",
                    backgroundImageUrl: "",
                  }}
                  submitLabel="Create Category"
                  footer={
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Upload Image (optional)</label>
                        <input
                          ref={createImageRef}
                          type="file"
                          accept="image/*"
                          className="w-full rounded-md border px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Upload Background Image (optional)
                        </label>
                        <input
                          ref={createBackgroundImageRef}
                          type="file"
                          accept="image/*"
                          className="w-full rounded-md border px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  }
                  onSubmit={async (values) => {
                    try {
                      const formData = new FormData();
                      formData.append("name", values.name.trim());
                      formData.append("slug", values.slug.trim().toLowerCase());
                      if (values.description.trim()) {
                        formData.append("description", values.description.trim());
                      }
                      if (values.imageUrl.trim()) {
                        formData.append("imageUrl", values.imageUrl.trim());
                      }
                      if (values.backgroundImageUrl.trim()) {
                        formData.append("backgroundImageUrl", values.backgroundImageUrl.trim());
                      }
                      const imageFile = createImageRef.current?.files?.[0];
                      const backgroundFile = createBackgroundImageRef.current?.files?.[0];
                      if (imageFile) formData.append("image", imageFile);
                      if (backgroundFile) formData.append("backgroundImage", backgroundFile);

                      await request("/api/server/categories", {
                        method: "POST",
                        body: formData,
                      });
                      if (createImageRef.current) createImageRef.current.value = "";
                      if (createBackgroundImageRef.current) createBackgroundImageRef.current.value = "";
                      setMessage("Category created successfully");
                      setIsCreateDialogOpen(false);
                      await loadCategories();
                    } catch (e) {
                      setMessage(e instanceof Error ? e.message : "Failed to create category");
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
          <h2 className="mb-4 text-lg font-semibold">Categories</h2>
          <DataTable<Category>
            data={categories}
            columns={categoryColumns}
            getRowId={(row) => row.id}
            isLoading={isLoading}
            caption="Admin categories"
          />
        </section>

        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Update Category</DialogTitle>
              <DialogDescription>
                Update details for {editingCategory?.name ?? "selected category"}.
              </DialogDescription>
            </DialogHeader>

            <DynamicForm<UpdateCategoryValues>
              key={editingCategory?.id ?? "edit-category"}
              fields={updateFields}
              defaultValues={{
                name: editingCategory?.name ?? "",
                slug: editingCategory?.slug ?? "",
                description: editingCategory?.description ?? "",
                imageUrl: editingCategory?.imageUrl ?? "",
                backgroundImageUrl: editingCategory?.backgroundImageUrl ?? "",
              }}
              submitLabel="Update Category"
              footer={
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Upload New Category Image (optional, replaces current image)
                    </label>
                    <input
                      ref={updateImageRef}
                      type="file"
                      accept="image/*"
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Upload New Background Image (optional, replaces current background image)
                    </label>
                    <input
                      ref={updateBackgroundImageRef}
                      type="file"
                      accept="image/*"
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              }
              onSubmit={async (values) => {
                try {
                  if (!editingCategory?.id) {
                    throw new Error("No category selected for update");
                  }
                  const imageFile = updateImageRef.current?.files?.[0];
                  const backgroundImageFile =
                    updateBackgroundImageRef.current?.files?.[0];
                  if (imageFile || backgroundImageFile) {
                    const formData = new FormData();
                    if (imageFile) {
                      formData.append("image", imageFile);
                    }
                    if (backgroundImageFile) {
                      formData.append("backgroundImage", backgroundImageFile);
                    }
                    formData.append("name", values.name.trim());
                    formData.append("slug", values.slug.trim().toLowerCase());
                    if (values.description.trim()) {
                      formData.append("description", values.description.trim());
                    }
                    if (values.imageUrl.trim()) formData.append("imageUrl", values.imageUrl.trim());
                    if (values.backgroundImageUrl.trim()) {
                      formData.append("backgroundImageUrl", values.backgroundImageUrl.trim());
                    }
                    await request(`/api/server/categories/${editingCategory.id}`, {
                      method: "PATCH",
                      body: formData,
                    });
                  } else {
                    await request(`/api/server/categories/${editingCategory.id}`, {
                      method: "PATCH",
                      body: JSON.stringify({
                        name: values.name.trim(),
                        slug: values.slug.trim().toLowerCase(),
                        description: values.description.trim() || undefined,
                        imageUrl: values.imageUrl.trim() || undefined,
                        backgroundImageUrl: values.backgroundImageUrl.trim() || undefined,
                      }),
                    });
                  }
                  if (updateImageRef.current) updateImageRef.current.value = "";
                  if (updateBackgroundImageRef.current) {
                    updateBackgroundImageRef.current.value = "";
                  }
                  setMessage("Category updated successfully");
                  setIsUpdateDialogOpen(false);
                  setSelectedCategoryId(editingCategory.id);
                  await loadCategories();
                  await loadCategoryPostImages(editingCategory.id);
                } catch (e) {
                  setMessage(e instanceof Error ? e.message : "Failed to update category");
                }
              }}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={isPostImagesDialogOpen} onOpenChange={setIsPostImagesDialogOpen}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>Category Post Images</DialogTitle>
              <DialogDescription>
                {selectedCategory
                  ? `Manage post images for ${selectedCategory.name} (${selectedCategory.slug}).`
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
                        const formData = new FormData();
                        Array.from(files).forEach((file) => formData.append("files", file));
                        await request(`/api/server/categories/${selectedCategoryId}/post-images`, {
                          method: "POST",
                          body: formData,
                        });
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

              <DynamicForm<ReplacePostImagesValues>
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
                    await request(`/api/server/categories/${selectedCategoryId}/post-images`, {
                      method: "PATCH",
                      body: JSON.stringify({ postImages }),
                    });
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
                            await request(
                              `/api/server/categories/${selectedCategoryId}/post-images`,
                              {
                                method: "DELETE",
                                body: JSON.stringify({ imageUrl }),
                              },
                            );
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
