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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 1. Handle Image Upload
      let imageUrl = formData.image_url;
      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const path = `products/product-${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('images').upload(path, imageFile);
        if (error) throw error;
        imageUrl = supabase.storage.from('images').getPublicUrl(path).data.publicUrl;
      }

      const packSizesArray = formData.pack_sizes.trim()
        ? formData.pack_sizes.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      let parentId = formData.product_id;

      // 2. Handle Parent Product
      if (editingId && parentId) {
        // UPDATE existing parent
        const { error: prodError } = await (supabase as any).from('products').update({
          name: formData.name,
          scientific_formula: formData.scientific_formula,
          description: formData.description,
          image_url: imageUrl,
          pack_sizes: packSizesArray
        }).eq('id', parentId);
        
        if (prodError) throw prodError;
      } else {
        // CREATE or FIND parent
        const { data: existing } = await (supabase as any)
          .from('products')
          .select('id')
          .eq('name', formData.name)
          .maybeSingle();

        if (existing) {
          parentId = existing.id;
        } else {
          const { data: newProd, error: prodError } = await (supabase as any)
            .from('products')
            .insert({
              name: formData.name,
              scientific_formula: formData.scientific_formula,
              description: formData.description,
              image_url: imageUrl,
              pack_sizes: packSizesArray
            })
            .select('id')
            .single();
          
          if (prodError) throw prodError;
          parentId = newProd.id;
        }
      }

      if (!parentId) throw new Error("Failed to resolve Parent Product ID");

      // 3. Handle Mapping(s) - Create one for each selected stage or one without stage
      const stagesToSave = selectedStages.length > 0 ? selectedStages : [null];
      
      for (const stageValue of stagesToSave) {
        const mappingPayload = {
          product_id: parentId,
          crop_id: formData.crop_id,
          problem_id: formData.problem_id,
          stage: stageValue,
          dosage_recommendation: formData.dosage_recommendation,
          dosage_min: Number(formData.dosage_min) || 0,
          dosage_max: Number(formData.dosage_max) || 0,
          dosage_unit: formData.dosage_unit,
          spray_interval: formData.spray_interval || null,
          safety_notes: formData.safety_notes || null,
          instructions: formData.instructions || null
        };

        if (editingId && stageValue === null) {
          // If editing and no stages selected, update the existing mapping
          const { error: mapError } = await (supabase as any)
            .from('product_mappings')
            .update(mappingPayload)
            .eq('id', editingId);
          if (mapError) throw mapError;
        } else if (!editingId) {
          // If creating new, insert mapping(s)
          const { error: mapError } = await (supabase as any)
            .from('product_mappings')
            .insert([mappingPayload]);
          if (mapError) throw mapError;
        }
      }

      if (editingId) {
        toast.success('Product updated');
      } else {
        toast.success(`Product added ${selectedStages.length > 0 ? `for ${selectedStages.length} stage(s)` : ''}`);
      }

      setShowDialog(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      console.error(err);
      // Display the actual error message from Supabase
      toast.error('Error: ' + (err.message || err.error_description || 'Unknown error'));
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
    });
    setImageFile(null);
    setEditingId(null);
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder="Search product..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />

        <Select value={filterCrop} onValueChange={setFilterCrop}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by crop" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Crops</SelectItem>
            {crops.map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.name_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterProblem} onValueChange={setFilterProblem}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by problem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Problems</SelectItem>
            {problems.map(p => (
              <SelectItem key={p.id} value={p.id}>
                {p.title_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredMappings.map(mapping => {
          const product = mapping.products;
          if (!product) return null; // Safety check
          const packSizes = Array.isArray(product.pack_sizes) ? product.pack_sizes : [];

          return (
            <Card key={mapping.id} className="p-4">
              <div className="flex gap-4">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="bg-accent/10 p-3 rounded-full">
                    <Package className="w-8 h-8 text-accent" />
                  </div>
                )}

                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">
                    {mapping.crops?.name_en} – {mapping.problems?.title_en}
                  </p>
                  <h3 className="font-bold">{product.name}</h3>
                  <p className="text-sm">{mapping.dosage_recommendation}</p>
                  <p className="text-xs text-muted-foreground">
                    Packs: {packSizes.length ? packSizes.join(', ') : '—'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const stageValue = mapping.stage;
                      setEditingId(mapping.id);
                      setFormData({
                        crop_id: mapping.crop_id,
                        problem_id: mapping.problem_id,
                        dosage_recommendation: mapping.dosage_recommendation,
                        dosage_min: String(mapping.dosage_min),
                        dosage_max: String(mapping.dosage_max),
                        dosage_unit: mapping.dosage_unit,
                        spray_interval: mapping.spray_interval || '',
                        safety_notes: mapping.safety_notes || '',
                        instructions: mapping.instructions || '',
                        
                        product_id: product.id,
                        name: product.name,
                        scientific_formula: product.scientific_formula || '',
                        description: product.description || '',
                        image_url: product.image_url || '',
                        pack_sizes: packSizes.join(', '),
                      });
                      handleCropChange(mapping.crop_id);
                      if (stageValue) {
                        setSelectedStages([stageValue]);
                      }
                      setShowDialog(true);
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={async () => {
                      if (confirm('Delete this rule? (Parent product remains)')) {
                        await (supabase as any)
                          .from('product_mappings')
                          .delete()
                          .eq('id', mapping.id);
                        fetchData();
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit' : 'Add'} Product Rule
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <ImageUploadWithCrop
              onImageCropped={setImageFile}
              aspectRatio={1}
              label="Product Image"
              currentImage={formData.image_url}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Crop</Label>
                <Select
                  value={formData.crop_id}
                  onValueChange={v => setFormData({ ...formData, crop_id: v, problem_id: '' })}
                >
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
                <Select
                  value={formData.problem_id}
                  onValueChange={v => setFormData({ ...formData, problem_id: v })}
                >
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
                        {stage}
                        <button
                          type="button"
                          onClick={() => setSelectedStages(selectedStages.filter(s => s !== stage))}
                          className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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
                <Label>Pack Sizes</Label>
                <Input
                  value={formData.pack_sizes}
                  onChange={e => setFormData({ ...formData, pack_sizes: e.target.value })}
                  placeholder="100ml, 250ml"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Dosage & Rules (For this specific problem)</h4>
              
              <Label>Dosage Recommendation</Label>
              <Input
                value={formData.dosage_recommendation}
                onChange={e => setFormData({ ...formData, dosage_recommendation: e.target.value })}
                placeholder="e.g. 200ml per acre"
              />

              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={formData.dosage_min}
                  onChange={e => setFormData({ ...formData, dosage_min: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={formData.dosage_max}
                  onChange={e => setFormData({ ...formData, dosage_max: e.target.value })}
                />
                <Input
                  placeholder="Unit"
                  value={formData.dosage_unit}
                  onChange={e => setFormData({ ...formData, dosage_unit: e.target.value })}
                />
              </div>

              <Label>Spray Interval</Label>
              <Input
                value={formData.spray_interval}
                onChange={e => setFormData({ ...formData, spray_interval: e.target.value })}
              />

              <Label>Safety Notes</Label>
              <Textarea
                value={formData.safety_notes}
                onChange={e => setFormData({ ...formData, safety_notes: e.target.value })}
              />
              
              <Label>Instructions</Label>
              <Textarea
                value={formData.instructions}
                onChange={e => setFormData({ ...formData, instructions: e.target.value })}
              />
            </div>

            <Button type="submit" className="w-full">
              {editingId ? 'Update Rule' : 'Add Rule'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};