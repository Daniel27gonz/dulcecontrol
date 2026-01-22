import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PDFSettings, DEFAULT_PDF_SETTINGS } from '@/types/pdfSettings';
import { toast } from '@/hooks/use-toast';

export function usePDFSettings() {
  const [settings, setSettings] = useState<PDFSettings>(DEFAULT_PDF_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('pdf_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading PDF settings:', error);
        return;
      }

      if (data) {
        setSettings({
          id: data.id,
          userId: data.user_id,
          businessName: data.business_name || '',
          businessPhone: data.business_phone || '',
          businessEmail: data.business_email || '',
          logoUrl: data.logo_url,
          primaryColor: data.primary_color || '#5D4037',
          style: data.style as PDFSettings['style'],
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });
      }
    } catch (error) {
      console.error('Error loading PDF settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = async (newSettings: Partial<PDFSettings>): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({
          title: 'Error',
          description: 'Debes iniciar sesión para guardar la configuración',
          variant: 'destructive',
        });
        return false;
      }

      const dbData = {
        user_id: session.user.id,
        business_name: newSettings.businessName ?? settings.businessName,
        business_phone: newSettings.businessPhone ?? settings.businessPhone,
        business_email: newSettings.businessEmail ?? settings.businessEmail,
        logo_url: newSettings.logoUrl ?? settings.logoUrl,
        primary_color: newSettings.primaryColor ?? settings.primaryColor,
        style: newSettings.style ?? settings.style,
      };

      const { error } = await supabase
        .from('pdf_settings')
        .upsert(dbData, { onConflict: 'user_id' });

      if (error) {
        console.error('Error saving PDF settings:', error);
        toast({
          title: 'Error',
          description: 'No se pudo guardar la configuración',
          variant: 'destructive',
        });
        return false;
      }

      setSettings(prev => ({ ...prev, ...newSettings }));
      toast({
        title: 'Configuración guardada',
        description: 'Tu configuración de PDF se ha guardado correctamente',
      });
      return true;
    } catch (error) {
      console.error('Error saving PDF settings:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la configuración',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateSettings = (newSettings: Partial<PDFSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return {
    settings,
    isLoading,
    saveSettings,
    updateSettings,
    refreshSettings: loadSettings,
  };
}
