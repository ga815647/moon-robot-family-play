import assert from "node:assert/strict";

const base=(process.argv[2] ?? "http://127.0.0.1:8787").replace(/\/$/,"");
async function rpc(method,params={},modern=false) {
  const headers={"content-type":"application/json",accept:"application/json, text/event-stream","mcp-protocol-version":modern?"2026-07-28":"2025-11-25"};
  if(modern) {
    headers["mcp-method"]=method;
    if(params.name)headers["mcp-name"]=params.name;
    params={...params,_meta:{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientCapabilities":{}}};
  }
  const response=await fetch(base+"/mcp",{method:"POST",headers,body:JSON.stringify({jsonrpc:"2.0",id:1,method,params}),signal:AbortSignal.timeout(10000)});
  const text=await response.text();
  const events=[...text.matchAll(/^data: (.+)$/gm)];
  return {response,data:JSON.parse(events.length?events.at(-1)[1]:text)};
}
const healthResponse=await fetch(base+"/health",{signal:AbortSignal.timeout(10000)});
assert.equal(healthResponse.status,200);
const health=await healthResponse.json();
assert.equal(health.version,"1.2.0");
assert.equal(health.materials,148);
const init=await rpc("initialize",{protocolVersion:"2025-11-25",capabilities:{},clientInfo:{name:"moon-smoke",version:"1"}});
assert.equal(init.data.result.protocolVersion,"2025-11-25");
const list=await rpc("tools/list");
assert.equal(list.data.result.tools[0].name,"draw_story_materials");
const first=await rpc("tools/call",{name:"draw_story_materials",arguments:{stage:"continue",tags:["delivery"],count:3}});
assert.ok(first.data.result,JSON.stringify(first.data));
const draw=first.data.result.structuredContent;
assert.equal(draw.selected.length,3);
const second=await rpc("tools/call",{name:"draw_story_materials",arguments:{
  stage:"continue",tags:["delivery"],recent_ids:draw.selected.map(c=>c.id),recent_families:draw.selected.map(c=>c.family),count:3
}});
assert.ok(second.data.result.structuredContent.selected.every(c=>!draw.selected.some(old=>old.id===c.id||old.family===c.family)));
const closing=await rpc("tools/call",{name:"draw_story_materials",arguments:{stage:"resolve",energy:"calm",count:2}},true);
assert.ok(closing.data.result,JSON.stringify(closing.data));
assert.equal(closing.data.result.structuredContent.selected.length,2);
assert.ok(closing.data.result.structuredContent.selected.every(c=>c.energy==="calm"&&["T","S","R","B"].includes(c.kind)));
const pause=await rpc("tools/call",{name:"draw_story_materials",arguments:{interaction:"paused"}});
assert.deepEqual(pause.data.result.structuredContent.selected,[]);
const origin=await fetch(base+"/mcp",{method:"POST",headers:{origin:"https://evil.example"},signal:AbortSignal.timeout(10000)});
assert.equal(origin.status,403);
console.log(JSON.stringify({base,version:health.version,materials:health.materials,checks:8,status:"passed",sample:draw.selected.map(c=>({id:c.id,family:c.family}))},null,2));
