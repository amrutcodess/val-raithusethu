import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Users, Key, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';

export const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'manager' as 'admin' | 'manager',
  });
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      setUsers(data || []);
    } catch (error) {
      toast.error('Failed to load users');
    }
  };

  // Simple hash function for passwords
  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Hash the password before storing
      const hashedPassword = await hashPassword(formData.password);
      
      const { error } = await supabase.from('users').insert([{
        username: formData.username,
        password_hash: hashedPassword,
        role: formData.role,
      }]);

      if (error) throw error;
      
      toast.success('User created successfully');
      setShowDialog(false);
      setFormData({ username: '', password: '', role: 'manager' });
      fetchUsers();
    } catch (error) {
      toast.error('Failed to create user');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Hash the password before storing
      const hashedPassword = await hashPassword(newPassword);
      
      const { error } = await supabase
        .from('users')
        .update({ password_hash: hashedPassword })
        .eq('id', selectedUser.id);

      if (error) throw error;
      
      toast.success('Password reset successfully');
      setShowResetDialog(false);
      setNewPassword('');
      setSelectedUser(null);
    } catch (error) {
      toast.error('Failed to reset password');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) throw error;
      
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold">User Management</h2>
        <Button onClick={() => setShowDialog(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12 border-2 border-primary">
                  <AvatarImage src={user.avatar_url} alt={user.username} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{user.username}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedUser(user);
                    setShowResetDialog(true);
                  }}
                >
                  <Key className="w-4 h-4 mr-2" />
                  Reset Password
                </Button>
                {currentUser?.role === 'admin' && user.id !== currentUser.id && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete User?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the user "{user.username}". This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <Label>Username</Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={formData.role} onValueChange={(val: any) => setFormData({ ...formData, role: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">Create User</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password for {selectedUser?.username}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">Reset Password</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
