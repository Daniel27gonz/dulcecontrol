import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface LogoUploadProps {
  logoUrl: string | null;
  onLogoChange: (url: string | null) => void;
}

export function LogoUpload({ logoUrl, onLogoChange }: LogoUploadProps) {
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

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Archivo muy grande',
        description: 'El logo debe ser menor a 5MB',
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
          description: 'Debes iniciar sesión para subir un logo',
          variant: 'destructive',
        });
        return;
      }

      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/logo-${Date.now()}.${fileExt}`;

      // Delete old logo if exists
      if (logoUrl) {
        const oldPath = logoUrl.split('/business-logos/')[1];
        if (oldPath) {
          await supabase.storage.from('business-logos').remove([oldPath]);
        }
      }

      // Upload new logo
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
          description: 'No se pudo subir el logo. Intenta de nuevo.',
          variant: 'destructive',
        });
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('business-logos')
        .getPublicUrl(fileName);

      onLogoChange(publicUrl);
      toast({
        title: '¡Logo subido!',
        description: 'Tu logo se ha guardado correctamente',
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al subir el logo',
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

  const handleRemoveLogo = async () => {
    if (!logoUrl) return;

    try {
      const path = logoUrl.split('/business-logos/')[1];
      if (path) {
        await supabase.storage.from('business-logos').remove([path]);
      }
      onLogoChange(null);
      toast({
        title: 'Logo eliminado',
        description: 'Se ha eliminado el logo',
      });
    } catch (error) {
      console.error('Error removing logo:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el logo',
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
        {logoUrl ? (
          <motion.div
            key="logo-preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative group"
          >
            <div className="w-full h-28 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 flex items-center justify-center overflow-hidden p-2">
              <img
                src={logoUrl}
                alt="Logo del negocio"
                className="max-h-24 max-w-full object-contain"
                style={{ imageRendering: 'auto' }}
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleRemoveLogo}
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
              'w-full h-24 rounded-lg border-2 border-dashed transition-all',
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
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Upload className="h-3 w-3" />
                  <span>Subir logo (opcional)</span>
                </div>
              </>
            )}
          </motion.button>
        )}
      </AnimatePresence>
      
      <p className="text-xs text-muted-foreground text-center">
        Formatos: JPG, PNG • Máx: 5MB
      </p>
    </div>
  );
}
