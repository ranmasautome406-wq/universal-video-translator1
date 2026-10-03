export const LANGUAGES = [
  ['ar', 'Arabic'], ['bn', 'Bengali'], ['zh', 'Chinese'], ['en', 'English'], ['fr', 'French'],
  ['de', 'German'], ['gu', 'Gujarati'], ['hi', 'Hindi'], ['it', 'Italian'], ['ja', 'Japanese'],
  ['kn', 'Kannada'], ['ko', 'Korean'], ['ml', 'Malayalam'], ['mr', 'Marathi'], ['pa', 'Punjabi'],
  ['pt', 'Portuguese'], ['ru', 'Russian'], ['es', 'Spanish'], ['ta', 'Tamil'], ['te', 'Telugu'],
  ['tr', 'Turkish'], ['ur', 'Urdu'],
].map(([code, name]) => ({ code, name }));

export const POPULAR = ['en', 'hi', 'es', 'fr', 'zh'];
export const isLang = (c) => LANGUAGES.some((l) => l.code === c);
export const langName = (c) => LANGUAGES.find((l) => l.code === c)?.name || c;
