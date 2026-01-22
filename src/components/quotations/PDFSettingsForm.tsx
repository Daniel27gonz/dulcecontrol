import { useState } from 'react';
import { motion } from 'framer-motion';
import { Palette, Building2, Phone, Mail, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  PDFSettings,
  PDFStyle,
  PDF_STYLE_OPTIONS,
  COLOR_PRESETS,
} from '@/types/pdfSettings';
import { cn } from '@/lib/utils';

interface PDFSettingsFormProps {
  settings: PDFSettings;
  onSettingsChange: (settings: Partial<PDFSettings>) => void;
  onSave: () => Promise<boolean>;
  isSaving?: boolean;
}

export function PDFSettingsForm({
  settings,
  onSettingsChange,
  onSave,
  isSaving = false,
}: PDFSettingsFormProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleStyleChange = (style: PDFStyle) => {
    onSettingsChange({ style });
  };

  const handleColorChange = (color: string) => {
    onSettingsChange({ primaryColor: color });
  };

  return (
    <div className="space-y-6">
      {/* Business Identity */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Building2 className="w-5 h-5" />
          <h3 className="font-semibold">Identidad del negocio</h3>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="businessName">Nombre del negocio</Label>
            <Input
              id="businessName"
              placeholder="Mi Pastelería"
              value={settings.businessName}
              onChange={(e) => onSettingsChange({ businessName: e.target.value.slice(0, 100) })}
              className="mt-1"
              maxLength={100}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="businessPhone" className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                Teléfono
              </Label>
              <Input
                id="businessPhone"
                placeholder="555-123-4567"
                value={settings.businessPhone}
                onChange={(e) => onSettingsChange({ businessPhone: e.target.value.slice(0, 20) })}
                className="mt-1"
                maxLength={20}
              />
            </div>
            <div>
              <Label htmlFor="businessEmail" className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                Email
              </Label>
              <Input
                id="businessEmail"
                type="email"
                placeholder="info@miempresa.com"
                value={settings.businessEmail}
                onChange={(e) => onSettingsChange({ businessEmail: e.target.value.slice(0, 100) })}
                className="mt-1"
                maxLength={100}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Visual Style */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Palette className="w-5 h-5" />
          <h3 className="font-semibold">Estilo visual</h3>
        </div>

        {/* Style selector */}
        <div>
          <Label>Estilo del documento</Label>
          <RadioGroup
            value={settings.style}
            onValueChange={(val) => handleStyleChange(val as PDFStyle)}
            className="grid grid-cols-2 gap-2 mt-2"
          >
            {PDF_STYLE_OPTIONS.map((option) => (
              <div key={option.value}>
                <RadioGroupItem
                  value={option.value}
                  id={option.value}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={option.value}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all',
                    'hover:border-primary/50 hover:bg-primary/5',
                    settings.style === option.value
                      ? 'border-primary bg-primary/10'
                      : 'border-muted'
                  )}
                >
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Color selector */}
        <div>
          <Label>Color principal</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {COLOR_PRESETS.map((preset) => (
              <motion.button
                key={preset.color}
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleColorChange(preset.color)}
                className={cn(
                  'w-10 h-10 rounded-full relative transition-all',
                  'ring-2 ring-offset-2 ring-offset-background',
                  settings.primaryColor === preset.color
                    ? 'ring-primary'
                    : 'ring-transparent hover:ring-muted-foreground/30'
                )}
                style={{ backgroundColor: preset.color }}
                title={preset.name}
              >
                {settings.primaryColor === preset.color && (
                  <Check className="w-5 h-5 text-white absolute inset-0 m-auto" />
                )}
              </motion.button>
            ))}

            {/* Custom color picker */}
            <div className="relative">
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowColorPicker(!showColorPicker)}
                className={cn(
                  'w-10 h-10 rounded-full border-2 border-dashed border-muted-foreground/30',
                  'flex items-center justify-center bg-background',
                  'hover:border-primary/50'
                )}
                title="Color personalizado"
              >
                <Palette className="w-4 h-4 text-muted-foreground" />
              </motion.button>

              {showColorPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-12 left-0 z-10 bg-background border rounded-lg p-3 shadow-lg"
                >
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-24 h-24 cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    {settings.primaryColor}
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save button */}
      <Button
        onClick={onSave}
        disabled={isSaving}
        className="w-full"
        variant="warm"
      >
        {isSaving ? 'Guardando...' : 'Guardar configuración'}
      </Button>
    </div>
  );
}
