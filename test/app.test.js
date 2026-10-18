import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createApp } from "../src/app.ts";

const materials = await readFile(new URL("../STORY_MATERIALS.txt",import.meta.url),"utf8");
const app = createApp(materials);
const base = "https://moon-robot-materials.ga815647.workers.dev";
async function rpc(method,params={},headers={}) {
  const response = await app(new Request(base+"/mcp",{
    method:"POST",
    headers:{"content-type":"application/json",accept:"application/json, text/event-stream","mcp-protocol-version":"2025-11-25",...headers},
    body:JSON.stringify({jsonrpc:"2.0",id:1,method,params})
  }));
  const text = await response.text();
  const data = response.headers.get("content-type")?.includes("text/event-stream")
    ? JSON.parse(text.split("\n").find(line=>line.startsWith("data: ")).slice(6))
    : JSON.parse(text);
  return {response,data};
}
test("serves a health check from the bundled canonical materials",async()=>{
  const response=await app(new Request(base+"/health"));
  assert.equal(response.status,200);
  const data=await response.json();
  assert.ok(data.materials>=88);
  assert.equal(data.version,"1.2.0");
});
test("rejects foreign browser origins and unexpected hostnames",async()=>{
  const origin=await app(new Request(base+"/mcp",{method:"POST",headers:{origin:"https://evil.example"}}));
  const host=await app(new Request("https://evil.example/mcp",{method:"POST"}));
  assert.equal(origin.status,403);
  assert.equal(host.status,403);
});
test("advertises only the intended read-only public material tool",async()=>{
  const {data}=await rpc("tools/list");
  assert.equal(data.result.tools.length,1);
  assert.equal(data.result.tools[0].name,"draw_story_materials");
  assert.equal(data.result.tools[0].annotations.readOnlyHint,true);
  assert.equal(data.result.tools[0].annotations.openWorldHint,false);
});
test("performs the legacy handshake without advertising stored sessions or extra capabilities",async()=>{
  const {data}=await rpc("initialize",{protocolVersion:"2025-11-25",capabilities:{},clientInfo:{name:"test",version:"1"}});
  assert.equal(data.result.protocolVersion,"2025-11-25");
  assert.ok(data.result.capabilities.tools);
  assert.equal(data.result.capabilities.resources,undefined);
  assert.equal(data.result.capabilities.prompts,undefined);
});
test("returns real selected cards and respects closing at the tool boundary",async()=>{
  const {data}=await rpc("tools/call",{name:"draw_story_materials",arguments:{stage:"resolve",energy:"calm",count:2}});
  assert.equal(data.result.isError,undefined);
  const draw=JSON.parse(data.result.content[0].text);
  assert.equal(draw.selected.length,2);
  assert.ok(draw.selected.every(c=>["T","S","R","B"].includes(c.kind)&&c.energy==="calm"));
});
test("rejects raw child text instead of forwarding or recording it",async()=>{
  const {data}=await rpc("tools/call",{name:"draw_story_materials",arguments:{utterance:"private text"}});
  assert.ok(data.error || data.result?.isError);
});
test("returns protocol errors for unknown methods and malformed JSON",async()=>{
  const {data}=await rpc("nonexistent");
  assert.equal(data.error.code,-32601);
  const response=await app(new Request(base+"/mcp",{method:"POST",headers:{"content-type":"application/json",accept:"application/json, text/event-stream"},body:"{"}));
  assert.ok(response.status>=400);
});
test("does not expose unrelated routes or accept oversized request bodies",async()=>{
  assert.equal((await app(new Request(base+"/private"))).status,404);
  const response=await app(new Request(base+"/mcp",{method:"POST",headers:{"content-type":"application/json",accept:"application/json, text/event-stream"},body:" ".repeat(17000)}));
  assert.equal(response.status,413);
});
test("does not open legacy session streams or accept invalid media types",async()=>{
  assert.equal((await app(new Request(base+"/mcp",{method:"GET"}))).status,405);
  const response=await app(new Request(base+"/mcp",{method:"POST",headers:{"content-type":"text/plain"},body:"{}"}));
  assert.equal(response.status,415);
});
test("serves modern per-request metadata without requiring a legacy session",async()=>{
  const {data}=await rpc("tools/list",{_meta:{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientCapabilities":{}}},{"mcp-protocol-version":"2026-07-28","mcp-method":"tools/list"});
  assert.ok(data.result,JSON.stringify(data));
  assert.equal(data.result.tools[0].name,"draw_story_materials");
});
test("rejects a conflicting modern revision instead of silently treating it as a legacy call",async()=>{
  const {data}=await rpc("tools/list",{_meta:{"io.modelcontextprotocol/protocolVersion":"2099-01-01","io.modelcontextprotocol/clientCapabilities":{}}},{"mcp-protocol-version":"2099-01-01"});
  assert.ok(data.error);
});
test("allows the modern protocol routing headers in trusted browser preflight",async()=>{
  const response=await app(new Request(base+"/mcp",{method:"OPTIONS",headers:{origin:"https://chatgpt.com"}}));
  assert.equal(response.status,204);
  assert.match(response.headers.get("access-control-allow-headers"),/MCP-Method/i);
});
