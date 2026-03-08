import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Getting Started - Install api2cli in 30 Seconds",
  description:
    "Install the api2cli skill in your AI agent and create CLI wrappers for any REST API. Works with Claude Code, Cursor, Codex, Gemini CLI, and 40+ coding agents.",
  alternates: { canonical: "https://api2cli.dev/docs/getting-started" },
  openGraph: {
    title: "Getting Started with api2cli",
    description:
      "Install the skill, tell your agent what API you need. One command, fully ready.",
    url: "https://api2cli.dev/docs/getting-started",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "HowTo",
      name: "How to Get Started with api2cli",
      description:
        "Install the api2cli skill in your AI agent and create CLI wrappers for any REST API.",
      totalTime: "PT2M",
      step: [
        {
          "@type": "HowToStep",
          name: "Install the Skill",
          text: "Run npx sundial-hub add melvynx/api2cli or npx skills add Melvynx/api2cli to install the api2cli skill in your coding agent.",
        },
        {
          "@type": "HowToStep",
          name: "Ask Your Agent",
          text: "Tell your agent in plain English: 'Use api2cli to create CLI for typefully api'. The agent discovers the API, generates resources, builds, and links the CLI.",
        },
        {
          "@type": "HowToStep",
          name: "Use Your CLI",
          text: "Set your API token with <app>-cli auth set, then start using commands like <app>-cli drafts list.",
        },
      ],
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://api2cli.dev" },
        { "@type": "ListItem", position: 2, name: "Docs", item: "https://api2cli.dev/docs" },
        { "@type": "ListItem", position: 3, name: "Getting Started" },
      ],
    },
  ],
};

export default function GettingStarted() {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1>Getting Started</h1>
      <p>
        Install the api2cli skill in your AI agent. Tell it what API you need.
        Done. Your agent handles everything.
      </p>

      <h2>1. Install the Skill</h2>
      <p>Pick whichever method you prefer:</p>

      <h3>
        Option A: <a href="https://www.sundialhub.com">Sundial Hub</a>
      </h3>
      <pre>
        <code>npx sundial-hub add melvynx/api2cli</code>
      </pre>
      <p>
        <a href="https://www.sundialhub.com">Sundial</a> is the open registry
        for agent skills. It auto-detects your coding agents (Claude Code,
        Cursor, Codex, Gemini CLI, and more) and installs the skill to all of
        them.
      </p>

      <h3>
        Option B: <a href="https://github.com/vercel-labs/skills">Skills CLI</a>
      </h3>
      <pre>
        <code>npx skills add Melvynx/api2cli</code>
      </pre>
      <p>
        The{" "}
        <a href="https://github.com/vercel-labs/skills">skills CLI</a> also
        auto-detects your agents and installs to all of them.
      </p>

      <h3>Options (both CLIs)</h3>
      <pre>
        <code>{`# Install to specific agents only
npx skills add Melvynx/api2cli -a claude-code -a cursor

# Install globally (available across all projects)
npx skills add Melvynx/api2cli -g

# Non-interactive (CI/CD friendly)
npx skills add Melvynx/api2cli -g -a claude-code -y

# Direct path to skill
npx skills add https://github.com/Melvynx/api2cli/tree/dev/skills/api2cli`}</code>
      </pre>

      <h2>2. Ask Your Agent</h2>
      <p>
        Just tell your agent what you need in plain English:
      </p>

      <pre>
        <code>{`> Use api2cli to create CLI for typefully api

⏺ I'll create a CLI for the Typefully API. Let me start by discovering the API.
  → Finding API docs...
  → Base URL: https://api.typefully.com
  → Auth: Bearer token
  → Generating resources: drafts, notifications, accounts
  → Building CLI...
  → Linking to PATH...

✅ typefully-cli is ready to use!`}</code>
      </pre>

      <p>More examples:</p>

      <div className="space-y-3">
        <div className="rounded-xl border border-border bg-card/60 px-4 py-3">
          <p className="!mb-0 font-mono text-sm">
            Use api2cli to create CLI for stripe api
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card/60 px-4 py-3">
          <p className="!mb-0 font-mono text-sm">
            Use api2cli to create CLI for notion api
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card/60 px-4 py-3">
          <p className="!mb-0 font-mono text-sm">
            Use api2cli to create CLI for linear api
          </p>
        </div>
      </div>

      <p className="mt-4">Your agent automatically:</p>
      <ol>
        <li>Discovers the API documentation</li>
        <li>Identifies endpoints, auth type, and base URL</li>
        <li>Generates a standardized CLI with all resources</li>
        <li>Builds it and adds it to your PATH</li>
        <li>Tests the connection</li>
      </ol>

      <h2>3. Use Your CLI</h2>
      <p>
        Once the agent finishes, your CLI is ready:
      </p>
      <pre>
        <code>{`# Set your API token
typefully-cli auth set "typ_xxx"

# Start using it
typefully-cli drafts list
typefully-cli drafts create --text "Hello world"

# Works with any agent via --json
typefully-cli drafts list --json`}</code>
      </pre>

      <h2>Or Install an Existing CLI</h2>
      <p>
        Before creating a new CLI, check the{" "}
        <a href="/">registry</a>. Someone may have already built it:
      </p>
      <pre>
        <code>{`# Install from GitHub repo
npx api2cli install owner/repo`}</code>
      </pre>
      <p>
        This clones the repo, installs dependencies, builds, links to your
        PATH, and symlinks the AgentSkill to your coding agents. One command,
        fully ready.
      </p>

      <h2>Manage Your Skills</h2>
      <pre>
        <code>{`# List installed skills (Sundial)
npx sundial-hub installed

# List installed skills (Skills CLI)
npx skills list

# Remove a skill
npx skills remove api2cli`}</code>
      </pre>

      <div className="callout">
        <div className="callout-title">Want to go deeper?</div>
        <p className="!mb-0">
          Learn about the{" "}
          <a href="/docs/resources">resource pattern</a>,{" "}
          <a href="/docs/commands">all CLI commands</a>, or how to{" "}
          <a href="/docs/marketplace">publish to the marketplace</a>.
        </p>
      </div>
    </div>
  );
}
