export default function GettingStarted() {
  return (
    <div>
      <h1>Getting Started</h1>
      <p>
        Get api2cli installed and create your first CLI wrapper in under 2
        minutes.
      </p>

      <h2>Prerequisites</h2>
      <ul>
        <li>
          <a href="https://bun.sh">Bun</a> runtime (v1.0+)
        </li>
        <li>Node.js 18+ (fallback)</li>
      </ul>

      <h2>Install</h2>
      <pre>
        <code>bun install -g api2cli</code>
      </pre>
      <p>
        Or use <code>npx</code> without installing:
      </p>
      <pre>
        <code>npx api2cli create my-api</code>
      </pre>

      <h2>Create Your First CLI</h2>
      <p>
        Let&apos;s wrap the Typefully API as an example. One command does
        everything:
      </p>
      <pre>
        <code>{`api2cli create typefully \\
  --base-url https://api.typefully.com \\
  --auth-type bearer`}</code>
      </pre>
      <p>
        This creates a full CLI scaffold at{" "}
        <code>~/.cli/typefully-cli/</code> with:
      </p>
      <ul>
        <li>HTTP client with automatic retry and backoff</li>
        <li>
          Auth module (tokens stored securely in{" "}
          <code>~/.config/tokens/</code>)
        </li>
        <li>Multi-format output (text, JSON, CSV, YAML)</li>
        <li>Example resource file to copy</li>
      </ul>

      <h2>Build and Link</h2>
      <pre>
        <code>{`# Build the CLI (~5KB bundle)
api2cli bundle typefully

# Add to your PATH
api2cli link typefully`}</code>
      </pre>

      <h2>Use It</h2>
      <pre>
        <code>{`# Set your API token
typefully-cli auth set "typ_xxx"

# Test the connection
typefully-cli auth test

# Start using it
typefully-cli drafts list --json`}</code>
      </pre>

      <div className="callout">
        <div className="callout-title">Next step</div>
        <p className="!mb-0">
          Now that your CLI is running, learn how to{" "}
          <a href="/docs/resources">add resources</a> for each API endpoint.
        </p>
      </div>
    </div>
  );
}
