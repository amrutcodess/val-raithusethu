import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HomeButtonProps {
  className?: string;
}

export const HomeButton = ({ className = '' }: HomeButtonProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-background ${className}`}
      onClick={() => navigate('/')}
    >
      <Home className="h-4 w-4 mr-2" />
      {t('home')}
    </Button>
  );
};
