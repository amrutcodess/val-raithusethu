import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Shield, Database, Users, CheckCircle, BarChart3 } from 'lucide-react';
import { CropManagement } from '@/components/admin/CropManagement';
import { ProblemManagement } from '@/components/admin/ProblemManagement';
import { ProductManagement } from '@/components/admin/ProductManagement';
import { SubmissionApprovals } from '@/components/admin/SubmissionApprovals';
import { UserManagement } from '@/components/admin/UserManagement';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { ProfilePictureUpload } from '@/components/ProfilePictureUpload';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('crops');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <div className="container mx-auto px-4 py-8">
        <Card className="p-4 sm:p-6 mb-6 shadow-agricultural">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <ProfilePictureUpload />
              <div>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-gradient-primary">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">Welcome, {user?.username}</p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm" className="w-full sm:w-auto">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mb-6 h-auto">
            <TabsTrigger value="crops" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <Database className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Crops</span>
            </TabsTrigger>
            <TabsTrigger value="problems" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <Database className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Problems</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <Database className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Products</span>
            </TabsTrigger>
            <TabsTrigger value="approvals" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Approvals</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="crops">
            <CropManagement />
          </TabsContent>

          <TabsContent value="problems">
            <ProblemManagement />
          </TabsContent>

          <TabsContent value="products">
            <ProductManagement />
          </TabsContent>

          <TabsContent value="approvals">
            <SubmissionApprovals />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
