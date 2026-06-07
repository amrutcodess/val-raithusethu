export const stageNames: Record<string, Record<string, string>> = {
  te: {
    'All Stages': 'అన్ని దశలు',
    'Nursery': 'నారుమడి',
    'Seed Treatment': 'విత్తన శుద్ధి',
    'Transplanted': 'నాట్లు వేసిన',
    'Direct Seeded': 'నేరుగా విత్తిన',
    'Transplanted & Direct Seeded': 'నాట్లు వేసిన & నేరుగా విత్తిన',
    'Nursery (10-12 DAS)': 'నారుమడి (విత్తిన 10-12 రోజుల తరువాత)',
    'Direct seeded (10-15 DAS)': 'నేరుగా విత్తిన (విత్తిన 10-15 రోజుల తరువాత)',
    'Transplanted (10-14 DAP)': 'నాట్లు వేసిన (నాటిన 10-14 రోజుల తరువాత)',
    'Transplanted (Pre-emergence application - 3 DAT)': 'నాట్లు వేసిన (నాటిన 3 రోజుల లోపు)',
  },
  hi: {
    'All Stages': 'सभी चरण',
    'Nursery': 'नर्सरी',
    'Seed Treatment': 'बीज उपचार',
    'Transplanted': 'रोपित',
    'Direct Seeded': 'सीधी बुआई',
    'Transplanted & Direct Seeded': 'रोपित और सीधी बुआई',
    'Nursery (10-12 DAS)': 'नर्सरी (बुआई के 10-12 दिन बाद)',
    'Direct seeded (10-15 DAS)': 'सीधी बुआई (बुआई के 10-15 दिन बाद)',
    'Transplanted (10-14 DAP)': 'रोपित (रोपरोपण के 10-14 दिन बाद)',
    'Transplanted (Pre-emergence application - 3 DAT)': 'रोपित (रोपरोपण के 3 दिन के भीतर)',
  }
};

export function translateStage(stage: string | undefined | null, lang: string): string {
  if (!stage) return '';
  const cleanStage = stage.trim();
  if (lang === 'te') {
    return stageNames.te[cleanStage] || cleanStage;
  }
  if (lang === 'hi') {
    return stageNames.hi[cleanStage] || cleanStage;
  }
  return cleanStage;
}

export function translateStageHeader(stage: string | undefined | null, lang: string): string {
  if (!stage) return '';
  const cleanStage = stage.trim();
  if (cleanStage === 'All Stages') {
    return lang === 'te' ? 'అన్ని దశలు' : lang === 'hi' ? 'सभी चरण' : 'All Stages';
  }
  
  const translated = translateStage(cleanStage, lang);
  if (lang === 'te') {
    return `${translated} దశ`;
  }
  if (lang === 'hi') {
    return `${translated} चरण`;
  }
  return `${cleanStage} Stage`;
}
