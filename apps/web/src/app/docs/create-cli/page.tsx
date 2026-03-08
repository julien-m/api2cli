import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create a CLI - Wrap Any REST API in Minutes",
  description:
    "Step-by-step guide to wrapping any REST API into a standardized CLI with api2cli. Discover, scaffold, add resources, build, link, and publish your CLI wrapper.",
  alternates: { canonical: "https://api2cli.dev/docs/create-cli" },
  openGraph: {
    title: "Create a CLI with api2cli",
    description:
      "Wrap any REST API into a standardized, agent-ready CLI in minutes.",
    url: "https://api2cli.dev/docs/create-cli",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "HowTo",
      name: "How to Create a CLI with api2cli",
      description:
        "Step-by-step guide to wrapping any REST API into a standardized CLI.",
      totalTime: "PT10M",
      step: [
        {
          "@type": "HowToStep",
          name: "Discover the API",
          text: "Find the API documentation, identify the base URL, determine auth type, and list all resources.",
        },
        {
          "@type": "HowToStep",
          name: "Scaffold",
          text: "Run api2cli create <app-name> --base-url <url> --auth-type <type> to generate the CLI scaffolding.",
        },
        {
          "@type": "HowToStep",
          name: "Add Resources",
          text: "Create resource files for each API endpoint following the standardized CRUD pattern.",
        },
        {
          "@type": "HowToStep",
          name: "Build and Link",
          text: "Run api2cli bundle <app> then api2cli link <app> to build and add to your PATH.",
        },
        {
          "@type": "HowToStep",
          name: "Update the AgentSkill",
          text: "Edit skills/<app>-cli/SKILL.md with actual commands and flags.",
        },
        {
          "@type": "HowToStep",
          name: "Publish",
          text: "Publish via Sundial Hub or the api2cli.dev registry for others to install.",
        },
      ],
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://api2cli.dev" },
        { "@type": "ListItem", position: 2, name: "Docs", item: "https://api2cli.dev/docs" },
        { "@type": "ListItem", position: 3, name: "Create a CLI" },
      ],
    },
  ],
};

export default function CreateCli() {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1>Create a CLI</h1>
      <p>
        Step-by-step guide to wrapping any REST API into a standardized CLI.
      </p>

      <h2>Step 1: Discover the API</h2>
      <p>
        Before creating anything, gather information about the API you want to
        wrap:
      </p>
      <ol>
        <li>Find the API documentation URL or OpenAPI spec</li>
        <li>
          Identify the <strong>base URL</strong> (e.g.{" "}
          <code>https://api.example.com</code>)
        </li>
        <li>
          Determine the <strong>auth type</strong>: bearer token, API key,
          basic auth, or custom
        </li>
        <li>List all resources and their endpoints</li>
      </ol>

      <h2>Step 2: Scaffold</h2>
      <pre>
        <code>{`api2cli create <app-name> \\
  --base-url <api-base-url> \\
  --auth-type <bearer|api-key|basic|custom> \\
  --docs <docs-url>            # optional
  --openapi <openapi-url>      # optional`}</code>
      </pre>

      <h3>Options</h3>
      <table>
        <thead>
          <tr>
            <th>Flag</th>
            <th>Description</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>--base-url</code>
            </td>
            <td>API base URL</td>
            <td>
              <code>https://api.example.com</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>--auth-type</code>
            </td>
            <td>Authentication method</td>
            <td>
              <code>bearer</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>--auth-header</code>
            </td>
            <td>Custom auth header name</td>
            <td>
              <code>Authorization</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>--docs</code>
            </td>
            <td>API docs URL (for AI-driven generation)</td>
            <td>-</td>
          </tr>
          <tr>
            <td>
              <code>--openapi</code>
            </td>
            <td>OpenAPI/Swagger spec URL</td>
            <td>-</td>
          </tr>
          <tr>
            <td>
              <code>--force</code>
            </td>
            <td>Overwrite existing CLI</td>
            <td>
              <code>false</code>
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Step 3: Add Resources</h2>
      <p>
        Each API resource (drafts, users, links, etc.) gets its own file. See
        the <a href="/docs/resources">Resources guide</a> for the full pattern.
      </p>

      <h2>Step 4: Build and Link</h2>
      <pre>
        <code>{`# Build the CLI
api2cli bundle <app>

# Add to your PATH (auto-updates .zshrc/.bashrc)
api2cli link <app>

# Verify it works
<app>-cli --help`}</code>
      </pre>
      <p>
        <code>api2cli link</code> creates a symlink in{" "}
        <code>~/.local/bin/</code> and adds it to your shell profile
        automatically. No manual PATH setup needed.
      </p>

      <h2>Step 5: Update the AgentSkill</h2>
      <p>
        The scaffold includes <code>skills/&lt;app&gt;-cli/SKILL.md</code>{" "}
        with placeholder sections. After implementing resources, update it
        with the actual commands and flags.
      </p>
      <p>
        This file teaches AI agents how to use your CLI. When you publish the
        skill, anyone can install it:
      </p>
      <pre>
        <code>{`# Via Sundial Hub
npx sundial-hub add your-username/app-cli

# Via Skills CLI
npx skills add owner/repo`}</code>
      </pre>

      <h2>Step 6: Publish</h2>

      <h3>
        To <a href="https://www.sundialhub.com">Sundial Hub</a> (recommended)
      </h3>
      <p>
        Publish your skill so any agent (Claude Code, Cursor, Codex, etc.) can
        install it:
      </p>
      <pre>
        <code>{`# Login (one-time)
npx sundial-hub auth login

# Push the skill
npx sundial-hub push path/to/skills/<app>-cli --visibility public --categories coding`}</code>
      </pre>
      <p>
        Others can then install with:
      </p>
      <pre>
        <code>{`npx sundial-hub add your-username/<app>-cli`}</code>
      </pre>

      <h3>To the api2cli.dev registry</h3>
      <p>
        Push your repo to GitHub, then publish it to the{" "}
        <a href="/docs/marketplace">registry</a>:
      </p>
      <ul>
        <li>
          <strong>Web:</strong> Click{" "}
          <strong>&quot;+ Add my CLI&quot;</strong> on the{" "}
          <a href="/">registry page</a> and paste your GitHub URL
        </li>
        <li>
          <strong>API:</strong>{" "}
          <code>{`curl -X POST https://api2cli.dev/api/publish-cli -H "Content-Type: application/json" -d '{"githubUrl":"owner/repo"}'`}</code>
        </li>
      </ul>

      <div className="callout">
        <div className="callout-title">What install does</div>
        <p className="!mb-0">
          Clones the repo, installs deps, builds, links to PATH, and
          symlinks the skill to the user&apos;s agent (Claude Code, Cursor,
          etc.). One command, fully ready.
        </p>
      </div>
    </div>
  );
}
