export type PDFStyle = 'minimal' | 'elegant' | 'sweet' | 'professional';

export interface PDFSettings {
  id?: string;
  userId?: string;
  businessName: string;
  businessPhone: string;
  businessEmail: string;
  logoUrl: string | null;
  primaryColor: string;
  style: PDFStyle;
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_PDF_SETTINGS: PDFSettings = {
  businessName: '',
  businessPhone: '',
  businessEmail: '',
  logoUrl: null,
  primaryColor: '#5D4037',
  style: 'professional',
};

export const PDF_STYLE_OPTIONS: { value: PDFStyle; label: string; description: string }[] = [
  { value: 'minimal', label: 'Minimal', description: 'Limpio y moderno' },
  { value: 'elegant', label: 'Elegante', description: 'Sofisticado y refinado' },
  { value: 'sweet', label: 'Dulce', description: 'Cálido y acogedor' },
  { value: 'professional', label: 'Profesional', description: 'Corporativo y serio' },
];

export const COLOR_PRESETS = [
  { name: 'Chocolate', color: '#5D4037' },
  { name: 'Rosa', color: '#D4A5A5' },
  { name: 'Caramelo', color: '#C4A35A' },
  { name: 'Vainilla', color: '#D4B896' },
  { name: 'Menta', color: '#7CB9A8' },
  { name: 'Lavanda', color: '#9B8AA6' },
  { name: 'Coral', color: '#E07B6A' },
  { name: 'Azul', color: '#5B7FA3' },
];
