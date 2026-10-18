# 月亮機器人親子遊戲

一份可直接貼入 ChatGPT Project 的繁體中文語音遊戲主持指令，供成人陪同約5歲孩子使用。主持人主動提供想像素材與小情節，孩子可以只聽、玩聲音或說一個詞；明確拒絕、安靜及正在講述時仍優先尊重。

## 使用與更新

1. 開啟 [完整專案指令](PROJECT_INSTRUCTIONS.md)，複製全文，取代 Project 原有指令。
2. 由家長陪同開始語音遊戲。可以說「月亮，開場吧」，也可直接接續目前活動。
3. 可將 [STORY_MATERIALS.txt](STORY_MATERIALS.txt) 上傳Project來源，擴充素材；沒有上傳仍可使用指令內的小素材庫。
4. 未來在這個repo維護新版；更新後查看差異及[模擬對照](docs/simulated-dialogues.md)、[故事長度與素材檢查](docs/materials-and-story-length-checks.md)，再由家長同步指令及素材檔。

目前版本：1.2.0，2026年10月18日。來源連結不會自動同步指令或上傳素材。基本遊戲使用已貼入的全文，不依賴即時搜尋、自行架設RAG、安裝程式或付費附加服務。Project素材檔是可選擴充，不保證每回合讀入全檔；[Worker素材服務](docs/worker.md)提供可選的程式抽樣。

## 這份指令改了什麼

- 「月亮」幾乎一律預設為主持人或語音介面；只有明確上下文才切成天體或故事角色，不反覆問意思。
- 一般遊戲由主持人開場、接戲、推進一小步，不用「我等你／我安靜」填空。
- 故事通常4～7個短句，明確要完整故事可8～12句；知識回答、接一句與停止情境另行縮短。
- 素材檔含148個素材項、12張情境卡、8段長短示範，新增人物需求、角色關係、骨架及道具；約10候選挑2～3個相容元素，接成因果。
- 角色與目標先固定，近期相同卡號與笑點family暫時排除；選材也更換功能組合，不固定每輪都「新意外＋笑話」。
- 七類故事靈感自由組合，保留已定設定，近期笑點避免連續重複。
- 一般接戲一次只加一個主要變化；完整故事可有2～3個相連步驟，孩子仍能改寫、拒絕或結束。
- 保留成人主導、語音轉寫確認、安全、自然學習與睡前收尾。

## 檔案

| 檔案 | 用途 |
| --- | --- |
| [PROJECT_INSTRUCTIONS.md](PROJECT_INSTRUCTIONS.md) | 唯一正式版本，可一次複製貼上 |
| [STORY_MATERIALS.txt](STORY_MATERIALS.txt) | 可上傳Project來源的原創素材庫 |
| [研究與設計](docs/research-and-design.md) | GitHub 一手來源、機制改編、新舊差異、限制與維護方式 |
| [隨機故事產生器](docs/random-story-generators.md) | Plot Generator、Tracery、Story Cubes等機制與適用方式 |
| [模擬對話](docs/simulated-dialogues.md) | 26組前後對照及逐例檢查，全部為合成內容 |
| [故事長度與素材檢查](docs/materials-and-story-length-checks.md) | 7組新增情境，檢查長故事與來源讀取界線 |
| [Project來源與MCP設計](docs/material-supply-options.md) | 檔案方案、候選抽選、embedding取捨與接入限制 |
| [Worker使用與驗證](docs/worker.md) | 可選MCP服務、開發部署方式與測試範圍 |
| [生成器整合案例](docs/generator-integration-checks.md) | 角色綁定、骨架與笑點去重的合成推演 |
| [CHANGELOG.md](CHANGELOG.md) | 版本變動 |
| [AGENTS.md](AGENTS.md) | 後續協作維護規則 |

公開 repo 不收錄家庭真實聊天逐字稿或兒童個資。模擬對話是桌上推演，尚無新版手機語音試玩結果；指令不能保證語音系統無聲等待或長期完全去重。
