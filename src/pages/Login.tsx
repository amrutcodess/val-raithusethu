import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Shield, LogIn as LoginIcon, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const { role } = useParams<{ role: 'admin' | 'manager' }>();
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Please enter username and password');
      return;
    }

    setLoading(true);
    const success = await login(username, password);
    setLoading(false);

    if (success) {
      toast.success('Login successful!');
      navigate(role === 'admin' ? '/admin/dashboard' : '/manager/dashboard');
    } else {
      toast.error('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('backToHome')}
        </Button>

        <Card className="p-8 shadow-agricultural animate-fade-in">
          <div className="flex flex-col items-center gap-6">
            <div className="bg-primary/10 p-6 rounded-full">
              {role === 'admin' ? (
                <Shield className="w-12 h-12 text-primary" />
              ) : (
                <LoginIcon className="w-12 h-12 text-primary" />
              )}
            </div>

            <div className="text-center">
              <h1 className="text-3xl font-display font-bold text-gradient-primary mb-2">
                {role === 'admin' ? t('loginAdmin') : t('loginManager')}
              </h1>
              <p className="text-muted-foreground">
                Enter your credentials to continue
              </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    disabled={loading}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
