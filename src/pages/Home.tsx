import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sprout, FileText, LogIn, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HomeButton } from '@/components/HomeButton';

const Home = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-app-landing flex flex-col relative">
      <HomeButton />
      {/* Overlay for better readability if the background image is too bright, though the css gradient already helps */}
      <div className="absolute inset-0 bg-black/10 z-0"></div>
      
      <div className="container mx-auto px-4 py-12 pt-16 flex-1 flex flex-col justify-center relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 mb-10 animate-fade-in">
          {/* Using a placeholder for the logo rim from the mockup, assuming the image is just the leaf */}
          <div className="bg-white rounded-full p-2 shadow-xl mb-2 flex items-center justify-center border-4 border-secondary">
            <img
              src="/logo.png"
              alt="Vinuthna Agrochemicals Logo"
              className="w-24 h-24 sm:w-32 sm:h-32 object-contain rounded-full"
            />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-primary mb-2 break-words px-4 leading-tight text-center drop-shadow-md">
            Vinuthna Agrochemicals
          </h1>
        </div>

        {/* Main Actions */}
        <div className="max-w-3xl mx-auto w-full space-y-6 mb-12">
          <Card 
            className="px-8 py-6 hover:shadow-agricultural transition-all duration-300 cursor-pointer border-none bg-[#FDFBF7] rounded-[2rem] flex items-center gap-6"
            onClick={() => navigate('/crops')}
          >
            <div className="bg-[#FFEDD5] p-5 rounded-2xl flex-shrink-0">
              <Sprout className="w-10 h-10 text-[#EA580C]" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#7C2D12] mb-1">{t('startDiagnosis')}</h2>
              <p className="text-[#8C6D58] text-base sm:text-lg">
                Get personalized crop treatment recommendations
              </p>
            </div>
          </Card>

          <Card 
            className="px-8 py-6 hover:shadow-agricultural transition-all duration-300 cursor-pointer border-none bg-[#FDFBF7] rounded-[2rem] flex items-center gap-6"
            onClick={() => navigate('/about')}
          >
            <div className="bg-[#FFEDD5] p-5 rounded-2xl flex-shrink-0">
              <FileText className="w-10 h-10 text-[#EA580C]" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#7C2D12] mb-1">{t('aboutUs')}</h2>
              <p className="text-[#8C6D58] text-base sm:text-lg">
                Learn more about Vinuthna Agro Industries
              </p>
            </div>
          </Card>
        </div>

        {/* Login Options */}
        <div className="max-w-2xl mx-auto w-full mt-auto mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              variant="outline"
              size="lg"
              className="h-16 text-lg border-none bg-[#FDFBF7] text-[#7C2D12] hover:bg-[#FFEDD5] rounded-2xl shadow-md font-semibold"
              onClick={() => navigate('/login/manager')}
            >
              <LogIn className="mr-3 h-5 w-5" />
              {t('loginManager')}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-16 text-lg border-none bg-[#FDFBF7] text-[#7C2D12] hover:bg-[#FFEDD5] rounded-2xl shadow-md font-semibold"
              onClick={() => navigate('/login/admin')}
            >
              <Shield className="mr-3 h-5 w-5" />
              {t('loginAdmin')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;