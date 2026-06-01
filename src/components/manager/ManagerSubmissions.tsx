import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export const ManagerSubmissions = () => {
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
      const { data } = await supabase
        .from('submissions')
        .select('*')
        .eq('manager_id', user?.id)
        .order('created_at', { ascending: false });
      
      setSubmissions(data || []);
    } catch (error) {
      toast.error('Failed to load submissions');
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    const payload = JSON.stringify(sub.payload_json).toLowerCase();
    const matchesSearch = payload.includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || sub.type === filterType;
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const renderPayload = (type: string, data: any) => {
    if (type === 'crop') {
      return (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <p><span className="font-semibold">English:</span> {data.name_en}</p>
          <p><span className="font-semibold">Telugu:</span> {data.name_te}</p>
          <p><span className="font-semibold">Hindi:</span> {data.name_hi}</p>
          {data.image_url && <img src={data.image_url} className="h-10 w-10 rounded border object-cover" />}
        </div>
      );
    }
    if (type === 'problem') {
      return (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <p><span className="font-semibold">Title (EN):</span> {data.title_en}</p>
          <p><span className="font-semibold">Crop ID:</span> {data.crop_id}</p>
          {data.image_url && <img src={data.image_url} className="h-10 w-10 rounded border object-cover" />}
        </div>
      );
    }
    if (type === 'product') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <p className="font-semibold col-span-2 text-base text-primary mb-1">{data.name}</p>
          <p><span className="font-semibold">Formula:</span> {data.scientific_formula}</p>
          <p><span className="font-semibold">Dosage:</span> {data.dosage_recommendation}</p>
          <p><span className="font-semibold">Range:</span> {data.dosage_min} - {data.dosage_max} {data.dosage_unit}</p>
          <p><span className="font-semibold">Pack Sizes:</span> {Array.isArray(data.pack_sizes) ? data.pack_sizes.join(', ') : data.pack_sizes}</p>
          {data.image_url && (
            <div className="col-span-2 mt-2">
              <img src={data.image_url} className="h-12 w-12 rounded border object-cover" />
            </div>
          )}
        </div>
      );
    }
    return <pre className="text-xs overflow-x-auto">{JSON.stringify(data, null, 2)}</pre>;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">My Submissions</h2>

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
        <Card className="p-8 text-center text-muted-foreground">
          No submissions found.
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((sub) => (
            <Card key={sub.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant={
                      sub.status === 'pending' ? 'default' : 
                      sub.status === 'approved' ? 'default' : 
                      'destructive'
                    }>
                      {sub.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                      {sub.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {sub.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                      {sub.status}
                    </Badge>
                    <span className="text-sm font-semibold capitalize">{sub.type}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="bg-secondary/30 p-4 rounded-lg mt-3 border border-border">
                    {renderPayload(sub.type, sub.payload_json)}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};