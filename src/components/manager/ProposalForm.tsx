import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ImageUploadWithCrop } from '@/components/ImageUploadWithCrop';

export const ProposalForm = () => {
  const { user } = useAuth();
  const [crops, setCrops] = useState<any[]>([]);
  const [problems, setProblems] = useState<any[]>([]);
  const [selectedCropForProduct, setSelectedCropForProduct] = useState<string>('');
  const [availableStages, setAvailableStages] = useState<string[]>([]);
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [newStageName, setNewStageName] = useState<string>('');
  const [cropImageFile, setCropImageFile] = useState<File | null>(null);
  const [problemImageFile, setProblemImageFile] = useState<File | null>(null);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [cropsRes, problemsRes] = await Promise.all([
      supabase.from('crops').select('*'),
      supabase.from('problems').select('*'),
    ]);
    setCrops(cropsRes.data || []);
    setProblems(problemsRes.data || []);
  };

  const fetchStagesForCrop = async (cropId: string) => {
    if (!cropId) {
      setAvailableStages([]);
      setSelectedStage('');
      return;
    }
    
    try {
      const { data } = await (supabase as any)
        .from('product_mappings')
        .select('stage')
        .eq('crop_id', cropId)
        .not('stage', 'is', null);
      
      const uniqueStages: string[] = Array.from(new Set(
        (data || [])
          .map((item: any) => item.stage)
          .filter((s): s is string => !!s && typeof s === 'string' && s.trim() !== '')
      )).sort() as string[];
      
      // Always include "All Stages"
      setAvailableStages(['All Stages', ...uniqueStages]);
      setSelectedStage('');
      setNewStageName('');
    } catch (error) {
      console.error('Error fetching stages:', error);
      setAvailableStages(['All Stages']);
      setSelectedStage('');
    }
  };

  const handleCropSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    try {
      let imageUrl = '';
      if (cropImageFile) {
        const fileExt = cropImageFile.name.split('.').pop();
        const fileName = `crop-${Date.now()}.${fileExt}`;
        const filePath = `crops/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('images').upload(filePath, cropImageFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
        imageUrl = publicUrl;
      }

      const { error } = await supabase.from('submissions').insert([{
        manager_id: user?.id,
        type: 'crop',
        payload_json: {
          name_en: formData.get('name_en') as string,
          name_te: formData.get('name_te') as string,
          name_hi: formData.get('name_hi') as string,
          image_url: imageUrl,
        },
      }]);

      if (error) throw error;
      toast.success('Crop proposal submitted!');
      form.reset();
      setCropImageFile(null);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to submit');
    }
  };

  const handleProblemSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    try {
      let imageUrl = '';
      if (problemImageFile) {
        const fileExt = problemImageFile.name.split('.').pop();
        const fileName = `problem-${Date.now()}.${fileExt}`;
        const filePath = `problems/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('images').upload(filePath, problemImageFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
        imageUrl = publicUrl;
      }

      const { error } = await supabase.from('submissions').insert([{
        manager_id: user?.id,
        type: 'problem',
        payload_json: {
          crop_id: formData.get('crop_id') as string,
          title_en: formData.get('title_en') as string,
          title_te: formData.get('title_te') as string,
          title_hi: formData.get('title_hi') as string,
          image_url: imageUrl,
        },
      }]);

      if (error) throw error;
      toast.success('Problem proposal submitted!');
      form.reset();
      setProblemImageFile(null);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to submit');
    }
  };

  const handleProductSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const stageValue = selectedStage === 'CREATE_NEW' ? newStageName : selectedStage;
    
    if (!stageValue) {
      toast.error('Please select or create a stage');
      return;
    }
    
    try {
      let imageUrl = '';
      if (productImageFile) {
        const fileExt = productImageFile.name.split('.').pop();
        const fileName = `product-${Date.now()}.${fileExt}`;
        const filePath = `products/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('images').upload(filePath, productImageFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
        imageUrl = publicUrl;
      }

      // UPDATED PAYLOAD: Includes formula, description, instructions, and stage
      const { error } = await supabase.from('submissions').insert([{
        manager_id: user?.id,
        type: 'product',
        payload_json: {
          // IDs
          crop_id: formData.get('crop_id') as string,
          problem_id: formData.get('problem_id') as string,
          
          // Product Info (for 'products' table)
          name: formData.get('name') as string,
          scientific_formula: formData.get('scientific_formula') as string,
          description: formData.get('description') as string,
          image_url: imageUrl,
          pack_sizes: (formData.get('pack_sizes') as string).split(',').map(s => s.trim()),
          
          // Mapping Info (for 'product_mappings' table)
          stage: stageValue,
          dosage_recommendation: formData.get('dosage_recommendation') as string,
          dosage_min: parseFloat(formData.get('dosage_min') as string),
          dosage_max: parseFloat(formData.get('dosage_max') as string),
          dosage_unit: formData.get('dosage_unit') as string,
          spray_interval: formData.get('spray_interval') as string,
          safety_notes: formData.get('safety_notes') as string,
          instructions: formData.get('instructions') as string,
        },
      }]);

      if (error) throw error;
      toast.success('Product proposal submitted!');
      form.reset();
      setSelectedCropForProduct('');
      setProductImageFile(null);
      setSelectedStage('');
      setNewStageName('');
      setAvailableStages([]);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to submit');
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-display font-bold mb-6">Submit New Proposal</h2>
      
      <Tabs defaultValue="crop">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="crop">Crop</TabsTrigger>
          <TabsTrigger value="problem">Problem</TabsTrigger>
          <TabsTrigger value="product">Product</TabsTrigger>
        </TabsList>

        <TabsContent value="crop">
          <form onSubmit={handleCropSubmit} className="space-y-4">
            <ImageUploadWithCrop
              onImageCropped={setCropImageFile}
              aspectRatio={1}
              label="Crop Image (square, 400x400)"
            />
            <div><Label>Name (English)</Label><Input name="name_en" required /></div>
            <div><Label>Name (Telugu)</Label><Input name="name_te" required /></div>
            <div><Label>Name (Hindi)</Label><Input name="name_hi" required /></div>
            <Button type="submit" className="w-full">Submit Crop Proposal</Button>
          </form>
        </TabsContent>

        <TabsContent value="problem">
          <form onSubmit={handleProblemSubmit} className="space-y-4">
            <ImageUploadWithCrop
              onImageCropped={setProblemImageFile}
              aspectRatio={1}
              label="Problem Image (square, 400x400)"
            />
            <div>
              <Label>Crop</Label>
              <Select name="crop_id" required>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {crops.map(c => <SelectItem key={c.id} value={c.id}>{c.name_en}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Title (English)</Label><Input name="title_en" required /></div>
            <div><Label>Title (Telugu)</Label><Input name="title_te" required /></div>
            <div><Label>Title (Hindi)</Label><Input name="title_hi" required /></div>
            <Button type="submit" className="w-full">Submit Problem Proposal</Button>
          </form>
        </TabsContent>

        <TabsContent value="product">
          <form onSubmit={handleProductSubmit} className="space-y-4">
            <ImageUploadWithCrop
              onImageCropped={setProductImageFile}
              aspectRatio={1}
              label="Product Image (square, 400x400)"
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Crop</Label>
                <Select 
                  name="crop_id" 
                  value={selectedCropForProduct} 
                  onValueChange={async (value) => {
                    setSelectedCropForProduct(value);
                    await fetchStagesForCrop(value);
                  }} 
                  required
                >
                  <SelectTrigger><SelectValue placeholder="Select crop" /></SelectTrigger>
                  <SelectContent>
                    {crops.map(c => <SelectItem key={c.id} value={c.id}>{c.name_en}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Problem</Label>
                <Select name="problem_id" required disabled={!selectedCropForProduct}>
                  <SelectTrigger><SelectValue placeholder={selectedCropForProduct ? "Select problem" : "Select crop first"} /></SelectTrigger>
                  <SelectContent>
                    {problems.filter(p => p.crop_id === selectedCropForProduct).map(p => <SelectItem key={p.id} value={p.id}>{p.title_en}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-red-500">Stage *</Label>
              <Select value={selectedStage} onValueChange={v => {
                setSelectedStage(v);
                if (v !== 'CREATE_NEW') setNewStageName('');
              }} required disabled={!selectedCropForProduct}>
                <SelectTrigger><SelectValue placeholder={selectedCropForProduct ? "Select or create stage" : "Select crop first"} /></SelectTrigger>
                <SelectContent>
                  {availableStages.map(stage => (
                    <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                  ))}
                  <SelectItem value="CREATE_NEW">+ Create New Stage</SelectItem>
                </SelectContent>
              </Select>
              {selectedStage === 'CREATE_NEW' && (
                <Input
                  className="mt-2"
                  placeholder="Enter new stage name"
                  value={newStageName}
                  onChange={e => setNewStageName(e.target.value)}
                  required
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><Label>Product Name</Label><Input name="name" required placeholder="e.g. Polidar 4G" /></div>
              <div><Label>Scientific Formula</Label><Input name="scientific_formula" placeholder="e.g. Cartap Hydrochloride" /></div>
            </div>

            <div><Label>Description</Label><Textarea name="description" placeholder="Brief description of the product..." /></div>

            <div className="p-4 border rounded-lg bg-secondary/10 space-y-4">
              <h4 className="font-semibold text-sm text-primary">Dosage Configuration (For this Problem)</h4>
              <div><Label>Dosage Recommendation</Label><Input name="dosage_recommendation" placeholder="e.g., 400 ml/acre" required /></div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label>Min Dosage</Label><Input name="dosage_min" type="number" step="0.01" required /></div>
                <div><Label>Max Dosage</Label><Input name="dosage_max" type="number" step="0.01" required /></div>
                <div><Label>Unit</Label><Input name="dosage_unit" defaultValue="ml" required /></div>
              </div>
            </div>

            <div><Label>Instructions</Label><Textarea name="instructions" placeholder="How to apply..." /></div>
            <div><Label>Pack Sizes (comma-separated)</Label><Input name="pack_sizes" placeholder="100ml, 250ml, 500ml" required /></div>
            <div><Label>Spray Interval</Label><Input name="spray_interval" placeholder="e.g. 15 days" /></div>
            <div><Label>Safety Notes</Label><Textarea name="safety_notes" /></div>

            <Button type="submit" className="w-full">Submit Product Proposal</Button>
          </form>
        </TabsContent>
      </Tabs>
    </Card>
  );
};