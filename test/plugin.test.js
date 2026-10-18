import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pluginPlan, verifyPlan } from "../scripts/build-plugin.mjs";

const root = new URL("../", import.meta.url);

test("plugin ships the complete canonical rules and materials without drift", async () => {
  const plan = await pluginPlan(root);
  const instructions = (await readFile(new URL("PROJECT_INSTRUCTIONS.md", root), "utf8")).replace(/\r\n/g, "\n");
  const materials = (await readFile(new URL("STORY_MATERIALS.txt", root), "utf8")).replace(/\r\n/g, "\n");
  assert.ok(plan.get("skills/moon-play-host/SKILL.md").endsWith(instructions));
  assert.equal(plan.get("skills/moon-play-host/references/STORY_MATERIALS.txt"), materials);
  assert.deepEqual([...plan.keys()].filter(path => path.endsWith("SKILL.md")).sort(), [
    "moon-bedtime", "moon-parent-review", "moon-play-host", "moon-story-together"
  ].map(name => `skills/${name}/SKILL.md`).sort());
});

test("plugin requires no local executor, hooks, private app binding or new service", async () => {
  const plan = await pluginPlan(root);
  const manifest = JSON.parse(plan.get("plugin.json"));
  assert.equal(manifest.$schema, "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json");
  assert.ok(manifest.extensions["com.openai"].interface.shortDescription.length <= 30);
  for (const key of ["skills", "mcpServers", "apps", "interface"]) assert.equal(manifest[key], undefined);
  const mcp = JSON.parse(plan.get("mcp.json"));
  assert.deepEqual(Object.keys(mcp.mcpServers), ["moon-story-materials"]);
  assert.equal(mcp.mcpServers["moon-story-materials"].url, "https://moon-robot-materials.ga815647.workers.dev/mcp");
  assert.equal(mcp.mcpServers["moon-story-materials"].extensions["com.openai"].auth.type, "none");
  assert.ok([...plan.keys()].every(path => !/hooks|node_modules|\.app\.json|\.env|\.local|private/.test(path)));
});

test("validation rejects missing referenced files, path escapes and malformed skill metadata", async () => {
  const original = await pluginPlan(root);
  const missing = new Map(original);
  missing.delete("assets/moon.svg");
  assert.throws(() => verifyPlan(missing), /asset/i);
  const escaping = new Map(original);
  escaping.set("../leak.txt", "unexpected");
  assert.throws(() => verifyPlan(escaping), /path/i);
  const malformed = new Map(original);
  malformed.set("skills/moon-bedtime/SKILL.md", "---\nname: []\ndescription: null\n---\nBody");
  assert.throws(() => verifyPlan(malformed), /metadata/i);
});

test("reusable skills retain child boundaries and never require tool use for silence", async () => {
  const plan = await pluginPlan(root);
  for (const name of ["moon-story-together", "moon-bedtime", "moon-parent-review"]) {
    const skill = plan.get(`skills/${name}/SKILL.md`);
    assert.match(skill, /停止|說停/);
    assert.match(skill, /moon-play-host\/SKILL\.md/);
  }
  const bootstrap = await readFile(new URL("PROJECT_PLUGIN_INSTRUCTIONS.md", root), "utf8");
  assert.match(bootstrap, /無法|讀不到|不可用/);
  assert.match(bootstrap, /不要講話/);
  assert.match(bootstrap, /假裝/);
});
