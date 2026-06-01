import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle, Edit, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ImageUploadWithCrop } from '@/components/ImageUploadWithCrop';

export const ProductManagement = () => {
  const [mappings, setMappings] = useState<any[]>([]);
  const [problems, setProblems] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCrop, setFilterCrop] = useState('all');
  const [filterProblem, setFilterProblem] = useState('all');
  const [showDialog, setShowDialog] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [availableStages, setAvailableStages] = useState<string[]>([]);
  const [newStageName, setNewStageName] = useState('');

  const [formData, setFormData] = useState({
    crop_id: '',
    problem_id: '',
    dosage_recommendation: '',
    dosage_min: '',
    dosage_max: '',
    dosage_unit: 'ml',
    spray_interval: '',
    safety_notes: '',
    instructions: '',
    name: '',
    scientific_formula: '',
    description: '',
    pack_sizes: '',
    image_url: '',
    product_id: '',
    stage: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [mappingsRes, problemsRes, cropsRes] = await Promise.all([
        (supabase as any).from('product_mappings')
          .select('*, products(*), problems(title_en), crops(name_en)'),
        supabase.from('problems').select('*'),
        supabase.from('crops').select('*'),
      ]);

      setMappings(mappingsRes.data || []);
      setProblems(problemsRes.data || []);
      setCrops(cropsRes.data || []);
    } catch {
      toast.error('Failed to load data');
    }
  };

  const resetForm = () => {
    setFormData({
      crop_id: '',
      problem_id: '',
      dosage_recommendation: '',
      dosage_min: '',
      dosage_max: '',
      dosage_unit: 'ml',
      spray_interval: '',
      safety_notes: '',
      instructions: '',
      name: '',
      scientific_formula: '',
      description: '',
      pack_sizes: '',
      image_url: '',
      product_id: '',
      stage: '',
    });
    setImageFile(null);
    setEditingId(null);
    setAvailableStages([]);
    setNewStageName('');
  };

  const fetchStagesForCrop = async (cropId: string) => {
    if (!cropId) {
      setAvailableStages([]);
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
    } catch (error) {
      console.error('Error fetching stages:', error);
      setAvailableStages(['All Stages']);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.crop_id || !formData.problem_id || !formData.stage) {
      toast.error('Please select crop, problem, and stage');
      return;
    }

    try {
      let imageUrl = formData.image_url;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `product-${Date.now()}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      let currentProductId = formData.product_id;

      // If no product ID, create the product first!
      if (!currentProductId) {
        const productData: any = {
          name: formData.name,
          description: formData.description || null,
          image_url: imageUrl || null,
          scientific_formula: formData.scientific_formula || null,
          pack_sizes: formData.pack_sizes || null,
        };

        const { data: newProduct, error: prodError } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();

        if (prodError) throw prodError;
        currentProductId = newProduct.id;

        // Update form data with new ID so we don't duplicate if they toggle edit
        setFormData(prev => ({ ...prev, product_id: currentProductId }));
      } else {
        // Update existing product
        const productData: any = {
          name: formData.name,
          description: formData.description || null,
          image_url: imageUrl || null,
        };

        if (formData.scientific_formula) productData.scientific_formula = formData.scientific_formula;
        if (formData.pack_sizes) productData.pack_sizes = formData.pack_sizes;

        const { error: prodError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', currentProductId);

        if (prodError) throw prodError;
      }

      // Use new stage name if creating new stage
      const stageValue = formData.stage === 'CREATE_NEW' ? newStageName : formData.stage;

      const payload = {
        crop_id: formData.crop_id,
        problem_id: formData.problem_id,
        product_id: currentProductId, // Now we definitely have a product ID
        stage: stageValue,
        dosage_recommendation: formData.dosage_recommendation || null,
        dosage_min: formData.dosage_min ? parseFloat(formData.dosage_min) : null,
        dosage_max: formData.dosage_max ? parseFloat(formData.dosage_max) : null,
        dosage_unit: formData.dosage_unit,
        spray_interval: formData.spray_interval || null,
        safety_notes: formData.safety_notes || null,
        instructions: formData.instructions || null
      };

      if (editingId) {
        const { error: mapError } = await (supabase as any)
          .from('product_mappings')
          .update(payload)
          .eq('id', editingId);
        if (mapError) throw mapError;
      } else {
        const { error: mapError } = await (supabase as any)
          .from('product_mappings')
          .insert([payload]);
        if (mapError) throw mapError;
      }

      toast.success(editingId ? 'Updated!' : 'Added!');
      setShowDialog(false);
      resetForm();
      fetchData();
      // Add explicit refresh to ensuring stages are up to date
      fetchStagesForCrop(formData.crop_id);
    } catch (err: any) {
      console.error(err);
      toast.error('Error: ' + (err.message || err.error_description || 'Unknown error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product rule?')) return;

    try {
      const { error } = await (supabase as any)
        .from('product_mappings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Deleted');
      fetchData();
    } catch (err: any) {
      toast.error('Error: ' + (err.message || 'Unknown error'));
    }
  };

  const filteredMappings = mappings.filter(m => {
    const prodName = m.products?.name?.toLowerCase() || '';
    const dosage = m.dosage_recommendation?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();

    const matchesSearch = prodName.includes(search) || dosage.includes(search);
    const matchesCrop = filterCrop === 'all' || m.crop_id === filterCrop;
    const matchesProblem = filterProblem === 'all' || m.problem_id === filterProblem;

    return matchesSearch && matchesCrop && matchesProblem;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold">Product Management</h2>
        <Button onClick={() => { resetForm(); setShowDialog(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Product Rule
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select value={filterCrop} onValueChange={setFilterCrop}>
          <SelectTrigger><SelectValue placeholder="Filter crop" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Crops</SelectItem>
            {crops.map(c => <SelectItem key={c.id} value={c.id}>{c.name_en}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterProblem} onValueChange={setFilterProblem}>
          <SelectTrigger><SelectValue placeholder="Filter problem" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Problems</SelectItem>
            {problems.map(p => <SelectItem key={p.id} value={p.id}>{p.title_en}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredMappings.map((m) => (
          <Card key={m.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">{m.products?.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {m.problems?.title_en} • {m.crops?.name_en}
                </p>
                {m.stage && <p className="text-sm font-medium text-blue-600 mb-1">Stage: {m.stage}</p>}
                <p className="text-sm">{m.dosage_recommendation || 'No dosage info'}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={async () => {
                  setEditingId(m.id);
                  setFormData({
                    crop_id: m.crop_id,
                    problem_id: m.problem_id,
                    stage: m.stage || '',
                    dosage_recommendation: m.dosage_recommendation || '',
                    dosage_min: m.dosage_min?.toString() || '',
                    dosage_max: m.dosage_max?.toString() || '',
                    dosage_unit: m.dosage_unit || 'ml',
                    spray_interval: m.spray_interval || '',
                    safety_notes: m.safety_notes || '',
                    instructions: m.instructions || '',
                    name: m.products?.name || '',
                    scientific_formula: m.products?.scientific_formula || '',
                    description: m.products?.description || '',
                    pack_sizes: m.products?.pack_sizes || '',
                    image_url: m.products?.image_url || '',
                    product_id: m.products?.id || '',
                  });
                  await fetchStagesForCrop(m.crop_id);
                  setShowDialog(true);
                }}>
                  <Edit className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(m.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit' : 'Add'} Product Rule</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-4 border rounded-lg bg-secondary/10 space-y-4">
              <h4 className="font-semibold text-sm text-primary">Rule Configuration</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Crop</Label>
                  <Select value={formData.crop_id} onValueChange={async (v) => {
                    setFormData({ ...formData, crop_id: v, problem_id: '', stage: '' });
                    setNewStageName('');
                    await fetchStagesForCrop(v);
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {crops.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name_en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Problem</Label>
                  <Select value={formData.problem_id} onValueChange={v => setFormData({ ...formData, problem_id: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {problems
                        .filter(p => !formData.crop_id || p.crop_id === formData.crop_id)
                        .map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.title_en}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-red-500">Stage *</Label>
                <Select value={formData.stage} onValueChange={v => {
                  setFormData({ ...formData, stage: v });
                  if (v !== 'CREATE_NEW') setNewStageName('');
                }}>
                  <SelectTrigger><SelectValue placeholder="Select or create stage" /></SelectTrigger>
                  <SelectContent>
                    {availableStages.map(stage => (
                      <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                    ))}
                    <SelectItem value="CREATE_NEW">+ Create New Stage</SelectItem>
                  </SelectContent>
                </Select>
                {formData.stage === 'CREATE_NEW' && (
                  <Input
                    className="mt-2"
                    placeholder="Enter new stage name"
                    value={newStageName}
                    onChange={e => setNewStageName(e.target.value)}
                  />
                )}
              </div>

              <div>
                <Label>Dosage Recommendation</Label>
                <Input
                  value={formData.dosage_recommendation}
                  onChange={e => setFormData({ ...formData, dosage_recommendation: e.target.value })}
                  placeholder="e.g. 5ml per liter"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Min Dose</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.dosage_min}
                    onChange={e => setFormData({ ...formData, dosage_min: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Max Dose</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.dosage_max}
                    onChange={e => setFormData({ ...formData, dosage_max: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Unit</Label>
                  <Select value={formData.dosage_unit} onValueChange={v => setFormData({ ...formData, dosage_unit: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ml">ml</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="l">l</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Spray Interval (days)</Label>
                <Input
                  type="number"
                  value={formData.spray_interval}
                  onChange={e => setFormData({ ...formData, spray_interval: e.target.value })}
                />
              </div>

              <div>
                <Label>Safety Notes</Label>
                <Textarea
                  value={formData.safety_notes}
                  onChange={e => setFormData({ ...formData, safety_notes: e.target.value })}
                  placeholder="Precautions, warnings..."
                />
              </div>

              <div>
                <Label>Instructions</Label>
                <Textarea
                  value={formData.instructions}
                  onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Application instructions..."
                />
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-secondary/10 space-y-4">
              <h4 className="font-semibold text-sm text-primary">Product Details (Updates everywhere)</h4>
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Polidar 4G"
                />
              </div>
              <div>
                <Label>Scientific Formula</Label>
                <Input
                  value={formData.scientific_formula}
                  onChange={e => setFormData({ ...formData, scientific_formula: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <Label>Pack Sizes</Label>
                <Input
                  value={formData.pack_sizes}
                  onChange={e => setFormData({ ...formData, pack_sizes: e.target.value })}
                  placeholder="e.g. 500ml, 1L, 2L"
                />
              </div>
              <div>
                <Label>Product Image</Label>
                <ImageUploadWithCrop
                  onImageCropped={setImageFile}
                  aspectRatio={1}
                  label="Product Image"
                  currentImage={formData.image_url}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {editingId ? 'Update' : 'Add'} Product
              </Button>
              <Button type="button" variant="outline" onClick={() => {
                setShowDialog(false);
                resetForm();
              }}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
