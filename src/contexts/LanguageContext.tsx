import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'te' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    appTitle: 'Vinuthna Agrochemicals',
    appSubtitle: '',
    selectLanguage: 'Select Language',
    english: 'English',
    telugu: 'తెలుగు',
    hindi: 'हिंदी',
    startDiagnosis: 'Start Diagnosis',
    aboutUs: 'About Vinuthna Agro',
    loginManager: 'Login as Manager',
    loginAdmin: 'Login as Admin',
    selectCrop: 'Select Your Crop',
    selectProblem: 'Select Problem',
    recommendedProducts: 'Recommended Products',
    enterAcres: 'Enter Number of Acres',
    generatePlan: 'Generate Treatment Plan',
    treatmentPlan: 'Treatment Plan',
    crop: 'Crop',
    problem: 'Problem',
    product: 'Product',
    acres: 'Acres',
    dosagePerAcre: 'Dosage per Acre',
    totalDosage: 'Total Required Dosage',
    packSizes: 'Pack Sizes Available',
    recommendedPack: 'Recommended Pack Size',
    packsNeeded: 'packs needed',
    sprayInterval: 'Spray Interval',
    safetyNotes: 'Safety Notes',
    downloadPDF: 'Download PDF',
    shareWhatsApp: 'Share on WhatsApp',
    backToHome: 'Back to Home',
    select: 'Select',
    home: 'Home',
    scientificFormula: 'Scientific Formula',
    modeOfAction: 'Mode of Action',
    features: 'Features',
    targetPests: 'Target Pests',
    targetDiseases: 'Target Diseases',
    targetWeeds: 'Target Weeds',
  },
  te: {
    appTitle: 'వినుత్న ఆగ్రోకెమికల్స్',
    appSubtitle: '',
    selectLanguage: 'భాషను ఎంచుకోండి',
    english: 'English',
    telugu: 'తెలుగు',
    hindi: 'हिंदी',
    startDiagnosis: 'రోగ నిర్ధారణ ప్రారంభించండి',
    aboutUs: 'వినుత్న అగ్రో గురించి',
    loginManager: 'మేనేజర్‌గా లాగిన్',
    loginAdmin: 'అడ్మిన్‌గా లాగిన్',
    selectCrop: 'మీ పంటను ఎంచుకోండి',
    selectProblem: 'సమస్యను ఎంచుకోండి',
    recommendedProducts: 'సిఫార్సు చేయబడిన ఉత్పత్తులు',
    enterAcres: 'ఎకరాల సంఖ్యను నమోదు చేయండి',
    generatePlan: 'చికిత్స ప్రణాళిక రూపొందించండి',
    treatmentPlan: 'చికిత్స ప్రణాళిక',
    crop: 'పంట',
    problem: 'సమస్య',
    product: 'ఉత్పత్తి',
    acres: 'ఎకరాలు',
    dosagePerAcre: 'ఎకరానికి మోతాదు',
    totalDosage: 'మొత్తం అవసరమైన మోతాదు',
    packSizes: 'అందుబాటులో ఉన్న ప్యాక్ పరిమాణాలు',
    recommendedPack: 'సిఫార్సు చేయబడిన ప్యాక్ పరిమాణం',
    packsNeeded: 'ప్యాక్‌లు అవసరం',
    sprayInterval: 'స్ప్రే విరామం',
    safetyNotes: 'భద్రతా గమనికలు',
    downloadPDF: 'PDF డౌన్‌లోడ్',
    shareWhatsApp: 'వాట్సాప్‌లో షేర్ చేయండి',
    backToHome: 'హోమ్‌కు తిరిగి వెళ్లండి',
    select: 'ఎంచుకోండి',
    home: 'హోమ్',
    scientificFormula: 'శాస్త్రీయ సూత్రం',
    modeOfAction: 'పని విధానం',
    features: 'లక్షణాలు',
    targetPests: 'లక్ష్య తెగుళ్ళు',
    targetDiseases: 'లక్ష్య వ్యాధులు',
    targetWeeds: 'లక్ష్య కలుపు మొక్కలు',
  },
  hi: {
    appTitle: 'विनुथना एग्रोकेमिकल्स',
    appSubtitle: '',
    selectLanguage: 'भाषा चुनें',
    english: 'English',
    telugu: 'తెలుగు',
    hindi: 'हिंदी',
    startDiagnosis: 'निदान शुरू करें',
    aboutUs: 'विनुथना एग्रो के बारे में',
    loginManager: 'प्रबंधक के रूप में लॉगिन',
    loginAdmin: 'व्यवस्थापक के रूप में लॉगिन',
    selectCrop: 'अपनी फसल चुनें',
    selectProblem: 'समस्या चुनें',
    recommendedProducts: 'अनुशंसित उत्पाद',
    enterAcres: 'एकड़ की संख्या दर्ज करें',
    generatePlan: 'उपचार योजना बनाएं',
    treatmentPlan: 'उपचार योजना',
    crop: 'फसल',
    problem: 'समस्या',
    product: 'उत्पाद',
    acres: 'एकड़',
    dosagePerAcre: 'प्रति एकड़ खुराक',
    totalDosage: 'कुल आवश्यक खुराक',
    packSizes: 'उपलब्ध पैक आकार',
    recommendedPack: 'अनुशंसित पैक आकार',
    packsNeeded: 'पैक की आवश्यकता',
    sprayInterval: 'स्प्रे अंतराल',
    safetyNotes: 'सुरक्षा नोट्स',
    downloadPDF: 'PDF डाउनलोड करें',
    shareWhatsApp: 'व्हाट्सएप पर शेयर करें',
    backToHome: 'होम पर वापस',
    select: 'चुनें',
    home: 'होम',
    scientificFormula: 'वैज्ञानिक सूत्र',
    modeOfAction: 'क्रिया विधि',
    features: 'विशेषताएं',
    targetPests: 'लक्ष्य कीट',
    targetDiseases: 'लक्ष्य रोग',
    targetWeeds: 'लक्ष्य खरपतवार',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Initialize from localStorage if available
    const saved = localStorage.getItem('vinuthna-language');
    return (saved as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('vinuthna-language', lang);
  };

  // Sync with localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('vinuthna-language');
    if (saved && ['en', 'te', 'hi'].includes(saved)) {
      setLanguageState(saved as Language);
    }
  }, []);

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
