import { useState, useRef } from 'react';
import ReactCrop, {
  Crop,
  PixelCrop,
  centerCrop,
  makeAspectCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css'; // REQUIRED: This makes the drag handles visible
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface ImageUploadWithCropProps {
  onImageCropped: (file: File) => void;
  aspectRatio?: number; // Kept for interface compatibility, but ignored in logic below
  label?: string;
  currentImage?: string;
}

// Helper to calculate an initial centered crop area
function centerAspectCrop(mediaWidth: number, mediaHeight: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 80, // Start with an 80% width selection
      },
      mediaWidth / mediaHeight, // Use the image's own aspect ratio (free form)
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export const ImageUploadWithCrop = ({
  onImageCropped,
  label = 'Upload Image',
  currentImage,
}: ImageUploadWithCropProps) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setShowDialog(true);
    };
    reader.readAsDataURL(file);
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    // Initialize the crop box centered
    setCrop(centerAspectCrop(width, height));
  };

  const compressToTargetSize = async (
    canvas: HTMLCanvasElement,
    targetKB = 100
  ): Promise<Blob> => {
    let quality = 0.9;
    let blob: Blob | null = null;

    // Iteratively lower quality until file size is under target
    while (quality >= 0.4) {
      blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
      );

      if (blob && blob.size / 1024 <= targetKB) {
        return blob;
      }
      quality -= 0.05;
    }

    if (!blob) throw new Error('Compression failed');
    return blob;
  };

  const createCroppedImage = async () => {
    if (!imgRef.current || !completedCrop) return;

    const image = imgRef.current;
    const crop = completedCrop;

    if (crop.width === 0 || crop.height === 0) {
      toast.error('Please select an area to crop');
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Handle scaling (if image is rendered at different size than natural)
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = crop.width * scaleX;
      canvas.height = crop.height * scaleY;

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const compressedBlob = await compressToTargetSize(canvas, 100);

      const file = new File([compressedBlob], 'product-image.jpg', {
        type: 'image/jpeg',
      });

      onImageCropped(file);
      setShowDialog(false);
      setImageSrc(null);
      toast.success('Image saved (optimized)');
    } catch (error) {
      console.error(error);
      toast.error('Failed to process image');
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      <div className="flex items-center gap-4">
        {currentImage && (
          <img
            src={currentImage}
            alt="Current"
            className="w-20 h-20 object-cover rounded-lg border"
          />
        )}

        <Input
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="cursor-pointer"
        />
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
          </DialogHeader>

          {/* Container for the crop tool */}
          <div className="flex justify-center bg-muted p-4 rounded-md">
            {imageSrc && (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={undefined} // ✅ FIXED: Forced undefined ensures free-form dragging
                className="max-h-[60vh]"
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop preview"
                  onLoad={onImageLoad}
                  style={{ maxHeight: '60vh', width: 'auto' }}
                />
              </ReactCrop>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createCroppedImage}>Crop & Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};