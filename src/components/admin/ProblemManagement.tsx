import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Edit, Trash2, Bug } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ImageUploadWithCrop } from '@/components/ImageUploadWithCrop';


export const ProblemManagement = () => {
  const [problems, setProblems] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCrop, setFilterCrop] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingProblem, setEditingProblem] = useState<any>(null);
  const [formData, setFormData] = useState({
    crop_id: '',
    title_en: '',
    title_te: '',
    title_hi: '',
    image_url: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Helper function for title normalization
  const normalizeTitle = (str: string) =>
    str.toLowerCase().replace(/\s+/g, ' ').trim();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [problemsRes, cropsRes] = await Promise.all([
        supabase.from('problems').select('*, crops(name_en)'),
        supabase.from('crops').select('*'),
      ]);

      if (problemsRes.error) throw problemsRes.error;
      if (cropsRes.error) throw cropsRes.error;

      setProblems(problemsRes.data || []);
      setCrops(cropsRes.data || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let imageUrl = formData.image_url;
      
      // Upload image if a new one was selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `problem-${Date.now()}.${fileExt}`;
        const filePath = `problems/${fileName}`;

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

      if (editingProblem) {
        // 1. Fetch all problems
        const { data: allProblems, error: fetchError } = await supabase
          .from('problems')
          .select('id, title_en');

        if (fetchError) throw fetchError;

        // 2. Normalize current title
        const currentNormalized = normalizeTitle(formData.title_en);

        // 3. Find matching problem IDs (case + space insensitive)
        const matchingIds = allProblems
          .filter(p => normalizeTitle(p.title_en) === currentNormalized)
          .map(p => p.id);

        if (matchingIds.length === 0) {
          toast.error('No matching problems found');
          return;
        }

        // 4. Update image for ALL matching problems
        const { error } = await supabase
          .from('problems')
          .update({ image_url: imageUrl })
          .in('id', matchingIds);

        if (error) throw error;

        toast.success(`Image synced to ${matchingIds.length} problems`);
      } else {
        const { error } = await supabase.from('problems').insert([dataToSave]);
        if (error) throw error;
        toast.success('Problem added');
      }
      
      setShowDialog(false);
      setFormData({ crop_id: '', title_en: '', title_te: '', title_hi: '', image_url: '' });
      setImageFile(null);
      setEditingProblem(null);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this problem?')) return;
    
    try {
      const { error } = await supabase.from('problems').delete().eq('id', id);
      if (error) throw error;
      toast.success('Deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const filteredProblems = problems.filter(problem => {
    const matchesSearch = problem.title_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          problem.title_te.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          problem.title_hi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCrop = filterCrop === 'all' || problem.crop_id === filterCrop;
    return matchesSearch && matchesCrop;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold">Problem Management</h2>
        <Button onClick={() => setShowDialog(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Problem
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Input
          placeholder="Search problems..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select value={filterCrop} onValueChange={setFilterCrop}>
          <SelectTrigger><SelectValue placeholder="Filter by crop" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Crops</SelectItem>
            {crops.map(c => <SelectItem key={c.id} value={c.id}>{c.name_en}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProblems.map((problem) => (
          <Card key={problem.id} className="p-4">
            <div className="flex items-start gap-4">
              {problem.image_url ? (
                <img src={problem.image_url} alt={problem.title_en} className="w-16 h-16 object-cover rounded-lg" />
              ) : (
                <div className="bg-destructive/10 p-3 rounded-full">
                  <Bug className="w-6 h-6 text-destructive" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">
                  {problem.crops?.name_en}
                </p>
                <h3 className="font-semibold truncate">{problem.title_en}</h3>
                <p className="text-sm text-muted-foreground truncate">{problem.title_te}</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => {
                    setEditingProblem(problem);
                    setFormData({
                      crop_id: problem.crop_id,
                      title_en: problem.title_en,
                      title_te: problem.title_te,
                      title_hi: problem.title_hi,
                      image_url: problem.image_url || '',
                    });
                    setShowDialog(true);
                  }}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(problem.id)}>
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
            <DialogTitle>{editingProblem ? 'Edit' : 'Add'} Problem</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <ImageUploadWithCrop
              onImageCropped={setImageFile}
              aspectRatio={1}
              label="Problem Image (square, 400x400)"
              currentImage={formData.image_url}
            />

            <div>
              <Label>Select Crop *</Label>
              <Select value={formData.crop_id} onValueChange={(cropId) => setFormData({ ...formData, crop_id: cropId })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select crop" />
                </SelectTrigger>
                <SelectContent>
                  {crops.map((crop) => (
                    <SelectItem key={crop.id} value={crop.id}>
                      {crop.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Title (English)</Label>
              <Input value={formData.title_en} onChange={(e) => setFormData({ ...formData, title_en: e.target.value })} required />
            </div>
            <div>
              <Label>Title (Telugu)</Label>
              <Input value={formData.title_te} onChange={(e) => setFormData({ ...formData, title_te: e.target.value })} required />
            </div>
            <div>
              <Label>Title (Hindi)</Label>
              <Input value={formData.title_hi} onChange={(e) => setFormData({ ...formData, title_hi: e.target.value })} required />
            </div>
            <Button type="submit" className="w-full">
              {editingProblem ? 'Update' : 'Add'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};