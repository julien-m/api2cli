// Compiles api2cli-managed skill instruction fragments into generated AgentSkills.
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ensureAgentSyncSkillSource } from "./agent-sync.js";

interface CompileSkillInstructionsResult {
	compiled: boolean;
	fragmentCount: number;
}

const CUSTOM_INSTRUCTIONS_START = "<!-- api2cli:custom-instructions:start -->";
const CUSTOM_INSTRUCTIONS_END = "<!-- api2cli:custom-instructions:end -->";

/**
 * Compile top-level .api2cli/skill/*.md fragments into the generated SKILL.md.
 *
 * @param cliDir Generated CLI root directory.
 * @param app api2cli app slug used to resolve the generated skill path.
 * @returns Whether fragments were compiled and how many non-empty fragments were found.
 * @throws Filesystem errors when the source or generated skill files cannot be read or written.
 */
export function compileSkillInstructions(cliDir: string, app: string): CompileSkillInstructionsResult {
	const skillDir = ensureAgentSyncSkillSource(cliDir, app);
	if (!skillDir) return { compiled: false, fragmentCount: 0 };

	const skillPath = join(skillDir, "SKILL.md");
	const sourceDir = join(cliDir, ".api2cli", "skill");
	const originalSkill = readFileSync(skillPath, "utf-8");
	if (!existsSync(sourceDir)) return { compiled: false, fragmentCount: 0 };

	const fragments = readInstructionFragments(sourceDir);
	const nextSkill =
		fragments.length > 0
			? upsertManagedBlock(originalSkill, formatManagedBlock(fragments))
			: removeManagedBlock(originalSkill);

	if (nextSkill !== originalSkill) {
		writeFileSync(skillPath, nextSkill);
	}

	return { compiled: fragments.length > 0, fragmentCount: fragments.length };
}

function readInstructionFragments(sourceDir: string): string[] {
	return readdirSync(sourceDir)
		.filter((entry) => entry.endsWith(".md"))
		.filter((entry) => statSync(join(sourceDir, entry)).isFile())
		.sort(compareInstructionFragmentNames)
		.map((entry) => readFileSync(join(sourceDir, entry), "utf-8").trim())
		.filter((content) => content.length > 0);
}

function compareInstructionFragmentNames(left: string, right: string): number {
	if (left === "instruction.md" && right !== "instruction.md") return -1;
	if (right === "instruction.md" && left !== "instruction.md") return 1;
	return left.localeCompare(right);
}

function formatManagedBlock(fragments: ReadonlyArray<string>): string {
	return `${CUSTOM_INSTRUCTIONS_START}
## Custom Instructions

${fragments.join("\n\n")}
${CUSTOM_INSTRUCTIONS_END}`;
}

function upsertManagedBlock(skill: string, block: string): string {
	const managedBlockPattern = getManagedBlockPattern();
	if (managedBlockPattern.test(skill)) {
		return skill.replace(managedBlockPattern, block);
	}
	return `${skill.trimEnd()}\n\n${block}\n`;
}

function removeManagedBlock(skill: string): string {
	// Collapse excess blank lines left after removing the managed instruction block.
	return `${skill
		.replace(getManagedBlockPattern(), "\n\n")
		.replace(/\n{3,}/g, "\n\n")
		.trimEnd()}\n`;
}

function getManagedBlockPattern(): RegExp {
	return new RegExp(
		`\\n*${escapeRegExp(CUSTOM_INSTRUCTIONS_START)}[\\s\\S]*?${escapeRegExp(CUSTOM_INSTRUCTIONS_END)}\\n*`,
		"g",
	);
}

function escapeRegExp(value: string): string {
	// Escape regex metacharacters so marker strings are matched literally.
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
