import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, Upload, Save, Check, Eye, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppHeader } from '@/components/AppHeader';
import { BottomNav } from '@/components/BottomNav';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PDFSettings {
  businessName: string;
  businessPhone: string;
  businessEmail: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
}

const defaultSettings: PDFSettings = {
  businessName: '',
  businessPhone: '',
  businessEmail: '',
  logoUrl: null,
  primaryColor: '#E8B4B8',
  secondaryColor: '#F5E6E8',
};

export default function QuotationDesignPage() {
  const { user } = useApp();
  const { toast } = useToast();

  const [settings, setSettings] = useState<PDFSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('pdf_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading PDF settings:', error);
        return;
      }

      if (data) {
        setSettings({
          businessName: data.business_name || '',
          businessPhone: data.business_phone || '',
          businessEmail: data.business_email || '',
          logoUrl: data.logo_url,
          primaryColor: data.primary_color || '#E8B4B8',
          secondaryColor: data.secondary_color || '#F5E6E8',
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Por favor selecciona un archivo de imagen válido.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'La imagen no debe superar 2MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploadingLogo(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('business-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('business-logos')
        .getPublicUrl(fileName);

      setSettings(prev => ({ ...prev, logoUrl: publicUrl }));

      toast({
        title: '¡Logo subido!',
        description: 'Tu logo se ha cargado correctamente.',
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Error',
        description: 'No se pudo subir el logo. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setSettings(prev => ({ ...prev, logoUrl: null }));
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);

    try {
      const { data: existing } = await supabase
        .from('pdf_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const settingsData = {
        user_id: user.id,
        business_name: settings.businessName,
        business_phone: settings.businessPhone,
        business_email: settings.businessEmail,
        logo_url: settings.logoUrl,
        primary_color: settings.primaryColor,
        secondary_color: settings.secondaryColor,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        const { error } = await supabase
          .from('pdf_settings')
          .update(settingsData)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pdf_settings')
          .insert(settingsData);

        if (error) throw error;
      }

      setSaved(true);
      toast({
        title: '¡Configuración guardada!',
        description: 'Tu diseño de cotización ha sido actualizado.',
      });

      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la configuración.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader title="Diseño de Cotización" showBack />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title="Diseño de Cotización" showBack />

      <main className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-rose/40 mb-4">
            <Palette className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Diseño de Cotización</h1>
          <p className="text-muted-foreground mt-1">Personaliza la identidad visual de tus PDFs</p>
        </motion.div>

        {/* Información del negocio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border/50 shadow-warm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Información del negocio</CardTitle>
              <CardDescription>Datos que aparecerán en tus cotizaciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Nombre del negocio</Label>
                <Input
                  id="businessName"
                  value={settings.businessName}
                  onChange={(e) => setSettings(prev => ({ ...prev, businessName: e.target.value }))}
                  placeholder="Mi Pastelería"
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessPhone">Teléfono</Label>
                <Input
                  id="businessPhone"
                  value={settings.businessPhone}
                  onChange={(e) => setSettings(prev => ({ ...prev, businessPhone: e.target.value }))}
                  placeholder="+52 123 456 7890"
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessEmail">Correo electrónico</Label>
                <Input
                  id="businessEmail"
                  type="email"
                  value={settings.businessEmail}
                  onChange={(e) => setSettings(prev => ({ ...prev, businessEmail: e.target.value }))}
                  placeholder="contacto@mipasteleria.com"
                  className="bg-background"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/50 shadow-warm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Logo del negocio</CardTitle>
              <CardDescription>Aparecerá en el encabezado de tus cotizaciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.logoUrl ? (
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl border border-border overflow-hidden bg-muted">
                    <img 
                      src={settings.logoUrl} 
                      alt="Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveLogo}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Sube tu logo (máx. 2MB)
                  </p>
                  <label htmlFor="logo-upload">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={uploadingLogo}
                      asChild
                    >
                      <span>
                        {uploadingLogo ? 'Subiendo...' : 'Seleccionar imagen'}
                      </span>
                    </Button>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Colores */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-border/50 shadow-warm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Colores</CardTitle>
              <CardDescription>Define los colores de tu cotización</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Color principal</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="primaryColor"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-12 h-10 rounded-lg border border-border cursor-pointer"
                    />
                    <Input
                      value={settings.primaryColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="bg-background flex-1"
                      maxLength={7}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Color secundario</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="secondaryColor"
                      value={settings.secondaryColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-12 h-10 rounded-lg border border-border cursor-pointer"
                    />
                    <Input
                      value={settings.secondaryColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="bg-background flex-1"
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Vista previa básica */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-border/50 shadow-warm overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-lg">Vista previa</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div 
                className="p-4"
                style={{ backgroundColor: settings.secondaryColor }}
              >
                {/* Encabezado del PDF simulado */}
                <div 
                  className="rounded-xl p-4 mb-4"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  <div className="flex items-center gap-3">
                    {settings.logoUrl && (
                      <img 
                        src={settings.logoUrl} 
                        alt="Logo" 
                        className="w-12 h-12 rounded-lg object-contain bg-white/90"
                      />
                    )}
                    <div>
                      <h3 className="font-bold text-white text-lg">
                        {settings.businessName || 'Nombre del negocio'}
                      </h3>
                      <p className="text-white/80 text-xs">COTIZACIÓN</p>
                    </div>
                  </div>
                </div>

                {/* Cuerpo simulado */}
                <div className="bg-white rounded-xl p-4 space-y-3">
                  <div className="space-y-1">
                    <div className="h-3 bg-muted rounded w-1/3" />
                    <div className="h-2 bg-muted/50 rounded w-1/2" />
                  </div>
                  
                  <div 
                    className="h-8 rounded flex items-center px-3"
                    style={{ backgroundColor: settings.primaryColor }}
                  >
                    <span className="text-white text-xs font-medium">DETALLE DEL PEDIDO</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="h-2 bg-muted/50 rounded" />
                    <div className="h-2 bg-muted/50 rounded w-3/4" />
                  </div>
                </div>

                {/* Footer simulado */}
                <div className="mt-4 text-center">
                  <p className="text-xs" style={{ color: settings.primaryColor }}>
                    {settings.businessPhone && `Tel: ${settings.businessPhone}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Botón Guardar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={handleSave}
            className="w-full h-12 text-base font-semibold"
            disabled={isSaving || saved}
          >
            {saved ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                ¡Guardado!
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                {isSaving ? 'Guardando...' : 'Guardar diseño'}
              </>
            )}
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs text-muted-foreground"
        >
          Este diseño se aplicará automáticamente a todas tus cotizaciones PDF
        </motion.p>
      </main>

      <BottomNav />
    </div>
  );
}
