import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Package, Calculator, Sprout } from 'lucide-react';
import { ProductMapping, Problem, Crop } from '@/types/app';
import { toast } from 'sonner';
import { HomeButton } from '@/components/HomeButton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { translateStageHeader } from '@/lib/translations';

const ProductRecommendation = () => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const { problemId } = useParams<{ problemId: string }>();
  const location = useLocation();

  const crop = (location.state as any)?.crop as Crop | undefined;
  const problem = (location.state as any)?.problem as Problem | undefined;
  const problems = (location.state as any)?.problems as Problem[] | undefined;
  const stage = (location.state as any)?.stage as string | undefined;

  const [mappings, setMappings] = useState<ProductMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendationType, setRecommendationType] = useState<'single' | 'common' | 'individual'>('single');
  
  const [selectedMapping, setSelectedMapping] = useState<ProductMapping | null>(null);
  const [acres, setAcres] = useState('');
  const [showAcresDialog, setShowAcresDialog] = useState(false);

  useEffect(() => {
    if (!problemId) {
      toast.error('Invalid problem selection');
      navigate('/');
      return;
    }

    const fetchProducts = async () => {
      try {
        const problemIds = problemId.split(',');
        let query = supabase
          .from('product_mappings' as any) 
          .select(`
            *,
            products (
              id,
              name,
              image_url,
              scientific_formula,
              pack_sizes
            )
          `)
          .in('problem_id', problemIds);

        if (stage && stage !== 'All Stages') {
          query = query.eq('stage', stage);
        }

        const { data, error } = await query;

        if (error) throw error;

        const rawMappings = (data as unknown as ProductMapping[]) || [];
        
        if (problemIds.length > 1) {
          // Group by product id
          const productGroups = new Map<string, ProductMapping[]>();
          rawMappings.forEach(m => {
            const prodId = m.products.id;
            if (!productGroups.has(prodId)) {
              productGroups.set(prodId, []);
            }
            productGroups.get(prodId)!.push(m);
          });
          
          const commonList: ProductMapping[] = [];
          const individualList: ProductMapping[] = [];
          
          for (const [prodId, list] of productGroups.entries()) {
            const uniqueProblems = new Set(list.map(m => m.problem_id));
            const treatsAll = problemIds.every(id => uniqueProblems.has(id));
            
            const primaryMapping = list[0];
            
            if (treatsAll) {
              commonList.push({
                ...primaryMapping,
                isCommon: true
              } as any);
            }
            
            individualList.push({
              ...primaryMapping,
              isCommon: treatsAll
            } as any);
          }
          
          if (commonList.length > 0) {
            setMappings(commonList);
            setRecommendationType('common');
          } else {
            setMappings(individualList);
            setRecommendationType('individual');
          }
        } else {
          setMappings(rawMappings);
          setRecommendationType('single');
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [problemId, navigate]);

  const handleProductSelect = (mapping: ProductMapping) => {
    setSelectedMapping(mapping);
    setShowAcresDialog(true);
  };

  const handleGeneratePlan = async () => {
    if (!acres || Number(acres) <= 0) {
      toast.error('Enter valid acres');
      return;
    }

    if (!selectedMapping) return;

    try {
      const problemIds = problemId?.split(',') || [];
      const insertRows = problemIds.map(id => ({
        crop_id: crop?.id ?? null,
        problem_id: id,
        product_id: selectedMapping.products.id, 
        acres: Number(acres),
        language,
      }));
      if (insertRows.length > 0) {
        await supabase.from('analytics').insert(insertRows);
      }
    } catch {
      // ignore analytics error
    }

    navigate('/treatment-plan', {
      state: {
        crop,
        problem,
        problems,
        product: selectedMapping,
        acres: Number(acres),
      },
    });
  };

  const getProblemTitleText = () => {
    if (problems && problems.length > 0) {
      return problems.map(p => getProblemTitle(p)).join(' + ');
    }
    return getProblemTitle(problem);
  };

  const getCropName = (c?: Crop) =>
    !c ? '—' : language === 'te' ? (c.name_te || c.name_en) : language === 'hi' ? (c.name_hi || c.name_en) : c.name_en;

  const getProblemTitle = (p?: Problem) =>
    !p ? '—' : language === 'te' ? (p.title_te || p.title_en) : language === 'hi' ? (p.title_hi || p.title_en) : p.title_en;

  return (
    <div className="min-h-screen bg-products-selection flex flex-col relative text-white">
      <HomeButton />
      <div className="absolute inset-0 bg-black/40 z-0"></div>

      <div className="container mx-auto px-4 py-12 pt-16 flex-1 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 animate-fade-in">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-white bg-[#7C2D12] hover:bg-[#9A3412] rounded-2xl h-14 px-8 text-xl font-bold border-2 border-[#FB923C]/30 shadow-xl"
          >
            <ArrowLeft className="mr-3 h-6 w-6" />
            {t('selectProblem')}
          </Button>

          <div className="text-center md:text-right space-y-2">
            <p className="text-2xl text-slate-800 font-black drop-shadow-sm">
              {t('crop')}: <span className="text-primary uppercase">{getCropName(crop)}</span>
            </p>
            <p className="text-2xl text-slate-800 font-black drop-shadow-sm">
              {t('problem')}: <span className="text-primary uppercase">{getProblemTitleText()}</span>
            </p>
            {stage && (
              <p className="text-lg text-white font-bold italic bg-white/10 px-4 py-1 rounded-full">
                {translateStageHeader(stage, language)}
              </p>
            )}
          </div>
        </div>

        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-display font-bold text-primary mb-4 drop-shadow-sm">
            {recommendationType === 'common' 
              ? 'Common Solutions' 
              : (recommendationType === 'individual' ? 'Individual Solutions' : t('recommendedProducts'))}
          </h1>
          <p className="text-lg md:text-xl text-slate-700 max-w-2xl mx-auto font-medium">
            {recommendationType === 'common'
              ? `These products are highly recommended as they treat all selected issues: ${getProblemTitleText()}`
              : (recommendationType === 'individual' 
                  ? 'No single product treats all selected issues. Displaying all individual products.' 
                  : 'Choose the best solution for your crop\'s health')}
          </p>
        </div>

        {loading ? (
          <div className="text-center text-2xl text-white/80 mt-20">
            <span className="animate-pulse">Fetching solutions...</span>
          </div>
        ) : mappings.length === 0 ? (
          <div className="text-center p-12 bg-white/10 backdrop-blur-md rounded-[2rem] border border-white/20 max-w-2xl mx-auto">
            <p className="text-2xl font-display font-medium">
              {language === 'te' 
                ? 'ఈ దశలో ఈ సమస్యకు ఎటువంటి ఉత్పత్తులు అందుబాటులో లేవు.' 
                : language === 'hi' 
                  ? 'इस चरण में इस समस्या के लिए कोई उत्पाद उपलब्ध नहीं हैं।' 
                  : 'No products available for this problem at this stage.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {mappings.map((mapping) => {
              const product = mapping.products;
              const isCommon = (mapping as any).isCommon;
              
              return (
                <Card key={mapping.id} className={`group overflow-hidden rounded-[2rem] border-2 bg-[#D97706] hover:bg-[#B45309] transition-all duration-500 shadow-xl hover:shadow-2xl animate-fade-in flex flex-col h-full ${
                  isCommon ? 'border-green-500 ring-2 ring-green-500/20' : 'border-[#D97706]/50'
                }`}>
                  <div className="aspect-video w-full overflow-hidden relative bg-slate-100">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                        <Package className="w-20 h-20 text-[#FB923C]" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <div className="absolute bottom-4 left-6 flex flex-wrap gap-2">
                      <span className="bg-[#B45309] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                        Effective Formula
                      </span>
                      {isCommon && (
                        <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                          Common Solution
                        </span>
                      )}
                    </div>
                  </div>

                    <div className="p-8 md:p-10 flex-1 flex flex-col">
                    <h3 className="text-4xl md:text-5xl font-display font-black text-white mb-8 leading-[1.1]">
                      {product.name}
                    </h3>

                    <div className="space-y-6 mb-10 text-white/90">
                      <div className="flex items-start gap-4 p-4 bg-[#B45309]/50 rounded-2xl border border-[#B45309]">
                        <div className="bg-white/20 p-3 rounded-xl mt-1">
                          <Sprout className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm uppercase text-white/70 font-bold tracking-widest mb-1">{t('dosagePerAcre')}</p>
                          <p className="text-2xl font-black leading-tight text-white">
                            {(() => {
                              const min = mapping.dosage_min !== null && mapping.dosage_min !== undefined ? Number(mapping.dosage_min) : 0;
                              const max = mapping.dosage_max !== null && mapping.dosage_max !== undefined ? Number(mapping.dosage_max) : 0;
                              const avg = min > 0 || max > 0 ? (min + max) / 2 : 0;
                              return avg > 0 ? `${avg} ${mapping.dosage_unit || 'ml'}` : mapping.dosage_recommendation || '—';
                            })()}
                          </p>
                        </div>
                      </div>

                      {mapping.spray_interval && (
                        <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                          <div className="bg-[#FB923C] p-3 rounded-xl mt-1 shadow-[0_0_15px_rgba(251,146,60,0.3)]">
                            <Calculator className="w-6 h-6 text-[#7C2D12]" />
                          </div>
                          <div>
                            <p className="text-sm uppercase text-[#FB923C] font-black tracking-widest mb-1">{t('sprayInterval')}</p>
                            <p className="text-2xl font-black leading-tight">{mapping.spray_interval}</p>
                          </div>
                        </div>
                      )}

                      {mapping.safety_notes && (
                        <div className="mt-4 p-6 bg-red-50 rounded-3xl border border-red-100">
                          <p className="text-sm uppercase text-red-600 font-bold tracking-widest mb-2">Safety Notes</p>
                          <p className="text-lg text-red-800 font-medium italic leading-relaxed">{mapping.safety_notes}</p>
                        </div>
                      )}
                    </div>

                    <Button 
                      className="w-full h-14 mt-auto rounded-2xl font-bold text-xl bg-[#B45309] text-white hover:bg-[#92400E] transition-all shadow-md" 
                      onClick={() => handleProductSelect(mapping)}
                    >
                      {t('select')}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={showAcresDialog} onOpenChange={setShowAcresDialog}>
        <DialogContent className="sm:max-w-md bg-[#FDFBF7] border-none rounded-[2.5rem] p-10 overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-2 bg-[#FB923C]"></div>
          <DialogHeader className="mb-8">
            <DialogTitle className="text-3xl font-display font-bold text-[#7C2D12] flex items-center gap-3">
              <div className="bg-[#FB923C]/10 p-2 rounded-xl">
                <Calculator className="h-8 w-8 text-[#EA580C]" />
              </div>
              {t('enterAcres')}
            </DialogTitle>
            <DialogDescription className="text-lg text-[#8C6D58] mt-2">
              Calculate precisely for: <span className="font-bold text-[#7C2D12]">{selectedMapping?.products.name}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8">
            <div className="relative group">
              <Input
                type="number"
                step="0.1"
                min="0"
                value={acres}
                onChange={(e) => setAcres(e.target.value)}
                className="h-20 rounded-2xl text-3xl font-bold bg-[#FFEDD5] border-none text-[#7C2D12] focus-visible:ring-4 focus-visible:ring-[#FB923C] px-8 pl-14 transition-all"
                placeholder="0.0"
              />
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-[#EA580C]/50">#</span>
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-lg font-bold text-[#EA580C]">Acres</span>
            </div>

            <Button 
              onClick={handleGeneratePlan} 
              size="lg" 
              className="w-full h-16 rounded-2xl text-xl font-bold bg-[#EA580C] hover:bg-[#7C2D12] text-white shadow-xl shadow-[#EA580C]/20 transition-all transform active:scale-95"
            >
              {t('generatePlan')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductRecommendation;