import { Navbar } from "@/components/navbar";
import { DocsSidebar } from "@/components/docs-sidebar";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="mx-auto flex max-w-7xl flex-1">
        <DocsSidebar />
        <main className="min-w-0 flex-1 px-8 py-12 lg:px-16">
          <article className="docs-content mx-auto max-w-3xl">
            {children}
          </article>
        </main>
      </div>
    </div>
  );
}
