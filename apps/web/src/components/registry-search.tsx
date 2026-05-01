"use client";

import { Input } from "@/components/ui/input";

export function RegistrySearch() {
  return (
    <div className="relative mb-6">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
        <svg
          className="h-5 w-5 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <Input
        type="text"
        placeholder='Search CLIs... e.g. "schedule tweets" or "send emails"'
        className="h-12 rounded-xl border-border bg-card/60 pl-10 text-base placeholder:text-muted-foreground/50 focus-visible:ring-primary/30"
      />
    </div>
  );
}
