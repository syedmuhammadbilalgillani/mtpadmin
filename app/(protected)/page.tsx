import Link from "next/link";

const modules = [
  {
    title: "Category Module",
    description:
      "Manage category CRUD, upload images, and maintain category post images in one place.",
    href: "/admin/modules/category",
  },
  {
    title: "Marketplace Module",
    description:
      "Manage marketplace attributes, enum options, and category-attribute mappings.",
    href: "/admin/modules/marketplace",
  },
  {
    title: "City Module",
    description: "Manage cities CRUD (name, state/province, country) in one place.",
    href: "/admin/modules/city",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-muted/30 p-6 md:p-10">
      <section className="mx-auto w-full max-w-6xl space-y-6">
        <div className="rounded-xl border bg-background p-5 md:p-6">
          <h1 className="text-2xl font-semibold">Admin Modules</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Open a module to manage data with a focused workflow and cleaner UI.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {modules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="rounded-xl border bg-background p-5 transition-colors hover:bg-muted/40"
            >
              <h2 className="text-lg font-semibold">{module.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{module.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
