import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export const SubmissionApprovals = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      // This query uses standard tables (submissions) so we keep standard typing
      const { data, error } = await supabase
        .from('submissions')
        .select('*, users!submissions_manager_id_fkey(username)')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching submissions:', error);
        toast.error('Failed to load submissions');
        return;
      }
      
      setSubmissions(data || []);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load submissions');
    }
  };

  const handleApprove = async (submission: any) => {
    try {
      const payload = submission.payload_json;
      
      if (submission.type === 'crop') {
        await supabase.from('crops').insert([payload]);
      } else if (submission.type === 'problem') {
        await supabase.from('problems').insert([payload]);
      } else if (submission.type === 'product') {
        // --- NEW LOGIC FOR 2-TABLE STRUCTURE ---
        // We cast (supabase as any) to bypass the missing type definitions locally
        
        // 1. Check if product exists by name (Avoid duplicates)
        const { data: existing } = await (supabase as any)
          .from('products')
          .select('id')
          .eq('name', payload.name)
          .maybeSingle(); 

        let productId = existing?.id;

        // 2. If product doesn't exist, create it
        if (!productId) {
          const { data: newProd, error: prodError } = await (supabase as any)
            .from('products')
            .insert({
              name: payload.name,
              image_url: payload.image_url,
              scientific_formula: payload.scientific_formula,
              description: payload.description,
              pack_sizes: payload.pack_sizes,
              features: payload.features
            })
            .select('id')
            .single();
          
          if (prodError) throw prodError;
          productId = newProd.id;
        }

        // 3. Create Mapping (The Rule)
        const { error: mapError } = await (supabase as any)
          .from('product_mappings')
          .insert({
            product_id: productId,
            crop_id: payload.crop_id,
            problem_id: payload.problem_id,
            stage: payload.stage || null,
            dosage_recommendation: payload.dosage_recommendation,
            dosage_min: payload.dosage_min,
            dosage_max: payload.dosage_max,
            dosage_unit: payload.dosage_unit,
            spray_interval: payload.spray_interval,
            safety_notes: payload.safety_notes,
            instructions: payload.instructions
          });

        if (mapError) throw mapError;
      }

      await supabase
        .from('submissions')
        .update({ status: 'approved', reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
        .eq('id', submission.id);

      toast.success('Approved and published!');
      fetchSubmissions();
    } catch (error: any) {
      console.error('Approve Error', error);
      toast.error('Failed to approve: ' + error.message);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await supabase
        .from('submissions')
        .update({ status: 'rejected', reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
        .eq('id', id);
      toast.success('Rejected');
      fetchSubmissions();
    } catch (error) {
      toast.error('Failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('submissions').delete().eq('id', id);
      toast.success('Submission deleted');
      fetchSubmissions();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleClearAll = async () => {
    try {
      await supabase.from('submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      toast.success('All submissions cleared');
      fetchSubmissions();
    } catch (error) {
      toast.error('Failed to clear submissions');
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    const payload = JSON.stringify(sub.payload_json).toLowerCase();
    const matchesSearch = payload.includes(searchTerm.toLowerCase()) ||
                          sub.users?.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || sub.type === filterType;
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const renderPayload = (type: string, data: any) => {
    if (type === 'crop') {
      return (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <p><span className="font-semibold">English:</span> {data.name_en}</p>
          <p><span className="font-semibold">Telugu:</span> {data.name_te}</p>
          <p><span className="font-semibold">Hindi:</span> {data.name_hi}</p>
          {data.image_url && (
            <div className="col-span-2 mt-2">
               <img src={data.image_url} alt="Crop" className="h-16 w-16 object-cover rounded border" />
            </div>
          )}
        </div>
      );
    }
    if (type === 'problem') {
      return (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <p><span className="font-semibold">English:</span> {data.title_en}</p>
          <p><span className="font-semibold">Telugu:</span> {data.title_te}</p>
          <p><span className="font-semibold">Hindi:</span> {data.title_hi}</p>
          <p><span className="font-semibold text-muted-foreground">Crop ID:</span> {data.crop_id}</p>
          {data.image_url && (
            <div className="col-span-2 mt-2">
               <img src={data.image_url} alt="Problem" className="h-16 w-16 object-cover rounded border" />
            </div>
          )}
        </div>
      );
    }
    if (type === 'product') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div className="col-span-2 font-medium text-base mb-1">{data.name}</div>
          <p><span className="font-semibold">Formula:</span> {data.scientific_formula}</p>
          <p><span className="font-semibold">Dosage:</span> {data.dosage_recommendation}</p>
          <p><span className="font-semibold">Min/Max:</span> {data.dosage_min} - {data.dosage_max} {data.dosage_unit}</p>
          <p><span className="font-semibold">Pack Sizes:</span> {Array.isArray(data.pack_sizes) ? data.pack_sizes.join(', ') : data.pack_sizes}</p>
          <p><span className="font-semibold">Spray Interval:</span> {data.spray_interval}</p>
          {data.image_url && (
            <div className="col-span-2 mt-2">
               <img src={data.image_url} alt="Product" className="h-16 w-16 object-cover rounded border" />
            </div>
          )}
        </div>
      );
    }
    return <pre className="text-xs overflow-x-auto">{JSON.stringify(data, null, 2)}</pre>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold">Submission Approvals</h2>
        {submissions.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear All Submissions?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all submissions. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAll}>Clear All</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder="Search submissions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger><SelectValue placeholder="Filter by type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="crop">Crop</SelectItem>
            <SelectItem value="problem">Problem</SelectItem>
            <SelectItem value="product">Product</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger><SelectValue placeholder="Filter by status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {filteredSubmissions.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No submissions found</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((sub) => (
          <Card key={sub.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant={sub.status === 'pending' ? 'default' : sub.status === 'approved' ? 'default' : 'destructive'}>
                    {sub.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                    {sub.status}
                  </Badge>
                  <span className="text-sm font-semibold uppercase">{sub.type}</span>
                  <span className="text-sm text-muted-foreground">by {sub.users?.username}</span>
                </div>
                
                <div className="bg-secondary/30 p-4 rounded-lg mt-3 border border-border">
                  {renderPayload(sub.type, sub.payload_json)}
                </div>
              </div>
              
              <div className="flex gap-2 ml-4">
                {sub.status === 'pending' && (
                  <>
                    <Button size="sm" onClick={() => handleApprove(sub)}>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleReject(sub.id)}>
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Submission?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this submission. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(sub.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>
        ))}
        </div>
      )}
    </div>
  );
};