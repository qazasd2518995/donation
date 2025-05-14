# 多語言功能使用指南

## 功能概述

本網站目前支持中文（繁體）和英文兩種語言，用戶可以通過頁面右上角的語言切換按鈕進行切換。系統會記住用戶的語言偏好，並在下次訪問時自動使用。

## 技術實現

多語言功能通過以下技術實現：

1. **上下文API (Context API)**: 使用React的上下文API管理整個應用程序的語言狀態
2. **本地存儲 (localStorage)**: 保存用戶的語言偏好，確保會話之間的一致性
3. **翻譯文件**: 集中管理所有翻譯文本，便於維護和擴展

## 文件結構

```
frontend/
  ├── components/
  │   ├── LanguageContext.js   # 語言上下文提供者
  │   ├── LanguageToggle.js    # 語言切換按鈕組件
  │   └── Translation.js       # 翻譯工具函數
  ├── locales/
  │   └── translations.js      # 所有翻譯文本
  └── pages/
      └── _app.js              # 應用根組件，包含語言提供者
```

## 添加新語言支持

如果您想添加新的語言支持，請按照以下步驟操作：

1. 在 `frontend/locales/translations.js` 文件中為每個區域添加新的語言對象，例如添加日文：

```javascript
home: {
  zh: { ... },
  en: { ... },
  ja: {
    title: 'PSK x 台湾セタス協会：海洋保護プロジェクト',
    // 其他翻譯...
  }
}
```

2. 修改 `LanguageContext.js` 和 `LanguageToggle.js` 以支持新語言:

```javascript
// LanguageContext.js
const toggleLanguage = () => {
  const languages = ['zh', 'en', 'ja'];
  const currentIndex = languages.indexOf(language);
  const nextIndex = (currentIndex + 1) % languages.length;
  const newLanguage = languages[nextIndex];
  setLanguage(newLanguage);
  localStorage.setItem('language', newLanguage);
};

// LanguageToggle.js
const getButtonText = () => {
  switch (language) {
    case 'zh': return 'English';
    case 'en': return '日本語';
    case 'ja': return '中文';
    default: return '中文';
  }
};
```

## 使用翻譯函數

在組件中使用翻譯函數的方法如下：

```javascript
import { useLanguage } from '../components/LanguageContext';
import { useTranslation } from '../components/Translation';

function MyComponent() {
  const { language } = useLanguage();
  const { t } = useTranslation('home'); // 使用 'home' 區域的翻譯
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('content')}</p>
    </div>
  );
}
```

## 翻譯帶有變量的文本

如果您的文本包含變量，可以使用佔位符：

```javascript
// 在translations.js中定義
totalWinners: '本次共抽出 {count} 名幸運得獎者',

// 在組件中使用
const message = t('totalWinners', { count: 10 });
// 結果: "本次共抽出 10 名幸運得獎者"
```

## 注意事項

1. 確保所有硬編碼的字符串都移至翻譯文件中
2. 翻譯區域應根據功能模塊組織，如 'home', 'draw', 'audio' 等
3. 當添加新功能時，同時更新所有語言的翻譯文本
4. 使用語言檢測功能確保所有文本都被正確翻譯 