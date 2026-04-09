const translations = require('./src/lib/translations.ts').default;

const t = (key, lang = 'ar') => {
  if (translations[lang] && translations[lang][key]) return translations[lang][key];
  if (translations['ar'] && translations['ar'][key]) return translations['ar'][key];
  return key;
};

console.log('Test 4390:', t('sys.str_4390', 'ar'));
console.log('Test 4391:', t('sys.str_4391', 'ar'));
console.log('Test 4339:', t('sys.str_4339', 'ar'));
