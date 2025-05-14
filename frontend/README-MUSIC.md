# 在網頁中添加音樂指南

## 如何添加音樂檔案

1. 將您的音樂檔案放入 `frontend/public/music` 資料夾中
2. 音樂檔案支援的格式包括：
   - MP3 (.mp3)
   - WAV (.wav)
   - OGG (.ogg)
   - AAC (.aac)

## 音樂檔案命名

建議使用英文和數字來命名您的音樂檔案，避免特殊字符和空格。例如：
- `background.mp3`
- `ocean_waves.mp3`
- `whale_song_01.mp3`

## 如何更改音樂

若要更改網頁上播放的音樂，請修改 `frontend/pages/index.js` 文件中的以下部分：

```jsx
<AudioPlayer src="/music/background.mp3" autoPlay={false} />
```

將 `src` 參數的值更改為您的音樂檔案路徑：

```jsx
<AudioPlayer src="/music/您的音樂檔案名稱.mp3" autoPlay={false} />
```

## 自動播放設置

如果您希望音樂在網頁載入後自動播放，請將 `autoPlay` 參數修改為 `true`：

```jsx
<AudioPlayer src="/music/background.mp3" autoPlay={true} />
```

請注意：由於大多數現代瀏覽器的安全設置，自動播放可能會被阻止，除非用戶先與頁面進行互動。

## 音樂播放器功能

內建的音樂播放器提供以下功能：
- 播放/暫停按鈕
- 音量調節滑塊
- 循環播放（默認開啟）

## 最佳實踐

1. 確保音樂檔案大小合理（建議小於 5MB）以避免過長的載入時間
2. 使用適合您網站主題的音樂
3. 考慮使用 MP3 格式，因為它提供了良好的壓縮率和兼容性
4. 確保您擁有音樂檔案的版權或使用許可 