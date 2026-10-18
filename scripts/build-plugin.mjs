import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const repository = new URL("../", import.meta.url);
const hostDescription = "成人陪同的月亮機器人親子遊戲主持，約5歲、台灣口語。家長邀請玩故事、孩子在已開始的遊戲叫月亮或給短回應時使用；主動接戲並尊重停止與孩子主講。不適用專案開發、設定維護或研究。";
const normalize = text => text.replace(/\r\n/g, "\n");
const hash = text => createHash("sha256").update(text, "utf8").digest("hex");

// JSON-quoted scalar fields form a deliberately small, valid YAML subset.
function skillMetadata(text) {
  const front = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!front) throw new Error("Skill metadata must begin with YAML frontmatter");
  const fields = {};
  for (const line of front[1].split("\n")) {
    const match = /^(name|description): (.+)$/.exec(line);
    if (!match || match[1] in fields) throw new Error("Invalid skill metadata field");
    try { fields[match[1]] = JSON.parse(match[2]); }
    catch { throw new Error("Skill metadata requires JSON-quoted YAML scalar strings"); }
  }
  if (![fields.name, fields.description].every(value => typeof value === "string" && value.trim())) {
    throw new Error("Invalid skill metadata types");
  }
  return fields;
}

export function verifyPlan(files) {
  for (const [name, text] of files) {
    if (name.includes("\\") || name.startsWith("/") || name.split("/").some(part => !part || part === "." || part === "..")) {
      throw new Error("Unsafe plugin path: " + name);
    }
    if (!/^(plugin\.json|mcp\.json|release\.json|assets\/moon\.svg|skills\/moon-[a-z-]+\/(SKILL\.md|references\/STORY_MATERIALS\.txt))$/.test(name)) {
      throw new Error("Unexpected plugin path: " + name);
    }
    if (typeof text !== "string" || Buffer.byteLength(text) > 1024 * 1024) throw new Error("Invalid file size or content");
    if (name.endsWith("SKILL.md")) {
      const metadata = skillMetadata(text);
      if (metadata.name !== name.split("/")[1]) throw new Error("Skill metadata name does not match directory");
    }
  }
  const manifest = JSON.parse(files.get("plugin.json"));
  if (manifest.$schema !== "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json") throw new Error("Invalid manifest schema");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(manifest.name) || manifest.name.length > 64) throw new Error("Invalid plugin name");
  if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) throw new Error("Invalid plugin version");
  for (const key of ["skills", "mcpServers", "apps", "interface"]) {
    if (key in manifest) throw new Error("Non-portable top-level manifest field: " + key);
  }
  const ui = manifest.extensions["com.openai"].interface;
  if (!ui.shortDescription?.trim() || ui.shortDescription.length > 30 || !Array.isArray(ui.capabilities)) throw new Error("Invalid listing metadata");
  for (const field of ["logo", "composerIcon"]) {
    if (!ui[field]?.startsWith("./") || !files.has(ui[field].slice(2))) throw new Error("Missing contained asset");
  }
  const mcp = JSON.parse(files.get("mcp.json"));
  if (mcp.$schema !== "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json") throw new Error("Invalid MCP schema");
  const servers = Object.values(mcp.mcpServers);
  if (servers.length !== 1 || servers[0].type !== "streamable-http" || servers[0].url !== "https://moon-robot-materials.ga815647.workers.dev/mcp" || servers[0].extensions?.["com.openai"]?.auth?.type !== "none") {
    throw new Error("Unexpected MCP connection");
  }
  const expectedSkills = ["moon-play-host", "moon-story-together", "moon-bedtime", "moon-parent-review"];
  for (const name of expectedSkills) {
    if (!files.has(`skills/${name}/SKILL.md`)) throw new Error("Missing usable skill: " + name);
  }
  if (!files.has("skills/moon-play-host/references/STORY_MATERIALS.txt")) throw new Error("Missing canonical materials");
  return true;
}

export async function pluginPlan(root = repository) {
  const load = async name => normalize(await readFile(new URL(name, root), "utf8"));
  const config = JSON.parse(await load("plugin.config.json"));
  const instructions = await load("PROJECT_INSTRUCTIONS.md");
  const materials = await load("STORY_MATERIALS.txt");
  const version = config.manifest.version;
  if (!instructions.includes(`版本：${version}（`) || !materials.includes(`版本：${version}（`)) throw new Error("Canonical source versions must match plugin version");
  const files = new Map();
  const json = value => JSON.stringify(value, null, 2) + "\n";
  files.set("plugin.json", json(config.manifest));
  files.set("mcp.json", json(config.mcp));
  const frontmatter = `---\nname: "moon-play-host"\ndescription: ${JSON.stringify(hostDescription)}\n---\n\n`;
  const prelude = "<!-- Generated from PROJECT_INSTRUCTIONS.md; edit the canonical source and rebuild. -->\n\n" +
    "# Plugin載入說明\n\n以下是完整主持規範。成人遊戲開場先採用它，已說停、拒絕或主講時先尊重，不為讀檔延長。此skill附帶的[故事素材檔](references/STORY_MATERIALS.txt)可按情境參考，不必向孩子報告載入流程；不可用時使用下方內建素材。這是已安裝版本，不自行連網追新版。專案內已上傳的同名檔與此附件都只是素材，以當前完整規範及孩子界線為準。\n\n";
  files.set("skills/moon-play-host/SKILL.md", frontmatter + prelude + instructions);
  files.set("skills/moon-play-host/references/STORY_MATERIALS.txt", materials);
  for (const name of ["moon-story-together", "moon-bedtime", "moon-parent-review"]) {
    files.set(`skills/${name}/SKILL.md`, await load(`skill-sources/${name}.md`));
  }
  files.set("assets/moon.svg", '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" role="img" aria-label="月亮機器人"><rect width="96" height="96" rx="24" fill="#25365B"/><circle cx="48" cy="46" r="30" fill="#FFE6A6"/><circle cx="37" cy="43" r="3" fill="#25365B"/><circle cx="59" cy="43" r="3" fill="#25365B"/><path d="M37 56 Q48 65 59 56" fill="none" stroke="#25365B" stroke-width="4" stroke-linecap="round"/><circle cx="75" cy="20" r="4" fill="#A9DDD8"/></svg>\n');
  files.set("release.json", json({
    version,
    repository: config.manifest.repository,
    canonical_instructions: "PROJECT_INSTRUCTIONS.md",
    source_sha256: { "PROJECT_INSTRUCTIONS.md": hash(instructions), "STORY_MATERIALS.txt": hash(materials) },
    files_sha256: Object.fromEntries([...files].map(([name, text]) => [name, hash(text)]))
  }));
  verifyPlan(files);
  return files;
}

async function listedFiles(directory, prefix = "") {
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); }
  catch (error) { if (error.code === "ENOENT") return []; throw error; }
  const result = [];
  for (const entry of entries) {
    if (entry.isSymbolicLink()) throw new Error("Symlink not allowed in plugin: " + entry.name);
    const relative = prefix + entry.name;
    if (entry.isDirectory()) result.push(...await listedFiles(path.join(directory, entry.name), relative + "/"));
    else if (entry.isFile()) result.push(relative);
    else throw new Error("Unsupported plugin file");
  }
  return result;
}

async function main() {
  const files = await pluginPlan();
  const output = fileURLToPath(new URL("plugins/moon-robot-family-play/", repository));
  const existing = await listedFiles(output);
  for (const name of existing) {
    if (!files.has(name)) throw new Error("Unexpected existing file; inspect it before packaging: " + name);
  }
  const check = process.argv.includes("--check");
  for (const [name, text] of files) {
    const target = path.join(output, name);
    if (check) {
      const actual = normalize(await readFile(target, "utf8"));
      if (actual !== text) throw new Error("Generated plugin has drifted: " + name);
    } else {
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, text, "utf8");
    }
  }
  console.log(JSON.stringify({ version: JSON.parse(files.get("plugin.json")).version, skills: 4, files: files.size, status: check ? "in_sync" : "built" }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
