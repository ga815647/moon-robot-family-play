# 月亮機器人親子遊戲

由GitHub維護的繁體中文親子語音遊戲：完整Project指令、素材庫、四個skills與可選MCP已整合為Plugin，供成人陪同約5歲孩子使用。主持人主動提供想像素材與小情節，孩子可以只聽、玩聲音或說一個詞；明確拒絕、安靜及正在講述時仍優先尊重。

## 使用與更新

1. 先看[Plugin架構與入口差異](docs/plugin-architecture.md)。已安裝且確認當前聊天能載入skills時，可用[精簡Project入口](PROJECT_PLUGIN_INSTRUCTIONS.md)；尚未確認手機語音支援時，使用[完整專案指令](PROJECT_INSTRUCTIONS.md)。
2. Plugin包含主持、共同敘事、睡前及家長回顧四個skills，以及現有唯讀素材MCP。由家長在新聊天選用Plugin，再開始遊戲；可以說「月亮，開場吧」。
3. Plugin內已附素材。完整指令模式可另上傳[STORY_MATERIALS.txt](STORY_MATERIALS.txt)；未讀到仍可使用內建小素材庫。
4. 未來在此repo維護來源，產生並更新同一Plugin；原始碼、套件、打包檢查均可追溯。本輪依家長要求先完成空轉檢查後，已套用1.4.1精簡入口並重新開啟設定核對；原設定保留本機備份，手機語音載入仍待實測。

目前指令、素材說明與Plugin版本：1.4.1，2026年10月18日。GitHub是維護來源，安裝Plugin是發行快照；push不會自動更新已安裝Plugin或既有聊天。基本遊戲不依賴即時搜尋、自行架設RAG或付費附加服務。[Worker素材服務](docs/worker.md)仍為1.2.0、相同148項卡片；語音對話中的Plugin載入仍需實測，不能只靠連結宣稱生效。

## 這份指令改了什麼

- 「月亮」幾乎一律預設為主持人或語音介面；只有明確上下文才切成天體或故事角色，不反覆問意思。
- 一般遊戲由主持人開場、接戲、推進一小步，不用「我等你／我安靜」填空。
- 故事通常4～7個短句，明確要完整故事可8～12句；知識回答、接一句與停止情境另行縮短。
- 素材檔含148個素材項、12張情境卡、8段長短示範，新增人物需求、角色關係、骨架及道具；約10候選挑2～3個相容元素，接成因果。
- 角色與目標先固定，近期相同卡號與笑點family暫時排除；選材也更換功能組合，不固定每輪都「新意外＋笑話」。
- 七類故事靈感自由組合，保留已定設定，近期笑點避免連續重複。
- 一般接戲一次只加一個主要變化；完整故事可有2～3個相連步驟，孩子仍能改寫、拒絕或結束。
- 保留成人主導、語音轉寫確認、安全、自然學習與睡前收尾。
- 加入家長可啟用的「帶他說故事」：示範、接詞擴句、留一個動作或結果；孩子能講就縮短讓位，不逼完整句、不連續追問。素材N區另有8組接話示範。
- 防止「我收好／不接話／繼續聽」換詞循環：安靜只由人類明確要求建立；主持回合要有回答或具體進展，真正安靜時不朗讀狀態，直接提問只答該題。

## 檔案

| 檔案 | 用途 |
| --- | --- |
| [PROJECT_INSTRUCTIONS.md](PROJECT_INSTRUCTIONS.md) | 唯一正式版本，可一次複製貼上 |
| [PROJECT_PLUGIN_INSTRUCTIONS.md](PROJECT_PLUGIN_INSTRUCTIONS.md) | 已確認Plugin可載入後使用的精簡Project入口與備援 |
| [Plugin架構與維護](docs/plugin-architecture.md) | skills、MCP、安裝、來源分工、打包與同步界線 |
| [Plugin套件](plugins/moon-robot-family-play/plugin.json) | 可重建的可安裝套件；由正式來源產生 |
| [STORY_MATERIALS.txt](STORY_MATERIALS.txt) | 可上傳Project來源的原創素材庫 |
| [研究與設計](docs/research-and-design.md) | GitHub 一手來源、機制改編、新舊差異、限制與維護方式 |
| [隨機故事產生器](docs/random-story-generators.md) | Plot Generator、Tracery、Story Cubes等機制與適用方式 |
| [模擬對話](docs/simulated-dialogues.md) | 26組前後對照及逐例檢查，全部為合成內容 |
| [故事長度與素材檢查](docs/materials-and-story-length-checks.md) | 7組新增情境，檢查長故事與來源讀取界線 |
| [Project來源與MCP設計](docs/material-supply-options.md) | 檔案方案、候選抽選、embedding取捨與接入限制 |
| [Worker使用與驗證](docs/worker.md) | 可選MCP服務、開發部署方式與測試範圍 |
| [生成器整合案例](docs/generator-integration-checks.md) | 角色綁定、骨架與笑點去重的合成推演 |
| [幼兒敘事研究評估](docs/narrative-scaffolding-evaluation.md) | 5項研究／原型的證據、反證與採用界線 |
| [敘事引導檢查](docs/narrative-scaffolding-checks.md) | 16組合成對照及五面向檢查 |
| [主持空轉回歸檢查](docs/hosting-idle-regression.md) | 合成多輪、舊話語污染、停止與單次邀請的文字代理測試 |
| [CHANGELOG.md](CHANGELOG.md) | 版本變動 |
| [AGENTS.md](AGENTS.md) | 後續協作維護規則 |

公開 repo 不收錄家庭真實聊天逐字稿或兒童個資。模擬對話是桌上推演，尚無新版手機語音試玩結果；指令不能保證語音系統無聲等待或長期完全去重。
