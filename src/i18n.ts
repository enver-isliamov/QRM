import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  ru: {
    translation: {
      "nav": {
        "home": "Главная",
        "namaz": "Намаз",
        "calendar": "Календарь",
        "yardym": "Ярдым",
        "profile": "Профиль"
      },
      "home": {
        "title": "ORAZA",
        "subtitle": "Ваш духовный спутник",
        "support": "Поддержать проект"
      }
    }
  },
  crh: {
    translation: {
      "nav": {
        "home": "Baş saife",
        "namaz": "Namaz",
        "calendar": "Taqvim",
        "yardym": "Yardım",
        "profile": "Profil"
      },
      "home": {
        "title": "ORAZA",
        "subtitle": "Ruhaniy yoldaşınız",
        "support": "Leyhanı desteklemek"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
