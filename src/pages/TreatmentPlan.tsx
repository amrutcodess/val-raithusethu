import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Home, Download, Share2, FileCheck, Package, Loader2, Calculator } from 'lucide-react';
import { TreatmentData } from '@/types/app';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { HomeButton } from '@/components/HomeButton';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from '@/contexts/AuthContext';

// --- FONT IMPORTS ---
import teluguFont from '@/assets/fonts/NotoSansTelugu-Regular.base64?raw';
import hindiFont from '@/assets/fonts/NotoSansDevanagari-Regular.base64?raw';

// --- HELPER FUNCTIONS ---

const LOGO_URL = '/logo.png';

// Regex to check if text is purely English/Numbers/Symbols (ASCII)
const isAscii = (str: string) => /^[\x00-\x7F]*$/.test(String(str));

const fetchImageAsBase64 = async (url: string): Promise<{ base64: string; format: string; width: number; height: number } | null> => {
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) return null;

    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('image')) return null;

    let format = 'JPEG';
    if (contentType.includes('png') || url.toLowerCase().endsWith('.png')) {
      format = 'PNG';
    }

    const blob = await res.blob();

    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (result && result.startsWith('data:image')) {
          const img = new Image();
          img.onload = () => {
             resolve({ base64: result, format, width: img.width, height: img.height });
          };
          img.onerror = () => resolve(null);
          img.src = result;
        } else {
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Image fetch failed safely:', error);
    return null;
  }
};

const TreatmentPlan = () => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [farmerName, setFarmerName] = useState('');
  const [farmerMobile, setFarmerMobile] = useState('');
  const [farmerLocation, setFarmerLocation] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!location.state) navigate('/');
  }, [location.state, navigate]);

  if (!location.state) return null;

  const { crop, problem, product, acres } = location.state as TreatmentData;
  const productInfo = product.products; 
  const mappingInfo = product;

  const getCropName = (c: any) =>
    language === 'te' ? c.name_te : language === 'hi' ? c.name_hi : c.name_en;

  const getProblemTitle = (p: any) =>
    language === 'te' ? p.title_te : language === 'hi' ? p.title_hi : p.title_en;

  const totalDosageMin = (mappingInfo.dosage_min || 0) * acres;
  const totalDosageMax = (mappingInfo.dosage_max || 0) * acres;

  const handlePdfClick = () => {
    setShowPdfDialog(true);
  };

  const handleConfirmGenerate = async () => {
    if (!farmerName.trim() || !farmerMobile.trim() || !farmerLocation.trim()) {
      toast.error(t('fillAllFields') || 'Please fill all details');
      return;
    }

    if (farmerMobile.length < 10) {
      toast.error('Please enter a valid mobile number');
      return;
    }

    setIsGenerating(true);

    try {
      const [logoData, cropImg, problemImg, productImg] = await Promise.all([
        fetchImageAsBase64(LOGO_URL),
        crop.image_url ? fetchImageAsBase64(crop.image_url) : Promise.resolve(null),
        problem.image_url ? fetchImageAsBase64(problem.image_url) : Promise.resolve(null),
        productInfo.image_url ? fetchImageAsBase64(productInfo.image_url) : Promise.resolve(null)
      ]);

      const { error: dbError } = await supabase.from('analytics').insert({
        crop_id: crop.id,      
        problem_id: problem.id,
        product_id: productInfo.id, 
        acres: acres,
        language: language,
        farmer_name: farmerName,
        farmer_mobile: farmerMobile,
        farmer_location: farmerLocation
      });

      if (dbError) console.error('DB Log Error:', dbError);

      const doc = new jsPDF({ compress: true });
      const cleanTelugu = teluguFont.replace(/[\n\r\s]/g, '');
      const cleanHindi = hindiFont.replace(/[\n\r\s]/g, '');

      doc.addFileToVFS('NotoSansTelugu.ttf', cleanTelugu);
      doc.addFont('NotoSansTelugu.ttf', 'NotoSansTelugu', 'normal');
      doc.addFileToVFS('NotoSansHindi.ttf', cleanHindi);
      doc.addFont('NotoSansHindi.ttf', 'NotoSansHindi', 'normal');

      const setFontForText = (text: string, preferredStyle: 'normal' | 'bold' = 'normal') => {
        if (isAscii(text)) {
          doc.setFont('Helvetica', preferredStyle);
        } else {
          if (language === 'te') doc.setFont('NotoSansTelugu', 'normal');
          else if (language === 'hi') doc.setFont('NotoSansHindi', 'normal');
          else doc.setFont('Helvetica', preferredStyle);
        }
      };

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      
      if (logoData) {
        doc.addImage(logoData.base64, logoData.format, margin, 10, 25, 25, undefined, 'FAST');
      }
      doc.setFontSize(18);
      doc.setTextColor(40);
      doc.setFont('Helvetica', 'bold');
      doc.text('Vinuthna Agrochemicals – Treatment Plan', pageWidth / 2, 25, { align: 'center' });

      let y = 45;
      doc.setFontSize(10);
      doc.setTextColor(60);
      
      const nameFull = `Name: ${farmerName}`;
      const mobileFull = `Mobile: ${farmerMobile}`;
      
      setFontForText(nameFull, 'normal');
      const nameLines = doc.splitTextToSize(nameFull, pageWidth / 2 - margin);
      doc.text(nameLines, margin, y);
      
      setFontForText(mobileFull, 'normal');
      doc.text(mobileFull, pageWidth - margin, y, { align: 'right' });

      y += (nameLines.length * 6) + 4;

      const locationFull = `Location: ${farmerLocation}`;
      setFontForText(locationFull, 'normal');
      const locationLines = doc.splitTextToSize(locationFull, pageWidth - (margin * 2));
      doc.text(locationLines, margin, y);
      
      y += (locationLines.length * 6) + 4;
      
      doc.setDrawColor(200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10; 

      const IMAGE_HEIGHT = 45; 
      const gap = 5;
      const slotWidth = (pageWidth - (margin * 2) - (gap * 2)) / 3;
      
      const cropX = margin;
      const problemX = margin + slotWidth + gap;
      const productX = margin + (slotWidth + gap) * 2;

      const drawImageInSlot = (img: any, xPos: number, label: string) => {
        if (!img) return;

        const ratio = img.width / img.height;
        let drawHeight = IMAGE_HEIGHT;
        let drawWidth = drawHeight * ratio;

        if (drawWidth > slotWidth) {
          drawWidth = slotWidth;
          drawHeight = drawWidth / ratio;
        }

        const xOffset = xPos + (slotWidth - drawWidth) / 2;
        doc.addImage(img.base64, img.format, xOffset, y, drawWidth, drawHeight, undefined, 'FAST');
        doc.setFontSize(9);
        doc.setTextColor(100);
        setFontForText(label, 'normal');
        doc.text(label, xPos + slotWidth / 2, y + IMAGE_HEIGHT + 5, { align: 'center' });
      };

      drawImageInSlot(cropImg, cropX, t('crop'));
      drawImageInSlot(problemImg, problemX, t('problem'));
      drawImageInSlot(productImg, productX, t('product'));

      y += IMAGE_HEIGHT + 15; 
      doc.setDrawColor(220);
      doc.line(margin, y - 5, pageWidth - margin, y - 5);
      doc.setFontSize(11);
      doc.setTextColor(0);

      const renderRow = (label: string, value: string) => {
        if (y > pageHeight - 30) {
          doc.addPage();
          y = 20;
        }
        setFontForText(label, 'normal');
        doc.text(label + ':', margin, y);
        const valueX = margin + 45; 
        const maxValWidth = pageWidth - margin - valueX;
        setFontForText(value, 'bold');
        const wrappedText = doc.splitTextToSize(String(value), maxValWidth);
        doc.text(wrappedText, valueX, y);
        y += (wrappedText.length * 6) + 4; 
      };

      renderRow(t('crop'), getCropName(crop));
      renderRow(t('problem'), getProblemTitle(problem));
      renderRow(t('product'), productInfo.name);
      
      if (productInfo.scientific_formula) {
        renderRow('Scientific Formula', productInfo.scientific_formula);
      }
      y += 2;
      renderRow('Acres', String(acres));
      renderRow(t('dosagePerAcre'), mappingInfo.dosage_recommendation);

      const totalReq = totalDosageMin === totalDosageMax
        ? `${totalDosageMin.toFixed(2)}`
        : `${totalDosageMin.toFixed(2)} – ${totalDosageMax.toFixed(2)}`;
      
      renderRow('Total Required', `${totalReq} ${mappingInfo.dosage_unit}`);

      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.setFont('Helvetica', 'normal');
      doc.text('Powered by Vinuthna Agrochemicals', pageWidth / 2, pageHeight - 15, { align: 'center' });
      doc.text('Address: Vinuthna Agro Industries, Telangana', pageWidth / 2, pageHeight - 10, { align: 'center' });

      doc.save(`treatment-${farmerName.replace(/\s+/g, '-')}-${Date.now()}.pdf`);
      toast.success('PDF generated and logged!');
      
      setShowPdfDialog(false);
      setFarmerName('');
      setFarmerMobile('');
      setFarmerLocation('');
    } catch (error) {
      console.error('Process Error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareWhatsApp = () => {
    const msg = `Treatment Plan\nCrop: ${getCropName(crop)}\nProblem: ${getProblemTitle(problem)}\nProduct: ${productInfo.name}\nAcres: ${acres}\nDosage: ${mappingInfo.dosage_recommendation}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-treatment-plan flex flex-col relative text-white">
      <HomeButton />
      <div className="absolute inset-0 bg-black/40 z-0"></div>

      <div className="container mx-auto px-4 py-12 pt-16 flex-1 relative z-10 flex flex-col items-center">
        <div className="text-center mb-10 animate-fade-in">
          <div className="bg-[#4ADE80] p-4 rounded-full inline-block mb-4 shadow-xl">
            <FileCheck className="w-12 h-12 text-[#1B4332]" />
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-white drop-shadow-lg">
            {t('treatmentPlan')}
          </h1>
          <p className="text-[#4ADE80] font-bold text-xl mt-2 tracking-wide uppercase italic">
            Certified Recommendation
          </p>
        </div>

        <Card className="p-8 md:p-12 w-full max-w-5xl border border-slate-200 bg-white rounded-[3rem] shadow-2xl animate-fade-in flex flex-col lg:flex-row gap-12 overflow-hidden relative">
          <div className="flex-shrink-0 w-full lg:w-1/3 flex flex-col items-center lg:items-start gap-6">
            <div className="w-64 h-64 rounded-[2rem] overflow-hidden shadow-xl border-4 border-slate-100 bg-slate-50">
              {productInfo.image_url ? (
                <img src={productInfo.image_url} alt={productInfo.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Package className="w-24 h-24 text-[#4ADE80]" /></div>
              )}
            </div>
            <div className="text-center lg:text-left">
              <h2 className="text-4xl font-display font-bold text-slate-800 mb-2">{productInfo.name}</h2>
              {productInfo.scientific_formula && (
                <p className="text-lg text-slate-500 italic font-medium">{productInfo.scientific_formula}</p>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 bg-black/40 rounded-2xl border border-white/10 shadow-inner">
                <p className="text-xs uppercase text-[#4ADE80] font-black tracking-widest mb-2">{t('crop')}</p>
                <p className="text-2xl font-black font-display text-white">{getCropName(crop)}</p>
              </div>
              <div className="p-6 bg-black/40 rounded-2xl border border-white/10 shadow-inner">
                <p className="text-xs uppercase text-[#4ADE80] font-black tracking-widest mb-2">{t('problem')}</p>
                <p className="text-2xl font-black font-display text-white">{getProblemTitle(problem)}</p>
              </div>
              <div className="p-6 bg-black/40 rounded-2xl border border-white/10 shadow-inner">
                <p className="text-xs uppercase text-[#4ADE80] font-black tracking-widest mb-2">{t('dosagePerAcre')}</p>
                <p className="text-2xl font-black font-display text-white">{mappingInfo.dosage_recommendation}</p>
              </div>
              <div className="p-6 bg-black/40 rounded-2xl border border-white/10 shadow-inner">
                <p className="text-xs uppercase text-[#4ADE80] font-black tracking-widest mb-2">Acres</p>
                <p className="text-2xl font-black font-display text-white">{acres}</p>
              </div>
            </div>

            <div className="p-10 bg-gradient-to-br from-primary to-primary/80 rounded-[2.5rem] border border-primary/20 relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Calculator className="w-24 h-24 text-white" />
              </div>
              <h3 className="font-black text-secondary mb-3 text-2xl tracking-widest uppercase italic">Total Recommended Quantity</h3>
              <p className="text-6xl md:text-8xl font-black font-display text-white drop-shadow-lg">
                {totalDosageMin === totalDosageMax ? `${totalDosageMin.toFixed(2)}` : `${totalDosageMin.toFixed(2)} – ${totalDosageMax.toFixed(2)}`}
                <span className="text-3xl ml-3 text-secondary uppercase opacity-80">{mappingInfo.dosage_unit}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
              <Button onClick={handlePdfClick} className="h-20 rounded-[1.5rem] text-2xl font-black bg-[#4ADE80] text-[#1B4332] hover:bg-white hover:text-[#1B4332] transition-all transform hover:scale-[1.05] shadow-2xl shadow-[#4ADE80]/20 flex-1">
                <Download className="mr-3 h-8 w-8" /> PDF
              </Button>
              <Button variant="outline" onClick={handleShareWhatsApp} className="h-20 rounded-[1.5rem] text-2xl font-black text-white bg-black/20 hover:bg-[#25D366] hover:text-white border-none shadow-xl transition-all transform hover:scale-[1.05] flex-1">
                <Share2 className="mr-3 h-8 w-8" /> {language === 'en' ? 'WhatsApp' : 'వాట్సాప్'}
              </Button>
              <Button variant="ghost" onClick={() => navigate('/')} className="h-20 rounded-[1.5rem] text-xl font-bold text-white/50 hover:text-white hover:bg-white/5 transition-all flex-1">
                <Home className="mr-3 h-6 w-6" /> Home
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
        <DialogContent className="sm:max-w-md bg-[#FDFBF7] border-none rounded-[3rem] p-10 overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-2 bg-[#4ADE80]"></div>
          <DialogHeader className="mb-8">
            <DialogTitle className="text-3xl font-display font-bold text-[#1B4332] flex items-center gap-3">
              <div className="bg-[#4ADE80]/10 p-2 rounded-xl">
                <FileCheck className="h-8 w-8 text-[#2E7D32]" />
              </div>
              Farmer Details
            </DialogTitle>
            <DialogDescription className="text-lg text-[#405D4E] mt-2">
              For official records and PDF header
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-sm font-bold text-[#1B4332] uppercase tracking-widest pl-2">Name</Label>
              <Input
                id="name"
                placeholder="Rama Rao"
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                className="h-14 rounded-2xl border-none bg-[#E8F5E9] text-lg font-medium px-6 focus-visible:ring-4 focus-visible:ring-[#4ADE80] transition-all"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mobile" className="text-sm font-bold text-[#1B4332] uppercase tracking-widest pl-2">Mobile Number</Label>
              <Input
                id="mobile"
                placeholder="9876543210"
                type="tel"
                value={farmerMobile}
                step="1"
                onChange={(e) => setFarmerMobile(e.target.value)}
                className="h-14 rounded-2xl border-none bg-[#E8F5E9] text-lg font-medium px-6 focus-visible:ring-4 focus-visible:ring-[#4ADE80] transition-all"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location" className="text-sm font-bold text-[#1B4332] uppercase tracking-widest pl-2">Location</Label>
              <Input
                id="location"
                placeholder="Village / Town"
                value={farmerLocation}
                onChange={(e) => setFarmerLocation(e.target.value)}
                className="h-14 rounded-2xl border-none bg-[#E8F5E9] text-lg font-medium px-6 focus-visible:ring-4 focus-visible:ring-[#4ADE80] transition-all"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-4 mt-8">
            <Button variant="ghost" onClick={() => setShowPdfDialog(false)} className="h-14 rounded-2xl w-full sm:w-auto text-[#405D4E] font-bold">
              Cancel
            </Button>
            <Button onClick={handleConfirmGenerate} disabled={isGenerating} className="h-14 rounded-2xl w-full sm:w-auto font-bold bg-[#1B4332] hover:bg-[#2E7D32] text-white px-10 shadow-xl shadow-[#1B4332]/20 transition-all transform active:scale-95">
              {isGenerating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Download className="mr-2 h-5 w-5" />}
              Generate PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TreatmentPlan;