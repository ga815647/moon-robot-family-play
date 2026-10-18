import test from "node:test";
import assert from "node:assert/strict";
import { parseMaterials, drawMaterials } from "../src/sampler.ts";

const source = `版本：1.2.0
C01 [tags=delivery;family=character-pig;energy=normal] 小豬包包
P01 [tags=delivery;family=station;energy=normal] 雲朵車站
M01 [tags=delivery;family=deliver;energy=normal] 想送到一件東西
E01 [tags=delivery;family=direction;energy=normal] 包裹轉個方向
E02 [tags=delivery;family=wrong-sound;energy=normal] 推車聲音像貓
H01 [tags=delivery;family=literal;energy=normal] 請椅子坐下
H02 [tags=food;family=too-serious;energy=normal] 替布丁畫座位圖
R01 [tags=delivery;family=help;energy=calm] 請朋友扶一下
R02 [tags=food;family=sharing;energy=calm] 留一個位置
T01 [tags=delivery;family=completion;energy=calm] 物品平安送到
T02 [tags=food;family=rest;energy=calm] 一起坐好休息
S01 [tags=delivery;family=soft-sound;energy=calm] 沙沙
B01 [tags=delivery;family=small-arc;energy=calm] 先做一件小事再收尾
D01 故事示範：不能被當成原子卡抽出
`;

test("parses metadata and excludes full demonstration paragraphs", () => {
  const cards = parseMaterials(source);
  assert.equal(cards.length, 13);
  assert.deepEqual(cards[0], { id:"C01", kind:"C", tags:["delivery"], family:"character-pig", energy:"normal", text:"小豬包包" });
});
test("rejects duplicate IDs instead of silently corrupting exclusions", () => {
  assert.throws(() => parseMaterials(source + "\nC01 重複角色"), /Duplicate/);
});
test("continuation keeps established roles and goals out of newly drawn cards", () => {
  const result = drawMaterials(parseMaterials(source), { stage:"continue", tags:["delivery"], count:3 }, () => 0.2);
  assert.equal(result.selected.length, 3);
  assert.ok(result.selected.every(c => ["E","H","R","O"].includes(c.kind)));
  assert.equal(new Set(result.selected.map(c => c.kind)).size, 3);
});
test("excludes recent IDs and the entire recently used joke family", () => {
  const result = drawMaterials(parseMaterials(source), { stage:"continue", tags:["delivery"], count:3, recent_ids:["E01"], recent_families:["literal"] }, () => 0.3);
  assert.ok(result.selected.length >= 2);
  assert.ok(!result.selected.some(c => c.id === "E01" || c.family === "literal"));
});
test("never relaxes exclusions when the remaining pool is empty", () => {
  const result = drawMaterials(parseMaterials(source), { stage:"continue", recent_families:["direction","wrong-sound","literal","too-serious","help","sharing"] }, () => 0.3);
  assert.deepEqual(result.selected, []);
  assert.equal(result.reason, "no_eligible_materials");
});
test("closing and calm requests do not introduce new obstacles", () => {
  for (const input of [{stage:"resolve"}, {stage:"continue", energy:"calm"}]) {
    const result = drawMaterials(parseMaterials(source), input, () => 0.4);
    assert.ok(result.selected.length >= 2);
    assert.ok(result.selected.every(c => ["T","S","R","B"].includes(c.kind)));
    assert.ok(result.selected.every(c => c.energy === "calm"));
  }
});
test("paused, stopped and child-led turns return no new story hooks", () => {
  for (const interaction of ["paused","stopped","child_speaking","question"]) {
    const result = drawMaterials(parseMaterials(source), { interaction }, () => 0.5);
    assert.deepEqual(result.selected, []);
    assert.equal(result.reason, "respect_interaction");
  }
});
test("explicit replay may reuse recent material but never a blocked card", () => {
  const result = drawMaterials(parseMaterials(source), { stage:"continue", replay:true, recent_families:["direction","literal","help"], blocked_ids:["E01"], count:3 }, () => 0.2);
  assert.ok(result.selected.some(c => c.family === "literal" || c.family === "help"));
  assert.ok(!result.selected.some(c => c.id === "E01"));
});
test("uses randomness among suitable candidates rather than always returning the first cards", () => {
  const cards = parseMaterials(source);
  const first = drawMaterials(cards, {stage:"continue",count:3}, () => 0.01);
  const last = drawMaterials(cards, {stage:"continue",count:3}, () => 0.99);
  assert.notDeepEqual(first.selected.map(c => c.id), last.selected.map(c => c.id));
});
test("two-card continuations can choose a relationship instead of forcing the same event-and-joke pair", () => {
  const result = drawMaterials(parseMaterials(source), {stage:"continue",count:2}, () => 0.01);
  assert.ok(result.selected.some(card => card.kind === "R"));
});
test("caps the candidate pool at ten and returns at most three complementary cards", () => {
  const expanded = parseMaterials(source + Array.from({length:40}, (_,i) => "\nE"+(i+10)+" [tags=delivery;family=event-"+i+";energy=normal] 小事件"+i).join(""));
  const result = drawMaterials(expanded, {stage:"continue",tags:["delivery"],count:3}, () => 0.1);
  assert.equal(result.candidate_count, 10);
  assert.equal(result.selected.length, 3);
  assert.equal(new Set(result.selected.map(c => c.family)).size, 3);
});
test("rejects raw utterances and excessive counts at the public tool boundary", () => {
  assert.throws(() => drawMaterials(parseMaterials(source), {utterance:"月亮嗯嗯"}));
  assert.throws(() => drawMaterials(parseMaterials(source), {count:100}));
  assert.throws(() => drawMaterials(parseMaterials(source), {recent_ids:Array(65).fill("E01")}));
});
test("an opening with fixed roles fills other slots rather than replacing the protagonists", () => {
  const result=drawMaterials(parseMaterials(source),{stage:"opening",fixed_character_ids:["C01"],fixed_place_id:"P01"},()=>0.2);
  assert.equal(result.selected.length,3);
  assert.ok(result.selected.every(card=>card.kind!=="C"&&card.kind!=="P"));
  assert.ok(result.selected.some(card=>card.kind==="M"));
});
