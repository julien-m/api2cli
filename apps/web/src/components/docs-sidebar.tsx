"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DocSection } from "@/app/docs/doc-manager";

export function DocsSidebar({ sections }: { sections: DocSection[] }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r border-border/50 px-4 py-8 lg:block">
      <nav className="space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <h4 className="mb-2 px-2 font-[family-name:var(--font-geist-pixel-square)] text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
              {section.title}
            </h4>
            <ul className="space-y-0.5">
              {section.docs.map((doc) => {
                const active = pathname === doc.url;
                return (
                  <li key={doc.slug}>
                    <Link
                      href={doc.url}
                      className={`block rounded-lg px-2 py-1.5 text-sm transition-colors ${
                        active
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      {doc.attributes.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
