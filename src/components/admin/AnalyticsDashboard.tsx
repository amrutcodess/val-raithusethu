import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { BarChart3, TrendingUp, Globe, Package, RefreshCw, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export const AnalyticsDashboard = () => {
  const [stats, setStats] = useState({
    totalDiagnoses: 0,
    languageBreakdown: {} as Record<string, number>,
    topProducts: [] as any[],
    topCrops: [] as any[],
  });

  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [rawData, setRawData] = useState<any[]>([]);
  const [showFarmerData, setShowFarmerData] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedMonths]);

  const extractMonthsFromData = (data: any[]) => {
    const set = new Set<string>();
    data.forEach(row => {
      if (row.timestamp) {
        const d = new Date(row.timestamp);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        set.add(`${y}-${m}`);
      }
    });
    return Array.from(set).sort().reverse();
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      let query = supabase.from('analytics').select('*, crops(name_en), problems(title_en)');
      let allData: any[] = [];

      if (selectedMonths.length > 0) {
        const conditions = selectedMonths.map(month => {
          const [y, m] = month.split('-').map(Number);
          return {
            start: new Date(y, m - 1, 1).toISOString(),
            end: new Date(y, m, 0, 23, 59, 59).toISOString(),
          };
        });

        query = query.or(
          conditions
            .map(r => `and(timestamp.gte.${r.start},timestamp.lte.${r.end})`)
            .join(',')
        );

        const { data, error } = await query;
        if (error) throw error;

        // Client-side date filter just in case
        allData = data?.filter(row =>
          conditions.some(
            r =>
              row.timestamp &&
              row.timestamp >= r.start &&
              row.timestamp <= r.end
          )
        ) || [];

      } else {
        const { data, error } = await query;
        if (error) throw error;
        allData = data || [];
      }

      // Fetch products separately to map names client-side
      const { data: productsData } = await supabase.from('products').select('id, name');
      const productsMap = new Map(productsData?.map(p => [p.id, p.name]) || []);

      // Helper to attach product names to data
      const enrichData = (data: any[]) => {
        return data.map(row => ({
          ...row,
          product_name: productsMap.get(row.product_id) || 'Unknown'
        }));
      };

      const enrichedAllData = enrichData(allData);

      // 1. Process stats with ALL data (including anonymous)
      processAnalytics(enrichedAllData);

      // 2. Filter data for Table/Export (Exclude empty farmer info)
      const tableData = enrichedAllData.filter(row =>
        row.farmer_name && row.farmer_name.trim() !== '' &&
        row.farmer_mobile && row.farmer_mobile.trim() !== '' &&
        row.farmer_location && row.farmer_location.trim() !== ''
      );

      setRawData(tableData);

    } catch (e) {
      console.error(e);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const processAnalytics = async (data: any[]) => {
    if (!data.length) {
      setStats({
        totalDiagnoses: 0,
        languageBreakdown: {},
        topProducts: [],
        topCrops: [],
      });
      if (selectedMonths.length === 0) setAvailableMonths([]);
      return;
    }

    if (selectedMonths.length === 0) {
      setAvailableMonths(extractMonthsFromData(data));
    }

    const languageBreakdown = data.reduce((a: any, c: any) => {
      a[c.language] = (a[c.language] || 0) + 1;
      return a;
    }, {});

    const productCounts = data.reduce((a: any, c: any) => {
      if (c.product_id) a[c.product_id] = (a[c.product_id] || 0) + 1;
      return a;
    }, {});

    const cropCounts = data.reduce((a: any, c: any) => {
      if (c.crop_id) a[c.crop_id] = (a[c.crop_id] || 0) + 1;
      return a;
    }, {});

    // We already have names in 'data' from the join!
    // products(name), crops(name_en)
    // So we can map IDs to names directly from the data without extra fetches.

    // Helper to find name from data
    const findProductName = (id: string) => data.find((r: any) => r.product_id === id)?.product_name || 'Unknown';
    const findCropName = (id: string) => data.find((r: any) => r.crop_id === id)?.crops?.name_en || 'Unknown';

    setStats({
      totalDiagnoses: data.length,
      languageBreakdown,
      topProducts: Object.entries(productCounts)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 5)
        .map(([id, count]) => ({
          name: findProductName(id),
          count,
        })),
      topCrops: Object.entries(cropCounts)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 5)
        .map(([id, count]) => ({
          name: findCropName(id),
          count,
        })),
    });
  };

  const downloadExcel = () => {
    if (rawData.length === 0) {
      toast.error('No data to download');
      return;
    }

    const dataToExport = rawData.map(row => ({
      Date: new Date(row.timestamp).toLocaleString(),
      'Farmer Name': row.farmer_name,
      Mobile: row.farmer_mobile,
      Location: row.farmer_location,
      Crop: row.crops?.name_en || 'Unknown',
      Problem: row.problems?.title_en || 'Unknown',
      Product: row.product_name || 'Unknown', // Use manual mapped name
      Language: row.language
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Farmer Data");

    XLSX.writeFile(wb, `farmer-data-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const clearData = async () => {
    if (!confirm('Are you sure you want to clear the displayed farmer data? This cannot be undone.')) return;

    try {
      const idsToDelete = rawData.map(r => r.id);
      console.log('Attempting to delete IDs:', idsToDelete); // Debugging

      if (idsToDelete.length === 0) {
        toast.error("No data to delete");
        return;
      }

      const { error } = await supabase
        .from('analytics')
        .delete()
        .in('id', idsToDelete);

      if (error) {
        console.error('Supabase Delete Error:', error); // Explicit logging
        throw error;
      }

      toast.success('Data cleared successfully');
      fetchAnalytics();
    } catch (error: any) {
      console.error('Clear Data caught error:', error);
      toast.error(`Failed to clear data: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold">Analytics Dashboard</h2>
        <div className="flex gap-2">
          <Button onClick={() => setShowFarmerData(!showFarmerData)} variant={showFarmerData ? "default" : "secondary"}>
            {showFarmerData ? 'Hide Farmer Details' : 'View Farmer Details'}
          </Button>

          <Button onClick={fetchAnalytics} variant="outline" disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                {selectedMonths.length > 0
                  ? `${selectedMonths.length} month(s)`
                  : 'Filter by month'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {availableMonths.length === 0 ? (
                <DropdownMenuCheckboxItem disabled>
                  No month data yet
                </DropdownMenuCheckboxItem>
              ) : (
                availableMonths.map(month => (
                  <DropdownMenuCheckboxItem
                    key={month}
                    checked={selectedMonths.includes(month)}
                    onSelect={e => e.preventDefault()}
                    onCheckedChange={() =>
                      setSelectedMonths(prev =>
                        prev.includes(month)
                          ? prev.filter(m => m !== month)
                          : [...prev, month]
                      )
                    }
                  >
                    {month}
                  </DropdownMenuCheckboxItem>
                ))
              )}

              {selectedMonths.length > 0 && (
                <DropdownMenuCheckboxItem
                  checked={false}
                  onClick={() => setSelectedMonths([])}
                >
                  Clear filter
                </DropdownMenuCheckboxItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats */}
      {!showFarmerData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Diagnoses</p>
                  <p className="text-3xl font-bold">{stats.totalDiagnoses}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-accent/10 p-3 rounded-full">
                  <Globe className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Languages</p>
                  {Object.entries(stats.languageBreakdown).map(([l, c]) => (
                    <div key={l}>{l}: {c as number}</div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Top Products
              </h3>
              {stats.topProducts.length === 0
                ? <p className="text-sm text-muted-foreground">No product data yet</p>
                : stats.topProducts.map((p, i) => (
                  <div key={i} className="flex justify-between p-2 bg-secondary/50 rounded mb-2">
                    <span>{p.name}</span>
                    <span className="text-muted-foreground">{p.count} uses</span>
                  </div>
                ))}
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent" />
                Top Crops
              </h3>
              {stats.topCrops.length === 0
                ? <p className="text-sm text-muted-foreground">No crop data yet</p>
                : stats.topCrops.map((c, i) => (
                  <div key={i} className="flex justify-between p-2 bg-secondary/50 rounded mb-2">
                    <span>{c.name}</span>
                    <span className="text-muted-foreground">{c.count} diagnoses</span>
                  </div>
                ))}
            </Card>
          </div>
        </>
      )}

      {/* Farmer Data Table */}
      {showFarmerData && (
        <Card className="p-6 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Farmer Data Details</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadExcel}>
                Download Excel
              </Button>
              <Button variant="destructive" size="sm" onClick={clearData}>
                Clear Displayed Data
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="p-3 rounded-tl-lg">Date</th>
                  <th className="p-3">Farmer Name</th>
                  <th className="p-3">Mobile</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Crop</th>
                  <th className="p-3">Problem</th>
                  <th className="p-3">Product</th>
                  <th className="p-3 rounded-tr-lg">Lang</th>
                </tr>
              </thead>
              <tbody>
                {rawData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-muted-foreground">No data found</td>
                  </tr>
                ) : (
                  rawData.map((row) => (
                    <tr key={row.id} className="border-b last:border-0 hover:bg-secondary/20">
                      <td className="p-3">{new Date(row.timestamp).toLocaleDateString()}</td>
                      <td className="p-3 font-medium">{row.farmer_name || '-'}</td>
                      <td className="p-3">{row.farmer_mobile || '-'}</td>
                      <td className="p-3">{row.farmer_location || '-'}</td>
                      <td className="p-3">{row.crops?.name_en || 'Unknown'}</td>
                      <td className="p-3">{row.problems?.title_en || 'Unknown'}</td>
                      <td className="p-3">{row.product_name || 'Unknown'}</td>
                      <td className="p-3 uppercase">{row.language}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};