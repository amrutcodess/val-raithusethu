import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Leaf, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Stage {
  crop_id: string;
  stage_name: string;
  crop_name: string;
}

export const StageManagement = () => {
  const [crops, setCrops] = useState<any[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [newStageName, setNewStageName] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCrops();
    fetchStages();
  }, []);

  const fetchCrops = async () => {
    try {
      const { data, error } = await supabase.from('crops').select('*');
      if (error) throw error;
      setCrops(data || []);
    } catch (error: any) {
      console.error('Error loading crops:', error);
      toast.error('Failed to load crops');
    }
  };

  const fetchStages = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('crop_stages')
        .select('*, crops(name_en)')
        .order('crop_id', { ascending: true })
        .order('stage_name', { ascending: true });
      
      if (error) {
        if (error.message?.includes('crop_stages')) {
          console.warn('crop_stages table not found. Create it via Supabase migrations.');
          setStages([]);
        } else {
          throw error;
        }
      } else {
        setStages((data as any[])?.map((s: any) => ({
          crop_id: s.crop_id,
          stage_name: s.stage_name,
          crop_name: s.crops?.name_en || 'Unknown',
        })) || []);
      }
    } catch (error: any) {
      console.error('Error loading stages:', error);
      if (!error.message?.includes('crop_stages')) {
        toast.error('Failed to load stages: ' + (error?.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddStage = async () => {
    if (!selectedCrop || !newStageName.trim()) {
      toast.error('Please select a crop and enter a stage name');
      return;
    }

    try {
      const { error } = await (supabase as any).from('crop_stages').insert([{
        crop_id: selectedCrop,
        stage_name: newStageName.trim(),
      }]);

      if (error) {
        if (error.code === '23505') {
          toast.error('This stage already exists for this crop');
        } else {
          throw error;
        }
      } else {
        toast.success('Stage added successfully');
        setNewStageName('');
        setShowDialog(false);
        fetchStages();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to add stage');
    }
  };

  const handleDeleteStage = async (cropId: string, stageName: string) => {
    if (!confirm(`Delete stage "${stageName}"?`)) return;

    try {
      const { error } = await (supabase as any)
        .from('crop_stages')
        .delete()
        .eq('crop_id', cropId)
        .eq('stage_name', stageName);

      if (error) throw error;
      toast.success('Stage deleted');
      fetchStages();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete stage');
    }
  };

  const filteredStages = selectedCrop
    ? stages.filter(s => s.crop_id === selectedCrop)
    : stages;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold">Stage Management</h2>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Stage
        </Button>
      </div>

      <Card className="p-4">
        <Label>Filter by Crop</Label>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCrop === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCrop('')}
          >
            All crops
          </Button>
          {crops.map(c => (
            <Button
              key={c.id}
              variant={selectedCrop === c.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCrop(c.id)}
            >
              {c.name_en}
            </Button>
          ))}
        </div>
      </Card>

      {loading ? (
        <div className="text-center text-muted-foreground">Loading stages...</div>
      ) : filteredStages.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <AlertCircle className="mx-auto h-12 w-12 mb-2 opacity-50" />
          No stages found. Add one to get started.
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredStages.map((stage) => (
            <Card key={`${stage.crop_id}-${stage.stage_name}`} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Leaf className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-semibold">{stage.stage_name}</p>
                  <p className="text-sm text-muted-foreground">{stage.crop_name}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDeleteStage(stage.crop_id, stage.stage_name)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Stage</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Crop</Label>
              <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {crops.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Stage Name</Label>
              <Input
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                placeholder="e.g. Seedling, Vegetative, Flowering"
              />
            </div>
            <Button onClick={handleAddStage} className="w-full">
              Add Stage
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
