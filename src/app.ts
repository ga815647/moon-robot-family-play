import { McpServer, createMcpHandler } from "@modelcontextprotocol/server";
import { CfWorkerJsonSchemaValidator } from "@modelcontextprotocol/server/validators/cf-worker";
import { z } from "zod";
import { parseMaterials, drawMaterials, drawInputSchema } from "./sampler.ts";

const cardSchema = z.object({
  id:z.string(),kind:z.string(),tags:z.array(z.string()),family:z.string(),energy:z.enum(["calm","normal"]),text:z.string()
});
const outputSchema = z.object({
  version:z.string(),stage:z.string(),candidate_count:z.number().int(),
  selected:z.array(cardSchema),reason:z.enum(["ok","respect_interaction","no_eligible_materials"])
});

export function createApp(materialText:string) {
  const cards = parseMaterials(materialText);
  function createServer() {
    const server = new McpServer({name:"moon-robot-materials",version:"1.2.0"},{
      instructions:"Draw public, child-appropriate story ingredients. Keep existing characters and goals. Send only taxonomy tags and public card IDs, never raw child speech or private details. No draws while the child is speaking or wants quiet.",
      jsonSchemaValidator:new CfWorkerJsonSchemaValidator()
    });
    server.registerTool("draw_story_materials",{
      description:"Use when an adult has enabled this material tool and a story needs a new opening or fresh ingredient. Draw 2–3 complementary public cards from up to 10 candidates; pass recent IDs and joke families to avoid repetition. Do not use for every short utterance, child-led speech, refusal, real-life questions or silence. Existing roles and goals stay fixed on continuation.",
      inputSchema:drawInputSchema,
      outputSchema,
      annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:false,openWorldHint:false}
    },async args=>{
      const result=drawMaterials(cards,args);
      return {content:[{type:"text",text:JSON.stringify(result)}],structuredContent:result};
    });
    return server;
  }
  const handler=createMcpHandler(createServer,{legacy:"stateless",maxRequestBodySize:16384,keepAliveMs:0});
  return async function fetch(request:Request) {
    const url=new URL(request.url);
    const hosts=["moon-robot-materials.ga815647.workers.dev","localhost","127.0.0.1"];
    if (!hosts.includes(url.hostname)) return new Response("Forbidden",{status:403});
    const origin=request.headers.get("origin");
    if (origin && !["https://chatgpt.com","https://chat.openai.com",url.origin].includes(origin)) {
      return new Response("Forbidden",{status:403});
    }
    let response:Response;
    if (url.pathname==="/health" && request.method==="GET") {
      response=Response.json({name:"moon-robot-materials",version:"1.2.0",materials:cards.length,protocol:"2026-07-28",legacy:"2025-stateless"});
    } else if (url.pathname!=="/mcp") {
      response=new Response("Not found",{status:404});
    } else if (request.method==="OPTIONS") {
      response=new Response(null,{status:204});
    } else if (request.method!=="POST") {
      response=new Response("Method not allowed",{status:405,headers:{allow:"POST, OPTIONS"}});
    } else {
      response=await handler.fetch(request);
    }
    const headers=new Headers(response.headers);
    headers.set("cache-control","no-store");
    headers.set("x-content-type-options","nosniff");
    if (origin) {
      headers.set("access-control-allow-origin",origin);
      headers.set("vary","Origin");
      headers.set("access-control-allow-methods","POST, OPTIONS");
      headers.set("access-control-allow-headers","Content-Type, Accept, MCP-Protocol-Version, MCP-Method, MCP-Name");
    }
    return new Response(response.body,{status:response.status,headers});
  };
}
