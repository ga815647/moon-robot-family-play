import { z } from "zod";

export const drawInputSchema = z.strictObject({
  stage: z.enum(["opening","continue","resolve"]).default("continue"),
  energy: z.enum(["normal","calm"]).default("normal"),
  tags: z.array(z.enum(["delivery","food","water","home","travel","repair","sound","nature","social","bedtime"])).max(8).default([]),
  count: z.number().int().min(2).max(3).default(3),
  recent_ids: z.array(z.string().regex(/^[A-Z]\d{2}$/)).max(64).default([]),
  recent_families: z.array(z.string().regex(/^[a-z0-9-]{1,48}$/)).max(64).default([]),
  blocked_ids: z.array(z.string().regex(/^[A-Z]\d{2}$/)).max(64).default([]),
  fixed_character_ids: z.array(z.string().regex(/^C\d{2}$/)).max(2).default([]),
  fixed_place_id: z.string().regex(/^P\d{2}$/).optional(),
  interaction: z.enum(["play","paused","stopped","child_speaking","question"]).default("play"),
  replay: z.boolean().default(false)
});

export type Material = { id:string; kind:string; tags:string[]; family:string; energy:"normal"|"calm"; text:string };
export type DrawResult = { version:string; stage:string; candidate_count:number; selected:Material[]; reason:"ok"|"respect_interaction"|"no_eligible_materials" };

export function parseMaterials(text:string):Material[] {
  const cards:Material[] = [];
  const ids = new Set();
  for (const line of text.split(/\r?\n/)) {
    const match = /^([CPEGSHTMRBO]\d{2})\s+(?:\[tags=([a-z,-]+);family=([a-z0-9-]+);energy=(normal|calm)\]\s+)?(.+)$/.exec(line);
    if (!match) continue;
    const [,id,tags,family,energy,content] = match;
    if (ids.has(id)) throw new Error("Duplicate material ID: " + id);
    ids.add(id);
    cards.push({id,kind:id[0],tags:tags?.split(",") ?? [],family:family ?? id.toLowerCase(),energy:energy === "calm" ? "calm" : "normal",text:content});
  }
  return cards;
}

function randomFloat() {
  return crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
}

export function drawMaterials(cards:readonly Material[], input:unknown = {}, random:()=>number = randomFloat):DrawResult {
  const options = drawInputSchema.parse(input);
  const empty = (reason:DrawResult["reason"]):DrawResult => ({version:"1.2.0",stage:options.stage,candidate_count:0,selected:[],reason});
  if (options.interaction !== "play") return empty("respect_interaction");
  const closing = options.stage === "resolve" || options.energy === "calm";
  const kinds = closing ? ["T","S","R","B"] : options.stage === "opening"
    ? [...(options.fixed_character_ids.length ? [] : ["C"]), ...(options.fixed_place_id ? [] : ["P"]), "M","E","R","H"]
    : ["E","H","R","O"];
  // Vary the narrative functions too, so two cards are not always event + joke.
  if (!closing && options.stage === "continue") {
    for (let i=kinds.length-1;i>0;i--) {
      const j=Math.min(i,Math.floor(random()*(i+1)));
      [kinds[i],kinds[j]]=[kinds[j],kinds[i]];
    }
  }
  const blocked = new Set(options.blocked_ids);
  const recent = new Set(options.replay ? [] : options.recent_ids);
  const families = new Set(options.replay ? [] : options.recent_families);
  const tags = new Set<string>(options.tags);
  const ranked = cards.filter(card =>
    kinds.includes(card.kind) && !blocked.has(card.id) && !recent.has(card.id) && !families.has(card.family) &&
    (!closing || card.energy === "calm")
  ).map(card => ({card,score:card.tags.filter(tag=>tags.has(tag)).length,noise:random()}))
    .sort((a,b)=>b.score-a.score || a.noise-b.noise);
  if (!ranked.length) return empty("no_eligible_materials");
  // Reserve a candidate of each needed kind before filling the remaining places.
  const representatives = kinds.flatMap(kind=>{ const item=ranked.find(item=>item.card.kind===kind); return item ? [item] : []; });
  const candidates = [...representatives,...ranked].filter((item,index,all)=>all.findIndex(other=>other.card.id===item.card.id)===index).slice(0,10);
  const selected:Material[] = [];
  for (const kind of kinds) {
    const matches = candidates.filter(item=>item.card.kind===kind && !selected.some(card=>card.family===item.card.family));
    if (!matches.length) continue;
    const bestScore = Math.max(...matches.map(item=>item.score));
    const suitable = matches.filter(item=>item.score===bestScore);
    const item = suitable[Math.min(suitable.length-1,Math.floor(random()*suitable.length))];
    selected.push(item.card);
    if (selected.length === options.count) break;
  }
  return {version:"1.2.0",stage:options.stage,candidate_count:candidates.length,selected,reason:"ok"};
}
