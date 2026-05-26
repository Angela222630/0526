# MediaPipe 表情辨識前端範例

這是一個純前端的 MediaPipe 表情辨識範例，使用瀏覽器攝影機即時偵測臉部表情，並透過語音回饋偵測結果。

## 特色

- 使用 MediaPipe FaceMesh 偵測臉部關鍵點
- 支援手機前後鏡頭切換
- 偵測笑臉、驚訝／張嘴、專注凝視、平常臉
- 使用 `SpeechSynthesis` 語音回饋對應訊息

## 使用方式

1. 開啟 `index.html`
2. 允許瀏覽器存取攝影機
3. 使用前鏡頭或後鏡頭對準臉部
4. 嘗試做不同表情，聆聽語音回饋

## 開發

如果想要在本機測試，建議透過靜態伺服器，例如：

```bash
git clone <repo>
cd 0526
python3 -m http.server 8000
```

然後開啟 `http://localhost:8000`。
