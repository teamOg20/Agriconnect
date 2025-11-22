import i18n from '@/i18n/config';

/**
 * Translation helper utilities for dynamic content
 * Provides consistent translation for crops, locations, status labels, etc.
 */

// Crop name translation mapping
const CROP_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    'Wheat': 'Wheat',
    'Rice': 'Rice',
    'Basmati Rice': 'Basmati Rice',
    'Maize': 'Maize',
    'Tomatoes': 'Tomatoes',
    'Onions': 'Onions',
    'Potatoes': 'Potatoes',
    'Chilies': 'Chilies',
    'Grapes': 'Grapes',
    'Pomegranate': 'Pomegranate',
    'Sugarcane': 'Sugarcane',
    'Mustard': 'Mustard',
    'Soybeans': 'Soybeans',
    'Pulses': 'Pulses',
    'Spices': 'Spices',
  },
  hi: {
    'Wheat': 'गेहूँ',
    'Rice': 'चावल',
    'Basmati Rice': 'बासमती चावल',
    'Maize': 'मक्का',
    'Tomatoes': 'टमाटर',
    'Onions': 'प्याज',
    'Potatoes': 'आलू',
    'Chilies': 'मिर्च',
    'Grapes': 'अंगूर',
    'Pomegranate': 'अनार',
    'Sugarcane': 'गन्ना',
    'Mustard': 'सरसों',
    'Soybeans': 'सोयाबीन',
    'Pulses': 'दालें',
    'Spices': 'मसाले',
  },
  ta: {
    'Wheat': 'கோதுமை',
    'Rice': 'அரிசி',
    'Basmati Rice': 'பாஸ்மதி அரிசி',
    'Maize': 'மக்காச்சோளம்',
    'Tomatoes': 'தக்காளி',
    'Onions': 'வெங்காயம்',
    'Potatoes': 'உருளைக்கிழங்கு',
    'Chilies': 'மிளகாய்',
    'Grapes': 'திராட்சை',
    'Pomegranate': 'மாதுளை',
    'Sugarcane': 'கரும்பு',
    'Mustard': 'கடுகு',
    'Soybeans': 'சோயாபீன்ஸ்',
    'Pulses': 'பருப்பு வகைகள்',
    'Spices': 'மசாலா',
  },
  te: {
    'Wheat': 'గోధుమలు',
    'Rice': 'బియ్యం',
    'Basmati Rice': 'బాస్మతీ బియ్యం',
    'Maize': 'మొక్కజొన్న',
    'Tomatoes': 'టమోటాలు',
    'Onions': 'ఉల్లిపాయలు',
    'Potatoes': 'బంగాళాదుంపలు',
    'Chilies': 'మిరపకాయలు',
    'Grapes': 'ద్రాక్ష',
    'Pomegranate': 'దానిమ్మ',
    'Sugarcane': 'చెరకు',
    'Mustard': 'ఆవాలు',
    'Soybeans': 'సోయాబీన్స్',
    'Pulses': 'పప్పుధాన్యాలు',
    'Spices': 'మసాలా దినుసులు',
  },
};

// Location/State translation mapping
const LOCATION_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    'All': 'All',
    'Punjab': 'Punjab',
    'Haryana': 'Haryana',
    'Maharashtra': 'Maharashtra',
    'Madhya Pradesh': 'Madhya Pradesh',
    'Karnataka': 'Karnataka',
    'UP': 'UP',
    'Uttar Pradesh': 'Uttar Pradesh',
    'Himachal': 'Himachal',
    'Himachal Pradesh': 'Himachal Pradesh',
    'Rajasthan': 'Rajasthan',
    'Tamil Nadu': 'Tamil Nadu',
    'Ludhiana': 'Ludhiana',
    'Nashik': 'Nashik',
    'Varanasi': 'Varanasi',
  },
  hi: {
    'All': 'सभी',
    'Punjab': 'पंजाब',
    'Haryana': 'हरियाणा',
    'Maharashtra': 'महाराष्ट्र',
    'Madhya Pradesh': 'मध्य प्रदेश',
    'Karnataka': 'कर्नाटक',
    'UP': 'उत्तर प्रदेश',
    'Uttar Pradesh': 'उत्तर प्रदेश',
    'Himachal': 'हिमाचल',
    'Himachal Pradesh': 'हिमाचल प्रदेश',
    'Rajasthan': 'राजस्थान',
    'Tamil Nadu': 'तमिल नाडु',
    'Ludhiana': 'लुधियाना',
    'Nashik': 'नासिक',
    'Varanasi': 'वाराणसी',
  },
  ta: {
    'All': 'அனைத்தும்',
    'Punjab': 'பஞ்சாப்',
    'Haryana': 'ஹரியானா',
    'Maharashtra': 'மகாராஷ்டிரா',
    'Madhya Pradesh': 'மத்திய பிரதேசம்',
    'Karnataka': 'கர்நாடகா',
    'UP': 'உத்தரபிரதேசம்',
    'Uttar Pradesh': 'உத்தரபிரதேசம்',
    'Himachal': 'இமாச்சல்',
    'Himachal Pradesh': 'இமாச்சல பிரதேசம்',
    'Rajasthan': 'ராஜஸ்தான்',
    'Tamil Nadu': 'தமிழ்நாடு',
    'Ludhiana': 'லூதியானா',
    'Nashik': 'நாசிக்',
    'Varanasi': 'வாரணாசி',
  },
  te: {
    'All': 'అన్నీ',
    'Punjab': 'పంజాబ్',
    'Haryana': 'హర్యానా',
    'Maharashtra': 'మహారాష్ట్ర',
    'Madhya Pradesh': 'మధ్యప్రదేశ్',
    'Karnataka': 'కర్ణాటక',
    'UP': 'ఉత్తరప్రదేశ్',
    'Uttar Pradesh': 'ఉత్తరప్రదేశ్',
    'Himachal': 'హిమాచల్',
    'Himachal Pradesh': 'హిమాచల్ ప్రదేశ్',
    'Rajasthan': 'రాజస్థాన్',
    'Tamil Nadu': 'తమిళనాడు',
    'Ludhiana': 'లూధియానా',
    'Nashik': 'నాసిక్',
    'Varanasi': 'వారాణసి',
  },
};

// Status label translation mapping
const STATUS_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    'Verified': 'Verified',
    'Pending': 'Pending',
    'Available': 'Available',
    'Out of Stock': 'Out of Stock',
    'In Stock': 'In Stock',
    'Delivered': 'Delivered',
    'Processing': 'Processing',
    'Shipped': 'Shipped',
    'Cancelled': 'Cancelled',
  },
  hi: {
    'Verified': 'सत्यापित',
    'Pending': 'लंबित',
    'Available': 'उपलब्ध',
    'Out of Stock': 'स्टॉक में नहीं',
    'In Stock': 'स्टॉक में',
    'Delivered': 'वितरित',
    'Processing': 'प्रसंस्करण',
    'Shipped': 'भेज दिया गया',
    'Cancelled': 'रद्द',
  },
  ta: {
    'Verified': 'சரிபார்க்கப்பட்டது',
    'Pending': 'நிலுவையில்',
    'Available': 'கிடைக்கிறது',
    'Out of Stock': 'சரக்கு இல்லை',
    'In Stock': 'சரக்கு உள்ளது',
    'Delivered': 'வழங்கப்பட்டது',
    'Processing': 'செயலாக்கம்',
    'Shipped': 'அனுப்பப்பட்டது',
    'Cancelled': 'ரத்துசெய்யப்பட்டது',
  },
  te: {
    'Verified': 'ధృవీకరించబడింది',
    'Pending': 'పెండింగ్‌లో ఉంది',
    'Available': 'అందుబాటులో ఉంది',
    'Out of Stock': 'స్టాక్‌లో లేదు',
    'In Stock': 'స్టాక్‌లో ఉంది',
    'Delivered': 'డెలివరీ చేయబడింది',
    'Processing': 'ప్రాసెస్ చేస్తోంది',
    'Shipped': 'రవాణా చేయబడింది',
    'Cancelled': 'రద్దు చేయబడింది',
  },
};

/**
 * Translate a crop name to the current language
 */
export const translateCrop = (cropName: string): string => {
  const currentLang = i18n.language || 'en';
  const langMap = CROP_TRANSLATIONS[currentLang] || CROP_TRANSLATIONS['en'];
  return langMap[cropName] || cropName;
};

/**
 * Translate a location/state name to the current language
 */
export const translateLocation = (location: string): string => {
  const currentLang = i18n.language || 'en';
  const langMap = LOCATION_TRANSLATIONS[currentLang] || LOCATION_TRANSLATIONS['en'];
  return langMap[location] || location;
};

/**
 * Translate a status label to the current language
 */
export const translateStatus = (status: string): string => {
  const currentLang = i18n.language || 'en';
  const langMap = STATUS_TRANSLATIONS[currentLang] || STATUS_TRANSLATIONS['en'];
  return langMap[status] || status;
};

/**
 * Translate an array of crop names
 */
export const translateCrops = (crops: string[]): string[] => {
  return crops.map(crop => translateCrop(crop));
};

/**
 * Get all available crops in current language
 */
export const getAvailableCrops = (): string[] => {
  const currentLang = i18n.language || 'en';
  const langMap = CROP_TRANSLATIONS[currentLang] || CROP_TRANSLATIONS['en'];
  return Object.values(langMap);
};

/**
 * Get all available locations in current language
 */
export const getAvailableLocations = (): string[] => {
  const currentLang = i18n.language || 'en';
  const langMap = LOCATION_TRANSLATIONS[currentLang] || LOCATION_TRANSLATIONS['en'];
  return Object.values(langMap);
};

/**
 * Get current language
 */
export const getCurrentLanguage = (): string => {
  return i18n.language || 'en';
};

/**
 * Change language globally
 */
export const changeLanguage = (lang: string): void => {
  i18n.changeLanguage(lang);
};
