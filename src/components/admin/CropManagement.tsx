import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Edit, Trash2, Leaf } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { ImageUploadWithCrop } from '@/components/ImageUploadWithCrop';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export const CropManagement = () => {
  const { user } = useAuth();
  const [crops, setCrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingCrop, setEditingCrop] = useState<any>(null);
  const [formData, setFormData] = useState({
    name_en: '',
    name_te: '',
    name_hi: '',
    image_url: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetchCrops();
  }, []);

  const fetchCrops = async () => {
    try {
      const { data, error } = await supabase.from('crops').select('*');
      if (error) throw error;
      setCrops(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load crops');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let imageUrl = formData.image_url;
      
      // Upload image if a new one was selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `crop-${Date.now()}.${fileExt}`;
        const filePath = `crops/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      const dataToSave = { ...formData, image_url: imageUrl };

      if (editingCrop) {
        const { error } = await supabase
          .from('crops')
          .update(dataToSave)
          .eq('id', editingCrop.id);
        if (error) throw error;
        toast.success('Crop updated successfully');
      } else {
        const { error } = await supabase.from('crops').insert([dataToSave]);
        if (error) throw error;
        toast.success('Crop added successfully');
      }
      
      setShowDialog(false);
      setFormData({ name_en: '', name_te: '', name_hi: '', image_url: '' });
      setImageFile(null);
      setEditingCrop(null);
      fetchCrops();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this crop?')) return;
    
    try {
      const { error } = await supabase.from('crops').delete().eq('id', id);
      if (error) throw error;
      toast.success('Crop deleted');
      fetchCrops();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete');
    }
  };

  const openEditDialog = (crop: any) => {
    setEditingCrop(crop);
    setFormData({
      name_en: crop.name_en,
      name_te: crop.name_te,
      name_hi: crop.name_hi,
      image_url: crop.image_url || '',
    });
    setShowDialog(true);
  };

  const filteredCrops = crops.filter(crop => 
    crop.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crop.name_te.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crop.name_hi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold">Crop Management</h2>
        <Button onClick={() => setShowDialog(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Crop
        </Button>
      </div>

      <Input
        placeholder="Search crops..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCrops.map((crop) => (
          <Card key={crop.id} className="p-4">
            <div className="flex items-start gap-4">
              {crop.image_url ? (
                <img src={crop.image_url} alt={crop.name_en} className="w-16 h-16 object-cover rounded-lg" />
              ) : (
                <div className="bg-primary/10 p-3 rounded-full">
                  <Leaf className="w-6 h-6 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{crop.name_en}</h3>
                <p className="text-sm text-muted-foreground truncate">{crop.name_te}</p>
                <p className="text-sm text-muted-foreground truncate">{crop.name_hi}</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => openEditDialog(crop)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(crop.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCrop ? 'Edit Crop' : 'Add New Crop'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <ImageUploadWithCrop
              onImageCropped={setImageFile}
              aspectRatio={1}
              label="Crop Image (square, 400x400)"
              currentImage={formData.image_url}
            />
            <div>
              <Label>Name (English)</Label>
              <Input
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Name (Telugu)</Label>
              <Input
                value={formData.name_te}
                onChange={(e) => setFormData({ ...formData, name_te: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Name (Hindi)</Label>
              <Input
                value={formData.name_hi}
                onChange={(e) => setFormData({ ...formData, name_hi: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              {editingCrop ? 'Update' : 'Add'} Crop
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
