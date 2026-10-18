# 故事素材 Worker 使用與驗證

版本1.2.0已部署為獨立Cloudflare Worker，從同一份STORY_MATERIALS.txt打包148項素材。Project指令和素材檔也已整合生成器做法；Worker只是可選抽樣來源，不是遊戲必備依賴。

指令與素材說明1.7.0含N區8組敘事、Q區12組需要回應及W區8組接戲示例。此次重新打包同一來源並部署，148項原子卡及抽樣程式未變，服務仍為1.2.0。N／Q／W不在抽樣範圍，情緒回應與帶領由Project及Plugin處理，不新增情緒輸入或記錄。

## 服務入口

- MCP連線網址：[https://moon-robot-materials.ga815647.workers.dev/mcp](https://moon-robot-materials.ga815647.workers.dev/mcp)
- 健康檢查：[服務狀態](https://moon-robot-materials.ga815647.workers.dev/health)
- 工具名稱：draw_story_materials
- 傳輸：Streamable HTTP，SDK穩定版2.3.1；支援2026-07-28每請求中繼資料，並保留2025-11-25無狀態相容路徑。

MCP入口接受POST，直接用瀏覽器開GET會得到405，這不等於服務壞了。請用健康檢查確認基本狀態。

這是刻意公開、無登入的唯讀素材工具，只能從repo公開的素材中取卡。沒有存取私人服務、執行程式、寫入資料或任意網址搜尋的功能；伺服器不接收自由輸入的故事摘要或孩子逐字轉寫。沒有D1、KV、Vectorize、embedding或另一個LLM呼叫。不承諾無限免費，仍使用既有Workers配額。

## 指令與來源檔

先查看[完整指令差異與版本紀錄](../CHANGELOG.md)，再將[正式指令](../PROJECT_INSTRUCTIONS.md)全文同步至Project設定；將[素材檔](../STORY_MATERIALS.txt)替換為Project來源中的最新版。此次已將遠端Project儲存並回讀確認為1.7.0完整指令，素材包含在Plugin；未另外上傳Project來源。

只用這兩份文字就能玩。若來源不可見，指令內的小素材庫可繼續接戲；若工具未安裝，也不能假裝已呼叫。

如要啟用MCP，由家長在帳號支援的自訂MCP／Plugins連線入口加入上面的MCP網址，選無驗證並安裝。確認該對話真的提供工具後，再由家長說明啟用素材工具。官方接入流程見[OpenAI自訂MCP文件](https://developers.openai.com/api/docs/guides/custom-mcp-server)。網址可用與帳號、Android語音模式能否調用，是不同的驗證；本次尚未驗證手機語音接入。

## 抽樣怎麼保持連貫

輸入只有有限列舉與公開ID：stage、energy、tags、count、recent_ids、recent_families、blocked_ids、fixed_character_ids、fixed_place_id、interaction、replay。未知欄位會被拒絕，不要求傳送孩子原話。

- opening：補人物、地點、需求；已提供固定角色或地點時不再抽取該欄位。
- continue：只從事件、幽默、關係或道具取材，保留主持人已建立的人物與目標；抽取的功能組合也會變化。
- resolve或calm：只提供回收、輕聲、關係或安穩骨架，不增加新危機。
- paused、stopped、child_speaking或question：回傳空素材。
- 排除近期ID和同笑點family，再依主題相容度形成至多10候選；選2～3張不同功能與family的卡。
- 若池已用盡，不偷偷放寬排除；可回傳較少項目或明確空結果，讓主持人用眼前內容收束。
- replay允許重演近期素材，但blocked_ids仍有效。小孩拒絕的內容不能被重演旗標取消。

服務不保存每個孩子或聊天的抽取歷史；每次必須由主持人傳入近期ID與family，才會在該次排除。這是程式抽樣及條件去重，不是宣稱能永久記住所有故事。卡的內容仍須由主持人接成因果，不能逐張念給孩子。

## 本機維護與部署

使用Node.js24或以上版本。安裝鎖定依賴後：
- npm test：抽樣與MCP入口測試。
- npm run typecheck：TypeScript型別檢查。
- npm run build：以Wrangler驗證設定並打包，不部署。
- npm run dev：啟動本機Worker。
- node scripts/smoke.mjs：對預設本機入口做整合檢查。
- npm run deploy：在有已授權Cloudflare登入的環境部署。
- node scripts/smoke.mjs https://moon-robot-materials.ga815647.workers.dev：檢查公開入口。

素材只維護STORY_MATERIALS.txt一份，Worker建置時解析並打包；修改素材後需要重新部署Worker，也要重新同步Project來源，GitHub連結不會自動替換它們。新增分類或工具輸入時，更新解析器、schema與測試。更換網域時也要更新Host允許清單。

SDK版本與完整解析依賴記錄在package-lock.json。此實作依照[Cloudflare Workers建議](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)與[MCP Streamable HTTP規範](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)處理來源檢查、請求上限及協定路由；不提供用不到的訂閱、資源、提示範本或寫入能力。

協定固定依據為2026-07-28規範標籤，已核對其Git物件為5f5440bb26a62e2cf3440b92da5a667efa03b267；SDK使用穩定發布的@modelcontextprotocol/server 2.3.1與lockfile integrity，不跟隨未固定的主分支建置。

## 已完成的驗證

2026年10月18日：
- 29項自動測試通過，涵蓋ID與笑點族排除、固定角色、不同功能抽選、安靜與收尾、輸入限制、兩代MCP中繼資料、Origin與CORS、未知方法、格式錯誤及過大請求。
- 型別檢查與Wrangler打包通過。
- 本機Worker執行環境實際成功解析148項素材並完成工具呼叫。
- 公開Worker的8項煙霧檢查通過：健康、舊版握手、工具列表、抽樣、近期排除、新版協定收尾、暫停及不可信來源拒絕。
- [6組生成器整合案例](generator-integration-checks.md)為文字推演，另檢查豐富度、重複性、連貫、尊重及過度主導。

以上不代表已完成模型盲測或真實孩子、手機語音試玩。公開服務已重新部署並通過線上檢查，Project完整指令及同一Plugin已同步；手機即時語音調用仍待實測。
