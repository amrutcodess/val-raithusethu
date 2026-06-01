import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useNavigate } from 'react-router-dom';

export const LanguageSelector = () => {
  const { setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleLanguageSelect = (code: 'en' | 'te' | 'hi') => {
    setLanguage(code);
    navigate('/home');
  };

  const languages = [
    { code: 'en' as const, name: 'English', flag: '🇬🇧' },
    { code: 'te' as const, name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'hi' as const, name: 'हिंदी', flag: '🇮🇳' },
  ];

  return (
    <div className="min-h-screen bg-app-landing flex items-center justify-center p-4 relative z-0">
      <Card className="w-full max-w-2xl p-8 md:p-12 shadow-agricultural animate-fade-in border-none bg-card/95 backdrop-blur-sm rounded-[2rem] relative z-10">
        <div className="flex flex-col items-center gap-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-gradient-primary leading-tight pb-2">
              {t('appTitle')}
            </h1>
            <p className="text-xl text-muted-foreground font-medium">{t('selectLanguage')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full mt-4">
            {languages.map((lang) => (
              <Button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                variant="outline"
                className="h-32 flex flex-col items-center justify-center gap-3 text-lg hover:bg-primary/10 hover:text-primary transition-all duration-300 border-none bg-background shadow-sm rounded-3xl"
              >
                <span className="text-4xl">{lang.code.toUpperCase()}</span>
                <span className="font-semibold">{lang.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};