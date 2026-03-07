export default function AgentIntegration() {
  return (
    <div>
      <h1>Agent Integration</h1>
      <p>
        api2cli CLIs are designed to work with AI agents out of the box. Any
        agent that supports{" "}
        <a href="https://agentskills.io">AgentSkills</a> can discover, create,
        and use CLIs automatically.
      </p>

      <h2>How It Works</h2>
      <p>
        The repo includes a <code>SKILL.md</code> file following the AgentSkills
        open standard. When an agent reads this skill, it learns:
      </p>
      <ul>
        <li>How to discover APIs and gather endpoint info</li>
        <li>
          How to run <code>api2cli create</code> with the right flags
        </li>
        <li>The resource pattern for implementing endpoints</li>
        <li>How to build, link, and test the CLI</li>
      </ul>

      <h2>Install the Skill</h2>

      <h3>Claude Code</h3>
      <pre>
        <code>{`cp -r skills/api2cli ~/.claude/skills/`}</code>
      </pre>

      <h3>OpenClaw</h3>
      <pre>
        <code>{`cp -r skills/api2cli ~/.openclaw/workspace/skills/`}</code>
      </pre>

      <h3>Using npx</h3>
      <pre>
        <code>{`npx skills-cli add api2cli`}</code>
      </pre>

      <h2>Usage</h2>
      <p>
        Once installed, just tell your agent in natural language:
      </p>
      <blockquote>
        &ldquo;Create a CLI for the Typefully API&rdquo;
      </blockquote>
      <p>
        The agent will automatically:
      </p>
      <ol>
        <li>Search for the API docs</li>
        <li>Identify base URL, auth type, and endpoints</li>
        <li>
          Run <code>api2cli create</code>
        </li>
        <li>Implement resources for each endpoint</li>
        <li>Build, link, and test the CLI</li>
      </ol>

      <h2>Supported Agents</h2>
      <p>Works with any agent/IDE that supports the AgentSkills standard:</p>
      <ul>
        <li>Claude Code</li>
        <li>Cursor</li>
        <li>Gemini CLI</li>
        <li>GitHub Copilot</li>
        <li>VS Code</li>
        <li>OpenClaw</li>
        <li>Goose / OpenHands / Junie</li>
        <li>Amp / OpenCode / Letta</li>
        <li>
          <a href="https://agentskills.io">
            Full list on agentskills.io
          </a>
        </li>
      </ul>

      <h2>Why CLI for Agents?</h2>
      <p>
        CLIs are the most universal tool interface. Every AI agent can run shell
        commands, but not every agent supports MCP servers, function calling, or
        custom plugins. A standardized CLI means:
      </p>
      <ul>
        <li>
          <strong>Zero integration work</strong>: agents just run commands
        </li>
        <li>
          <strong>One pattern</strong>: learn one CLI, use them all
        </li>
        <li>
          <strong>JSON output</strong>: structured data with{" "}
          <code>--json</code>
        </li>
        <li>
          <strong>Deep help</strong>: agents can discover commands via{" "}
          <code>--help</code>
        </li>
      </ul>
    </div>
  );
}
