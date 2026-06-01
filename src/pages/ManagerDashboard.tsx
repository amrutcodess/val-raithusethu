import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, LogIn, PlusCircle, BarChart3, FileText } from 'lucide-react';
import { ManagerSubmissions } from '@/components/manager/ManagerSubmissions';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { ProposalForm } from '@/components/manager/ProposalForm';
import { ProfilePictureUpload } from '@/components/ProfilePictureUpload';

const ManagerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('submissions');

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
                  Manager Dashboard
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
          <TabsList className="grid w-full grid-cols-3 mb-6 h-auto">
            <TabsTrigger value="submissions" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">My Submissions</span>
              <span className="sm:hidden">Submissions</span>
            </TabsTrigger>
            <TabsTrigger value="propose" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <PlusCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">New Proposal</span>
              <span className="sm:hidden">Propose</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submissions">
            <ManagerSubmissions />
          </TabsContent>

          <TabsContent value="propose">
            <ProposalForm />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ManagerDashboard;
