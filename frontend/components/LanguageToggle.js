import { useLanguage } from './LanguageContext';

const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();
  
  return (
    <button
      onClick={toggleLanguage}
      className="fixed top-4 right-4 z-50 bg-secondary/80 backdrop-blur-md p-2 rounded-lg shadow-lg text-white hover:bg-primary transition-colors"
    >
      {language === 'zh' ? 'English' : '中文'}
    </button>
  );
};

export default LanguageToggle; 