import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ImageUploadWithCrop } from './ImageUploadWithCrop';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { User, Camera } from 'lucide-react';

export const ProfilePictureUpload = () => {
  const { user, updateAvatar } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleImageCropped = async (file: File) => {
    if (!user) return;
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      await updateAvatar(publicUrl);
      toast.success('Profile picture updated');
      setOpen(false);
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      // If it's a storage policy error, provide more helpful message
      if (error?.message?.includes('row-level security')) {
        toast.error('You need to be logged in to upload images');
      } else {
        toast.error('Failed to upload profile picture');
      }
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="relative group cursor-pointer">
          <Avatar className="w-20 h-20 border-2 border-primary">
            <AvatarImage src={user.avatar_url} alt={user.username} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white" />
          </div>
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Profile Picture</DialogTitle>
        </DialogHeader>
        <ImageUploadWithCrop
          onImageCropped={handleImageCropped}
          aspectRatio={1}
          label="Choose Profile Picture"
          currentImage={user.avatar_url}
        />
      </DialogContent>
    </Dialog>
  );
};