# Using api2cli with OpenClaw

api2cli-generated CLIs work natively with OpenClaw. Skills get symlinked into `~/.openclaw/workspace/skills/` so the OpenClaw agent can discover and use them.

## One-Prompt Setup (copy-paste into OpenClaw)

Copy the entire block below and paste it as a message to your OpenClaw agent:

```
Set up api2cli for me:

1. Install bun if missing: bun --version || curl -fsSL https://bun.sh/install | bash
2. Link the skill to OpenClaw: api2cli link --all --openclaw
3. Verify: api2cli --help

Once installed, I can ask you to:
- Create a CLI for any API: "Use api2cli to create CLI for <api-name>"
- List local CLIs: "api2cli list"
```

## Link Commands Reference

```bash
api2cli link <app> --openclaw                    # single CLI
api2cli link --all --openclaw                    # all installed CLIs
api2cli link <app> --skills-path /custom/path    # custom skills directory
```

## How the Agent Uses It

Once linked, the OpenClaw agent discovers CLIs through `--help` navigation:

```
<app>-cli --help              → list resources (~90 tokens)
<app>-cli <resource> --help   → list actions (~50 tokens)
<app>-cli <resource> <action> --help → exact flags (~80 tokens)
```

No SKILL.md dump needed. The agent explores on demand.
