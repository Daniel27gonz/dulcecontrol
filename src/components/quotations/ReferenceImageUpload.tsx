import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, ImageIcon, Loader2, Cake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ReferenceImageUploadProps {
  imageUrl: string | null;
  onImageChange: (url: string | null) => void;
}

export function ReferenceImageUpload({ imageUrl, onImageChange }: ReferenceImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Archivo no válido',
        description: 'Por favor selecciona una imagen (JPG, PNG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Archivo muy grande',
        description: 'La imagen debe ser menor a 2MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({
          title: 'Error',
          description: 'Debes iniciar sesión para subir una imagen',
          variant: 'destructive',
        });
        return;
      }

      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/default-reference-${Date.now()}.${fileExt}`;

      // Delete old image if exists
      if (imageUrl) {
        const oldPath = imageUrl.split('/business-logos/')[1];
        if (oldPath) {
          await supabase.storage.from('business-logos').remove([oldPath]);
        }
      }

      // Upload new image
      const { error: uploadError } = await supabase.storage
        .from('business-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: 'Error al subir',
          description: 'No se pudo subir la imagen. Intenta de nuevo.',
          variant: 'destructive',
        });
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('business-logos')
        .getPublicUrl(fileName);

      onImageChange(publicUrl);
      toast({
        title: '¡Imagen subida!',
        description: 'Tu imagen de referencia se ha guardado',
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al subir la imagen',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    if (!imageUrl) return;

    try {
      const path = imageUrl.split('/business-logos/')[1];
      if (path) {
        await supabase.storage.from('business-logos').remove([path]);
      }
      onImageChange(null);
      toast({
        title: 'Imagen eliminada',
        description: 'Se ha eliminado la imagen de referencia',
      });
    } catch (error) {
      console.error('Error removing image:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la imagen',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      <AnimatePresence mode="wait">
        {imageUrl ? (
          <motion.div
            key="image-preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative group"
          >
            <div className="w-full h-32 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 flex items-center justify-center overflow-hidden">
              <img
                src={imageUrl}
                alt="Imagen de referencia del postre"
                className="max-h-28 max-w-full object-contain"
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleRemoveImage}
            >
              <X className="h-3 w-3" />
            </Button>
          </motion.div>
        ) : (
          <motion.button
            key="upload-button"
            type="button"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={cn(
              'w-full h-32 rounded-lg border-2 border-dashed transition-all',
              'flex flex-col items-center justify-center gap-2',
              'hover:border-primary/50 hover:bg-primary/5',
              isUploading
                ? 'border-primary/30 bg-primary/5 cursor-wait'
                : 'border-muted-foreground/30 cursor-pointer'
            )}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
                <span className="text-xs text-muted-foreground">Subiendo...</span>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Cake className="h-6 w-6 text-primary" />
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Upload className="h-3 w-3" />
                  <span>Subir imagen de postre</span>
                </div>
              </>
            )}
          </motion.button>
        )}
      </AnimatePresence>
      
      <p className="text-xs text-muted-foreground text-center">
        Formatos: JPG, PNG • Máx: 2MB
      </p>
    </div>
  );
}
