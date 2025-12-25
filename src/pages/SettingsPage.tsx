import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, User, DollarSign, Save, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppHeader } from '@/components/AppHeader';
import { BottomNav } from '@/components/BottomNav';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';

const currencies = [
  { code: 'USD', symbol: '$', name: 'Dólar estadounidense' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'MXN', symbol: '$', name: 'Peso mexicano' },
  { code: 'ARS', symbol: '$', name: 'Peso argentino' },
  { code: 'COP', symbol: '$', name: 'Peso colombiano' },
  { code: 'PEN', symbol: 'S/', name: 'Sol peruano' },
  { code: 'CLP', symbol: '$', name: 'Peso chileno' },
  { code: 'BRL', symbol: 'R$', name: 'Real brasileño' },
  { code: 'UYU', symbol: '$U', name: 'Peso uruguayo' },
  { code: 'BOB', symbol: 'Bs', name: 'Boliviano' },
];

export default function SettingsPage() {
  const { user, settings, updateSettings } = useApp();
  const { toast } = useToast();

  const [userName, setUserName] = useState(settings.userName || user?.name || '');
  const [selectedCurrency, setSelectedCurrency] = useState(settings.currency);
  const [customSymbol, setCustomSymbol] = useState(settings.currencySymbol);
  const [saved, setSaved] = useState(false);

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

        {/* Botón Guardar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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
          transition={{ delay: 0.4 }}
          className="text-center text-xs text-muted-foreground"
        >
          Los cambios se guardan localmente en tu dispositivo
        </motion.p>
      </main>

      <BottomNav />
    </div>
  );
}
