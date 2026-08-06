# 數據駭客遊戲交接文件

本文件給官方網站工程師串接使用。遊戲目前是純前端靜態版，可直接部署在 GitHub Pages 或官方網站靜態目錄。正式上線時，建議保留目前遊戲流程與題目邏輯，只替換排行榜、玩家資料、題庫來源與官方字體載入。
※排行榜樣式請複製過往的樣式到遊戲開始當頁，謝謝！


## 專案入口

- 入口頁：`index.html`
- 主要樣式：`style.css`
- 遊戲邏輯：`game.js`
- 拼音修正工具：`pinyinModifier.js`
- 題庫資料：`data_online/`
- 圖片素材：`assets/images/`
- 音樂音效：`assets/music/`
- UI 圖示：`assets/ui/`



## 目前遊戲流程

1. 進入故事導覽頁。
2. 點擊畫面後播放背景音樂。
3. 進入開始頁，選擇腔調。
4. 開始修復後，從題庫隨機抽 10 題。
5. 每題播放客語音檔，玩家選出錯誤拼音字卡，再選擇正確補丁。
6. 結算分數、計時、星級評價、排行榜與 10 題明細。

## 需要串接的項目

### 1. 排行榜

目前排行榜是假資料，位置在 `game.js`：

- `DUMMY_LEADERBOARD`
- `DUMMY_STATS`
- `renderLeaderboard(playerScore, playerTimeSeconds)`

正式網站應改成後端 API 回傳資料。建議 API 至少提供：

```json
{
  "leaderboard": [
    {
      "rank": 1,
      "playerId": "user_001",
      "name": "林○恩",
      "score": 100,
      "time": 187.325,
      "stars": 5
    }
  ],
  "self": {
    "rank": 12,
    "playerId": "current_user",
    "name": "你",
    "score": 90,
    "time": 203.118,
    "stars": 4
  },
  "stats": {
    "participants": 1905,
    "plays": 5051
  }
}
```

欄位說明：

- `rank`：名次。
- `playerId`：玩家識別碼，可不顯示，但後端應保存。
- `name`：排行榜顯示名稱，建議後端先遮罩個資，例如 `林○恩`。
- `score`：分數，目前滿分 100。
- `time`：秒數，可含小數，例如 `187.325`。
- `stars`：星級，1 到 5。
- `participants`：參與人數。
- `plays`：總遊玩次數。

排序建議：

1. 分數高者優先。
2. 分數相同時，時間短者優先。
3. 若仍相同，以完成時間或送出時間排序。

時間顯示格式目前是 `MM:SS:MSMSMS`，由 `formatLeaderboardTime()` 處理，例如 `03:07:325`。

### 2. 成績送出

目前遊戲結束只在前端顯示結果，沒有送出到後端。正式網站建議在 `showResults()` 中、呼叫 `renderLeaderboard()` 前後送出本局資料。

建議送出的資料：

```json
{
  "gameId": "bunnsho",
  "missionId": "S2_m1",
  "playerId": "current_user",
  "playerName": "特工",
  "dialect": "sixian",
  "score": 100,
  "time": 187.325,
  "stars": 5,
  "startedAt": "2026-08-03T10:00:00+08:00",
  "completedAt": "2026-08-03T10:03:07+08:00",
  "answers": [
    {
      "questionId": "q_2_1",
      "correctChar": "食",
      "correctPinyin": "siid",
      "selectedWrongChar": "食",
      "selectedPatch": "siid",
      "isCorrect": true,
      "mistakes": 0
    }
  ]
}
```

需要工程師依官方登入系統補上的欄位：

- `playerId`
- `playerName`
- `schoolId` / `classId` / `teacherId`，若官方平台需要班級統計。
- 防重複送出 token 或 session id。

### 3. 星級與稱號

目前星級由 `calculateRank(score)` 依分數判斷：

- 90 分以上：5 星
- 75 到 89 分：4 星
- 60 到 74 分：3 星
- 30 到 59 分：2 星
- 29 分以下：1 星

程式內已有註解：正式串接後可改為「全站百分位排名」邏輯。若官方要沿用設計稿，可改成：

- 5 星：前 5% 或滿分。
- 4 星：前 6% 到 20%。
- 3 星：前 21% 到 50%。
- 2 星：前 51% 到 80%。
- 1 星：後 20%。

建議由後端回傳 `stars`、`title`、`rankPercentile`，前端只負責顯示，避免不同頁面計算不一致。

### 4. 題目調整

題目基本上不變，只有老師反應內容錯誤時才需要修改。題庫來源在 `data_online/`：

- `sixian_all.json`：四縣腔
- `hailu_all.json`：海陸腔
- `dabu_all.json`：大埔腔
- `raoping_all.json`：饒平腔
- `zhaoan_all.json`：詔安腔
- `southsixian_all.json`：南四縣腔
- `lessons_list.json`：原始課文清單參考，目前遊戲主要使用各腔調 `_all.json`

題目載入位置在 `game.js`：

- `USE_ONLINE_STREAMING`
- `loadGameData()`
- `initializeQuestions()`

目前預設依下拉選單選擇腔調，讀取：

```js
data_online/{dialect}_all.json
```

單題資料格式範例：

```json
{
  "id": "q_2_1",
  "original_sentence": "阿公，請問你食朝好食麼个？",
  "pinyin": "aˊ gungˊ qiangˋ mun nˇ siid zeuˊ hau siid maˋ ge",
  "local_audio": "https://example.com/audio.mp3",
  "words": [
    {
      "char": "阿",
      "pinyin": "aˊ",
      "custom_wrong_pinyin": null,
      "custom_wrong_char": null,
      "custom_distractors": []
    }
  ]
}
```

老師回報題目時，優先調整：

- `original_sentence`：句子文字。
- `pinyin`：整句拼音。
- `local_audio`：音檔 URL。
- `words[].char`：字卡文字。
- `words[].pinyin`：字卡正確拼音。
- `custom_wrong_pinyin`：指定錯誤拼音。
- `custom_wrong_char`：指定錯誤字。
- `custom_distractors`：指定干擾選項。

正式網站如果要後台管理題庫，建議後端輸出同樣 JSON 結構，前端就不用大改。

### 5. 玩家與登入

目前遊戲沒有登入，也沒有讀官方會員資料。`playerName` 目前固定為 `特工`。

正式串接時建議提供：

- 玩家 id。
- 顯示名稱。
- 班級 / 學校 / 老師關聯。
- 是否允許出現在排行榜。
- 個資遮罩後的排行榜名稱。

若玩家未登入，可採匿名模式，但排行榜應標記為暫存或不送出正式排名。

### 6. 音檔與音效

題目朗讀音檔來自每題的 `local_audio`。目前 `_all.json` 內可放完整 URL，也可放本地路徑。

背景音樂與音效在 `assets/music/`：

- `S2_m1_bgmloop.mp3`
- `S2_m1_click.mp3`
- `S2_m1_false.mp3`
- `S2_m1_next.mp3`

音效開關目前控制背景音樂與按鈕音效。瀏覽器限制自動播放，所以第一頁需要使用者點擊後才會開始播放 BGM，這是正常行為。

### 7. 返回列表按鈕

目前返回列表按鈕是前端按鈕樣式，尚未串官方網站路由。正式網站請把按鈕事件改成官方列表頁路徑。

相關 DOM / JS：

- `story-return-list-btn`
- `start-return-list-btn`
- `game-return-list-btn`
- `results-return-list-btn`
- `game.js` 內對 return button 的 event listener

建議由網站提供一個固定 URL，例如：

```js
const LOBBY_URL = "/mission-list";
```

或由 HTML 注入：

```html
<body data-lobby-url="/mission-list">
```

### 8. 官方字體

目前 `style.css` 已使用官方網站字體名稱作為優先 font stack：

- `twhei-s`
- `GenSekiGothic2TW-R`

但這兩個字體檔尚未包進專案。正式串官方網站時，請工程師補上官方的 `@font-face` 或沿用官方網站全站字體載入。

目前 CSS 已保留註解，方便工程師接：

```css
--font-hakka: "twhei-s", "GenSekiGothic2TW-R", ...;
--font-display: "GenSekiGothic2TW-R", "twhei-s", ...;
```

另外，只有主標題「數據駭客」使用 `Orbitron`，這是為了保留 LOGO 科技感；客語內容仍優先使用官方客語字體。

### 9. 無障礙 AA 注意事項

目前 Lighthouse desktop / mobile Accessibility 曾測到 100 分，但正式上站仍建議再測一次，因為官方網站外框、登入流程、iframe 或路由可能影響結果。

已處理項目：

- 全域鍵盤焦點 `:focus-visible`。
- 腔調選單 label。
- 圖片 alt / 裝飾圖 aria hidden。
- 動態提示 `aria-live`。
- 題目字卡可用 Tab、Enter、空白鍵操作。
- 題目字卡與補丁選項可用方向鍵移動。
- 排行榜排名提供讀屏文字。
- `prefers-reduced-motion` 降低動畫。
- viewport 允許使用者縮放。

正式站仍需人工測：

- 真手機 VoiceOver / TalkBack。
- Windows NVDA。
- 鍵盤不使用滑鼠跑完整流程。
- 200% 縮放與手機直向畫面。

### 10. 效能與部署

目前已把首屏主要 PNG 改為 WebP，並 preload 首屏故事圖與背景圖。

仍需注意：

- `style.css` 是主要 CSS，會有正常的 render-blocking；這不影響 AA，但會影響 Lighthouse Performance。
- `data_online/*_all.json` 單檔約 7MB，正式網站若很在意載入速度，建議改成 API 分頁或依課別載入。
- BGM 檔案約 7MB，若官方站效能要求高，可考慮壓縮或延後載入。
- `assets/dummy/` 是設計過程素材，不應放進正式部署。
- `lighthouse-*.json`、`scratch_verify_*` 是檢測/暫存檔，不應放進正式部署。

## 建議工程師優先處理順序

1. 串官方登入玩家資料。
2. 實作成績送出 API。
3. 實作排行榜 API，替換 `DUMMY_LEADERBOARD`。
4. 決定星級由前端分數算，或由後端百分位回傳。
5. 確認返回列表按鈕連到官方列表頁。
6. 串官方字體 `twhei-s`、`GenSekiGothic2TW-R`。
7. 決定題庫維護方式：保留 JSON 檔，或改由後台輸出同格式 API。
8. 正式站重新跑 Lighthouse、NVDA、VoiceOver / TalkBack。

## 可先保留不動的部分

- 遊戲 UI 與主要互動流程。
- 10 題抽題規則。
- 題目資料格式。
- 故事導覽頁。
- 音效與背景音樂控制。
- 結算明細顯示。

## 最小 API 需求摘要

正式網站至少需要三個串接點：

1. 取得目前玩家：

```http
GET /api/me
```

2. 送出本局成績：

```http
POST /api/games/bunnsho/results
```

3. 取得排行榜：

```http
GET /api/games/bunnsho/leaderboard?dialect=sixian
```

若題庫也改由後端管理，再加：

```http
GET /api/games/bunnsho/questions?dialect=sixian
```

