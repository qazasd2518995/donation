import { useLanguage } from './LanguageContext';
import translations from '../locales/translations';

// 翻譯工具組件
export const useTranslation = (section) => {
  const { language } = useLanguage();
  
  // 獲取指定區域的翻譯
  const t = (key, placeholders = {}) => {
    // 檢查指定區域是否存在
    if (!translations[section]) {
      console.warn(`翻譯區域 "${section}" 不存在`);
      return key;
    }
    
    // 檢查指定語言是否存在
    if (!translations[section][language]) {
      console.warn(`語言 "${language}" 在 "${section}" 區域中不存在`);
      return key;
    }
    
    // 獲取翻譯文本
    let text = translations[section][language][key];
    
    // 如果找不到翻譯，嘗試回退到中文
    if (text === undefined && language !== 'zh') {
      text = translations[section]['zh'][key];
    }
    
    // 如果仍然找不到翻譯，返回鍵名
    if (text === undefined) {
      console.warn(`翻譯鍵 "${key}" 在 "${section}.${language}" 中不存在`);
      return key;
    }
    
    // 處理佔位符
    if (Object.keys(placeholders).length > 0) {
      Object.keys(placeholders).forEach(placeholder => {
        const regex = new RegExp(`{${placeholder}}`, 'g');
        text = text.replace(regex, placeholders[placeholder]);
      });
    }
    
    return text;
  };
  
  return { t };
}; 