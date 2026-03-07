export default function Marketplace() {
  return (
    <div>
      <h1>Marketplace</h1>
      <p>
        The api2cli marketplace lets the community share CLI wrappers. Instead
        of building a CLI from scratch, search the marketplace first.
      </p>

      <h2>Install a CLI</h2>
      <p>
        If someone already built a CLI for the API you need, install it
        instantly:
      </p>
      <pre>
        <code>npx api2cli install typefully</code>
      </pre>
      <p>
        This downloads the CLI, builds it, and links it to your PATH. Ready to
        use immediately.
      </p>

      <h2>Search</h2>
      <p>
        Browse the <a href="/">marketplace homepage</a> or search by describing
        your need in natural language:
      </p>
      <pre>
        <code>npx api2cli search &quot;schedule social media posts&quot;</code>
      </pre>
      <p>
        The search returns relevant CLIs with a match percentage. If your use
        case needs multiple CLIs, it will show all of them together with a
        combined install command.
      </p>

      <h2>Publish Your CLI</h2>
      <p>Share your CLI with the community:</p>
      <pre>
        <code>{`# From your CLI directory
api2cli publish <app>`}</code>
      </pre>
      <p>Your CLI will appear on the marketplace with:</p>
      <ul>
        <li>Name, description, and category</li>
        <li>Install command (one-click copy)</li>
        <li>GitHub repo link</li>
        <li>Download count</li>
        <li>Community upvotes</li>
      </ul>

      <h2>Publishing API</h2>
      <p>
        The marketplace exposes a REST API for programmatic publishing:
      </p>
      <pre>
        <code>{`POST /api/skills

{
  "name": "typefully",
  "displayName": "Typefully",
  "description": "Schedule and publish social media posts",
  "category": "social",
  "apiBaseUrl": "https://api.typefully.com",
  "authType": "bearer",
  "githubRepo": "your-username/typefully-cli",
  "version": "1.0.0"
}`}</code>
      </pre>

      <h2>Categories</h2>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Examples</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["Social Media", "Typefully, Buffer, Hootsuite"],
            ["Developer Tools", "GitHub, Vercel, Netlify"],
            ["Finance", "Stripe, Mercury, Wise"],
            ["Marketing", "Mailchimp, ConvertKit, Lumail"],
            ["Productivity", "Notion, Linear, Todoist"],
            ["Communication", "Slack, Discord, Intercom"],
            ["Analytics", "PostHog, Mixpanel, Amplitude"],
            ["AI & ML", "OpenAI, Anthropic, Replicate"],
            ["E-Commerce", "Shopify, Lemonsqueezy, Gumroad"],
          ].map(([cat, examples]) => (
            <tr key={cat}>
              <td>
                <strong>{cat}</strong>
              </td>
              <td>{examples}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
