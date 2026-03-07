import Link from "next/link";

const cards = [
  {
    icon: "⚡",
    title: "Quick Start",
    description: "Install api2cli and create your first CLI in 2 minutes.",
    href: "/docs/getting-started",
  },
  {
    icon: "🔨",
    title: "Create a CLI",
    description: "Step-by-step guide to wrapping any REST API.",
    href: "/docs/create-cli",
  },
  {
    icon: "📦",
    title: "Add Resources",
    description: "Learn the resource pattern for CRUD operations.",
    href: "/docs/resources",
  },
  {
    icon: "🤖",
    title: "Agent Integration",
    description: "Use your CLI with Claude Code, Cursor, and more.",
    href: "/docs/agent-integration",
  },
  {
    icon: "📚",
    title: "Commands Reference",
    description: "Every command and flag documented.",
    href: "/docs/commands",
  },
  {
    icon: "🏪",
    title: "Marketplace",
    description: "Publish your CLI and install community CLIs.",
    href: "/docs/marketplace",
  },
];

export default function DocsIndex() {
  return (
    <div>
      <h1>Documentation</h1>
      <p>
        Learn how to turn any REST API into a standardized, agent-ready CLI.
        Every CLI you create follows the same patterns, so any AI agent that
        learns one CLI knows them all.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-xl border border-border bg-card/50 p-5 no-underline transition-all hover:border-primary/40 hover:bg-card/80"
          >
            <div className="mb-2 text-2xl">{card.icon}</div>
            <h3 className="!mt-0 !mb-1 text-sm font-semibold text-foreground">
              {card.title}
            </h3>
            <p className="!mb-0 text-xs text-muted-foreground">
              {card.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
