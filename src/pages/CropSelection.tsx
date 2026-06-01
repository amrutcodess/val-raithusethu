import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Leaf, Sprout } from 'lucide-react';
import { Crop } from '@/types/app';
import { toast } from 'sonner';
import { HomeButton } from '@/components/HomeButton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';

// Helper to get high-quality Unsplash images for common crops
const getCropImage = (crop: Crop) => {
  const nameEn = crop.name_en?.toLowerCase() || '';
  if (crop.image_url && crop.image_url.startsWith('http')) return crop.image_url;
  
  const mappings: Record<string, string> = {
    'rice': 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?q=80&w=800&auto=format&fit=crop',
    'cotton': 'https://images.unsplash.com/photo-1594904351111-a072f80b1a71?q=80&w=800&auto=format&fit=crop',
    'chilli': 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?q=80&w=800&auto=format&fit=crop',
    'maize': 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?q=80&w=800&auto=format&fit=crop',
    'tobacco': 'https://images.unsplash.com/photo-1565345717387-54859a1645e5?q=80&w=800&auto=format&fit=crop',
    'groundnut': 'https://images.unsplash.com/photo-1599307734125-9f583d3d9997?q=80&w=800&auto=format&fit=crop',
    'turmeric': 'https://images.unsplash.com/photo-1615485290382-441e4d019cb0?q=80&w=800&auto=format&fit=crop'
  };

  return mappings[nameEn] || 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=800&auto=format&fit=crop';
};

const CropSelection = () => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);

  // Stage Selection State
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [stages, setStages] = useState<string[]>([]);
  const [loadingStages, setLoadingStages] = useState(false);

  useEffect(() => {
    const fetchCrops = async () => {
      try {
        const { data, error } = await supabase
          .from('crops')
          .select('*');

        if (error) throw error;
        
        // Define priority crops in desired order
        const priorityCropNames = ['Rice', 'Cotton', 'Chilli', 'Maize', 'Soya', 'Black gram'];
        
        // Sort crops to put priority crops at the top
        const sortedCrops = [...(data || [])].sort((a, b) => {
          const aIndex = priorityCropNames.findIndex(name => 
            a.name_en?.toLowerCase() === name.toLowerCase()
          );
          const bIndex = priorityCropNames.findIndex(name => 
            b.name_en?.toLowerCase() === name.toLowerCase()
          );
          
          // If both are in priority list, sort by priority order
          if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
          // If only a is in priority list, put it first
          if (aIndex !== -1) return -1;
          // If only b is in priority list, put it first
          if (bIndex !== -1) return 1;
          // Otherwise, maintain original order
          return 0;
        });
        
        setCrops(sortedCrops);
      } catch (error) {
        console.error('Error fetching crops:', error);
        toast.error('Failed to load crops');
      } finally {
        setLoading(false);
      }
    };

    fetchCrops();
  }, []);

  const handleCropClick = async (crop: Crop) => {
    setLoadingStages(true);
    try {
      const { data, error } = await supabase
        .from('product_mappings' as any)
        .select('stage')
        .eq('crop_id', crop.id)
        .not('stage', 'is', null);

      if (error) {
        navigate(`/problems/${crop.id}`, { state: { crop } });
        return;
      }

      const rawStages = (data as any[]) || [];
      const uniqueStages = Array.from(new Set(
        rawStages
          .map((item: any) => item.stage)
          .filter((s): s is string => !!s && typeof s === 'string' && s.trim() !== '' && s !== 'All Stages')
      )).sort();

      if (uniqueStages.length > 0) {
        setSelectedCrop(crop);
        setStages(['All Stages', ...uniqueStages]);
        setStageDialogOpen(true);
      } else {
        navigate(`/problems/${crop.id}`, { state: { crop } });
      }

    } catch (error) {
      console.error("Error checking stages:", error);
      navigate(`/problems/${crop.id}`, { state: { crop } });
    } finally {
      setLoadingStages(false);
    }
  };

  const handleStageSelect = (stage: string) => {
    if (!selectedCrop) return;
    setStageDialogOpen(false);
    navigate(`/problems/${selectedCrop.id}`, {
      state: {
        crop: selectedCrop,
        stage: stage
      }
    });
  };

  const getCropName = (crop: Crop) => {
    if (language === 'te') return crop.name_te;
    if (language === 'hi') return crop.name_hi;
    return crop.name_en;
  };

  return (
    <div className="min-h-screen bg-crops-selection flex flex-col relative text-white">
      <HomeButton />
      <div className="absolute inset-0 bg-black/50 z-0"></div> 

      <div className="container mx-auto px-4 py-12 pt-16 flex-1 relative z-10">
        <div className="text-center mb-12 animate-fade-in px-2">
          <h1 className="text-5xl md:text-7xl font-display font-black text-[#4ADE80] mb-6 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
            {t('selectCrop')}
          </h1>
          <p className="text-xl md:text-2xl text-white font-medium max-w-2xl mx-auto drop-shadow-md">
            Choose your crop to start the health check
          </p>
        </div>

        {loading ? (
          <div className="text-center text-3xl text-[#4ADE80] mt-20 font-bold animate-pulse">
            Loading Crops...
          </div>
        ) : crops.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 max-w-7xl mx-auto">
            {crops.map((crop) => (
              <Card
                key={crop.id}
                className="group relative overflow-hidden rounded-[2.5rem] border-2 border-[#D97706]/50 bg-[#D97706] hover:bg-[#B45309] transition-all duration-500 shadow-2xl cursor-pointer animate-fade-in aspect-[4/5]"
                onClick={() => handleCropClick(crop)}
              >
                <div className="absolute inset-0">
                  <img
                    src={crop.image_url || getCropImage(crop)}
                    alt={language === 'te' ? crop.name_te : language === 'hi' ? crop.name_hi : crop.name_en}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent group-hover:from-black/95 transition-all duration-500"></div>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 flex flex-col items-center text-center">
                  <h3 className="text-2xl md:text-4xl font-display font-black text-white mb-2 tracking-tight drop-shadow-lg">
                    {language === 'te' ? crop.name_te : language === 'hi' ? crop.name_hi : crop.name_en}
                  </h3>
                  <div className="h-1.5 w-16 bg-white/50 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-12 bg-white/10 backdrop-blur-md rounded-[2.5rem] border border-white/20">
            <p className="text-2xl font-bold">No crops found.</p>
          </div>
        )}

        {/* Stage Selection Dialog */}
        <Dialog open={stageDialogOpen} onOpenChange={setStageDialogOpen}>
          <DialogContent className="sm:max-w-md bg-[#FDFBF7] border-none rounded-[2rem] p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-3xl text-center font-display font-bold text-[#1B4332]">
                Select Growth Stage
              </DialogTitle>
              <DialogDescription className="text-center text-[#405D4E] text-lg">
                Which stage is your {selectedCrop ? getCropName(selectedCrop) : ''} in?
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {stages.map((stage, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="lg"
                  className="w-full text-xl justify-start gap-4 border-none bg-[#E8F5E9] text-[#1B4332] hover:bg-[#2E7D32] hover:text-white transition-all duration-300 rounded-2xl h-16 shadow-sm"
                  onClick={() => handleStageSelect(stage)}
                >
                  <div className="bg-white/50 p-2 rounded-xl">
                    <Sprout className="w-6 h-6" />
                  </div>
                  {stage}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CropSelection;