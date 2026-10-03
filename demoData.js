// Sample data used only when DEMO_MODE=true. Always labeled as demo in the UI.
export const DEMO_SEGMENTS = [
  { start: 2, end: 5, text: 'Welcome to our channel.' },
  { start: 5.5, end: 9, text: 'Today we are going to show you how video translation works.' },
  { start: 9.5, end: 13, text: 'First, upload your video and choose a language.' },
  { start: 13.5, end: 17, text: 'The system detects speech and writes a transcript.' },
  { start: 17.5, end: 21, text: 'Then it translates the text and creates subtitles.' },
  { start: 21.5, end: 25, text: 'Thanks for watching, and see you in the next one.' },
];

export const DEMO_TRANSLATIONS = {
  hi: ['हमारे चैनल में आपका स्वागत है।', 'आज हम आपको दिखाएंगे कि वीडियो अनुवाद कैसे काम करता है।', 'सबसे पहले, अपना वीडियो अपलोड करें और भाषा चुनें।', 'सिस्टम बोली को पहचानकर ट्रांसक्रिप्ट लिखता है।', 'फिर यह पाठ का अनुवाद करता है और सबटाइटल बनाता है।', 'देखने के लिए धन्यवाद, अगली बार मिलते हैं।'],
  mr: ['आमच्या चॅनेलवर आपले स्वागत आहे.', 'आज आम्ही तुम्हाला व्हिडिओ भाषांतर कसे चालते ते दाखवू.', 'प्रथम, तुमचा व्हिडिओ अपलोड करा आणि भाषा निवडा.', 'सिस्टम बोलणे ओळखून ट्रान्सक्रिप्ट लिहिते.', 'नंतर ते मजकुराचे भाषांतर करून सबटायटल्स तयार करते.', 'पाहिल्याबद्दल धन्यवाद, पुढच्या वेळी भेटू.'],
  es: ['Bienvenidos a nuestro canal.', 'Hoy vamos a mostrarte cómo funciona la traducción de video.', 'Primero, sube tu video y elige un idioma.', 'El sistema detecta el habla y escribe una transcripción.', 'Luego traduce el texto y crea los subtítulos.', 'Gracias por ver, y nos vemos en el próximo.'],
  fr: ['Bienvenue sur notre chaîne.', "Aujourd'hui, nous allons vous montrer comment fonctionne la traduction vidéo.", "D'abord, importez votre vidéo et choisissez une langue.", 'Le système détecte la parole et écrit une transcription.', 'Ensuite, il traduit le texte et crée les sous-titres.', 'Merci de votre attention, à la prochaine.'],
  ja: ['私たちのチャンネルへようこそ。', '今日は動画翻訳の仕組みをご紹介します。', 'まず、動画をアップロードして言語を選びます。', 'システムが音声を検出して文字起こしを作成します。', '次にテキストを翻訳し、字幕を作成します。', 'ご視聴ありがとうございました。また次回。'],
};

export function demoTranslate(target) {
  const list = DEMO_TRANSLATIONS[target];
  return DEMO_SEGMENTS.map((s, i) => ({ ...s, translated: list ? list[i] : `[Demo · ${target}] ${s.text}` }));
}
