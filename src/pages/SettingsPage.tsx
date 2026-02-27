import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings, User, DollarSign, Save, Check, HelpCircle, ChevronRight, Package, Shield, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppHeader } from '@/components/AppHeader';
import { BottomNav } from '@/components/BottomNav';
import { useApp } from '@/context/AppContext';
import { useBaseIngredients } from '@/context/BaseIngredientsContext';
import { useToast } from '@/hooks/use-toast';

// Currencies organized by region
const currencies = [
  // 🌎 AMÉRICA DEL NORTE
  { code: 'CAD', symbol: 'C$', name: '🇨🇦 Dólar canadiense', region: 'América del Norte' },
  { code: 'USD', symbol: '$', name: '🇺🇸 Dólar estadounidense', region: 'América del Norte' },
  { code: 'MXN', symbol: '$', name: '🇲🇽 Peso mexicano', region: 'América del Norte' },
  
  // 🌴 AMÉRICA CENTRAL
  { code: 'BZD', symbol: 'BZ$', name: '🇧🇿 Dólar beliceño', region: 'América Central' },
  { code: 'CRC', symbol: '₡', name: '🇨🇷 Colón costarricense', region: 'América Central' },
  { code: 'GTQ', symbol: 'Q', name: '🇬🇹 Quetzal guatemalteco', region: 'América Central' },
  { code: 'HNL', symbol: 'L', name: '🇭🇳 Lempira hondureño', region: 'América Central' },
  { code: 'NIO', symbol: 'C$', name: '🇳🇮 Córdoba nicaragüense', region: 'América Central' },
  { code: 'PAB', symbol: 'B/.', name: '🇵🇦 Balboa panameño', region: 'América Central' },
  { code: 'DOP', symbol: 'RD$', name: '🇩🇴 Peso dominicano', region: 'América Central' },
  
  // 🌎 AMÉRICA DEL SUR
  { code: 'ARS', symbol: '$', name: '🇦🇷 Peso argentino', region: 'América del Sur' },
  { code: 'BOB', symbol: 'Bs', name: '🇧🇴 Boliviano', region: 'América del Sur' },
  { code: 'BRL', symbol: 'R$', name: '🇧🇷 Real brasileño', region: 'América del Sur' },
  { code: 'CLP', symbol: '$', name: '🇨🇱 Peso chileno', region: 'América del Sur' },
  { code: 'COP', symbol: '$', name: '🇨🇴 Peso colombiano', region: 'América del Sur' },
  { code: 'GYD', symbol: 'G$', name: '🇬🇾 Dólar guyanés', region: 'América del Sur' },
  { code: 'PYG', symbol: '₲', name: '🇵🇾 Guaraní paraguayo', region: 'América del Sur' },
  { code: 'PEN', symbol: 'S/', name: '🇵🇪 Sol peruano', region: 'América del Sur' },
  { code: 'SRD', symbol: 'Sr$', name: '🇸🇷 Dólar surinamés', region: 'América del Sur' },
  { code: 'UYU', symbol: '$U', name: '🇺🇾 Peso uruguayo', region: 'América del Sur' },
  { code: 'VES', symbol: 'Bs.S', name: '🇻🇪 Bolívar venezolano', region: 'América del Sur' },
  
  // 🌍 OTRAS
  { code: 'EUR', symbol: '€', name: '🇪🇺 Euro', region: 'Otras' },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, settings, updateSettings } = useApp();
  const { ingredients } = useBaseIngredients();
  const { toast } = useToast();

  const [userName, setUserName] = useState(settings.userName || user?.name || '');
  const [selectedCurrency, setSelectedCurrency] = useState(settings.currency);
  const [customSymbol, setCustomSymbol] = useState(settings.currencySymbol);
  const [saved, setSaved] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const configuredIngredients = ingredients.filter(i => i.presentationPrice > 0).length;

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) errors.push('Debe tener al menos 8 caracteres');
    if (!/[A-Z]/.test(password)) errors.push('Debe incluir al menos una letra mayúscula');
    if (!/[0-9]/.test(password)) errors.push('Debe incluir al menos un número');
    return errors;
  };

  const handleChangePassword = async () => {
    setPasswordErrors([]);

    if (!currentPassword) {
      setPasswordErrors(['Ingresa tu contraseña actual']);
      return;
    }

    const validationErrors = validatePassword(newPassword);
    if (validationErrors.length > 0) {
      setPasswordErrors(validationErrors);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrors(['Las contraseñas no coinciden']);
      return;
    }

    setPasswordLoading(true);
    try {
      // Verify current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        setPasswordErrors(['La contraseña actual es incorrecta']);
        setPasswordLoading(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setPasswordErrors([updateError.message]);
        setPasswordLoading(false);
        return;
      }

      toast({
        title: '✅ Contraseña actualizada correctamente',
        description: 'Tu nueva contraseña ya está activa.',
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordErrors(['Ocurrió un error inesperado. Intenta de nuevo.']);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCurrencyChange = (code: string) => {
    setSelectedCurrency(code);
    const currency = currencies.find(c => c.code === code);
    if (currency) {
      setCustomSymbol(currency.symbol);
    }
  };

  const handleSave = () => {
    updateSettings({
      userName: userName.trim(),
      currency: selectedCurrency,
      currencySymbol: customSymbol.trim() || '$',
    });

    setSaved(true);
    toast({
      title: '¡Configuración guardada!',
      description: 'Tus preferencias han sido actualizadas correctamente.',
    });

    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title="Configuración" />

      <main className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-caramel/20 to-cream/40 mb-4">
            <Settings className="w-7 h-7 text-caramel" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground mt-1">Personaliza tu experiencia</p>
        </motion.div>

        {/* Perfil de Usuario */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border/50 shadow-warm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose/10">
                  <User className="w-5 h-5 text-rose" />
                </div>
                <div>
                  <CardTitle className="text-lg">Perfil</CardTitle>
                  <CardDescription>Tu información personal</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userName">Nombre para mostrar</Label>
                <Input
                  id="userName"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Tu nombre"
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  Este nombre se mostrará en el saludo de la aplicación
                </p>
              </div>

              <div className="space-y-2">
                <Label>Correo electrónico</Label>
                <Input
                  value={user?.email || ''}
                  disabled
                  className="bg-muted/50"
                />
                <p className="text-xs text-muted-foreground">
                  El correo no se puede cambiar
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Configuración de Moneda */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/50 shadow-warm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-caramel/10">
                  <DollarSign className="w-5 h-5 text-caramel" />
                </div>
                <div>
                  <CardTitle className="text-lg">Moneda</CardTitle>
                  <CardDescription>Configura tu moneda local</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Selecciona una moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <span className="flex items-center gap-2">
                          <span className="font-medium">{currency.symbol}</span>
                          <span>{currency.name}</span>
                          <span className="text-muted-foreground">({currency.code})</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="symbol">Símbolo personalizado</Label>
                <Input
                  id="symbol"
                  value={customSymbol}
                  onChange={(e) => setCustomSymbol(e.target.value)}
                  placeholder="$"
                  maxLength={5}
                  className="bg-background w-24"
                />
                <p className="text-xs text-muted-foreground">
                  Este símbolo se usará para mostrar precios
                </p>
              </div>

              {/* Vista previa */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-cream/50 to-rose/10 border border-caramel/20">
                <p className="text-sm text-muted-foreground mb-1">Vista previa</p>
                <p className="text-2xl font-bold text-foreground">
                  {customSymbol}1,234.56 <span className="text-sm font-normal text-muted-foreground">{selectedCurrency}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Seguridad - Cambiar contraseña */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="border-border/50 shadow-warm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Seguridad</CardTitle>
                  <CardDescription>Cambia tu contraseña</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Contraseña actual</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-background pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres, 1 mayúscula, 1 número"
                    className="bg-background pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la nueva contraseña"
                    className="bg-background pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {passwordErrors.length > 0 && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 space-y-1">
                  {passwordErrors.map((error, i) => (
                    <p key={i} className="text-sm text-destructive">• {error}</p>
                  ))}
                </div>
              )}

              <Button
                onClick={handleChangePassword}
                disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                variant="outline"
                className="w-full"
              >
                {passwordLoading ? 'Actualizando...' : 'Cambiar contraseña'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Acceso rápido a Ingredientes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card 
            className="border-border/50 shadow-warm cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => navigate('/ingredients')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-caramel/10">
                    <Package className="w-5 h-5 text-caramel" />
                  </div>
                  <div>
                    <p className="font-medium">Control de Materia Prima</p>
                    <p className="text-sm text-muted-foreground">
                      {configuredIngredients} ingredientes con precio configurado
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Ayuda */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card 
            className="border-border/50 shadow-warm cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => navigate('/help')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <HelpCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Cómo usar la app</p>
                    <p className="text-sm text-muted-foreground">Guías y tutoriales</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
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
            disabled={saved}
          >
            {saved ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                ¡Guardado!
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Guardar cambios
              </>
            )}
          </Button>
        </motion.div>

        {/* Info adicional */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs text-muted-foreground"
        >
          Los cambios se guardan localmente en tu dispositivo
        </motion.p>
      </main>

      <BottomNav />
    </div>
  );
}
