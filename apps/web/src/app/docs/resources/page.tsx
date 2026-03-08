import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Resources - The CRUD Pattern for API Endpoints",
  description:
    "Learn the resource pattern for mapping REST API endpoints to standardized CLI commands. Each resource is a TypeScript file with list, get, create, update, and delete actions.",
  alternates: { canonical: "https://api2cli.dev/docs/resources" },
  openGraph: {
    title: "api2cli Resource Pattern",
    description:
      "Map REST API endpoints to standardized CLI commands with the resource pattern.",
    url: "https://api2cli.dev/docs/resources",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://api2cli.dev" },
    { "@type": "ListItem", position: 2, name: "Docs", item: "https://api2cli.dev/docs" },
    { "@type": "ListItem", position: 3, name: "Add Resources" },
  ],
};

export default function Resources() {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1>Add Resources</h1>
      <p>
        Resources map to API endpoints. Each resource is a single TypeScript
        file with standardized CRUD commands.
      </p>

      <h2>Resource Pattern</h2>
      <p>
        Every resource follows the same structure. Create a file at{" "}
        <code>{`~/.cli/<app>-cli/src/resources/<resource>.ts`}</code>:
      </p>
      <pre>
        <code>{`import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

export const draftsResource = new Command("drafts")
  .description("Manage drafts");

// LIST
draftsResource
  .command("list")
  .description("List all drafts")
  .option("--limit <n>", "Max results", "20")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const data = await client.get("/drafts", {
        limit: opts.limit,
      });
      output(data, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// GET
draftsResource
  .command("get <id>")
  .description("Get a draft by ID")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      const data = await client.get(\`/drafts/\${id}\`);
      output(data, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// CREATE
draftsResource
  .command("create")
  .description("Create a new draft")
  .requiredOption("--text <text>", "Draft content")
  .option("--platform <platform>", "Target platform")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    try {
      const data = await client.post("/drafts", {
        text: opts.text,
        platform: opts.platform,
      });
      output(data, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// DELETE
draftsResource
  .command("delete <id>")
  .description("Delete a draft")
  .option("--json", "Output as JSON")
  .action(async (id, opts) => {
    try {
      await client.delete(\`/drafts/\${id}\`);
      output({ deleted: id }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });`}</code>
      </pre>

      <h2>Register the Resource</h2>
      <p>
        Add your resource to <code>src/index.ts</code>:
      </p>
      <pre>
        <code>{`import { draftsResource } from "./resources/drafts.js";
program.addCommand(draftsResource);`}</code>
      </pre>

      <h2>Conventions</h2>
      <ul>
        <li>
          <strong>One file per resource</strong> (drafts.ts, links.ts,
          users.ts)
        </li>
        <li>
          <strong>Standard CRUD commands</strong>: list, get, create, update,
          delete
        </li>
        <li>
          Every command must have a <code>--json</code> flag
        </li>
        <li>
          Use <code>client.get/post/patch/delete()</code> for HTTP requests
        </li>
        <li>
          Use <code>output()</code> for formatted responses
        </li>
        <li>
          Use <code>handleError()</code> for error handling
        </li>
        <li>
          Add <code>.description()</code> and <code>.example()</code> to every
          command
        </li>
      </ul>

      <h2>Output Format</h2>
      <p>
        The <code>output()</code> function handles formatting automatically:
      </p>
      <table>
        <thead>
          <tr>
            <th>Flag</th>
            <th>Output</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>(none)</td>
            <td>Pretty table for humans</td>
          </tr>
          <tr>
            <td>
              <code>--json</code>
            </td>
            <td>
              JSON envelope: <code>{`{ok, data, meta}`}</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>--format csv</code>
            </td>
            <td>CSV for spreadsheets</td>
          </tr>
          <tr>
            <td>
              <code>--format yaml</code>
            </td>
            <td>YAML for configs</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
