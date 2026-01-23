export type PDFStyle = 'pastel' | 'minimal' | 'elegant';
export type LogoPosition = 'left' | 'center' | 'right';

export interface PDFSettings {
  id?: string;
  userId?: string;
  businessName: string;
  businessPhone: string;
  businessEmail: string;
  logoUrl: string | null;
  logoPosition: LogoPosition;
  primaryColor: string;
  secondaryColor: string;
  style: PDFStyle;
  // Campos editables de la cotización
  quotationTitle: string;
  eventDateLabel: string;
  validUntilLabel: string;
  eventTypeLabel: string;
  observationsText: string;
  footerMessage: string;
  thankYouMessage: string;
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_PDF_SETTINGS: PDFSettings = {
  businessName: '',
  businessPhone: '',
  businessEmail: '',
  logoUrl: null,
  logoPosition: 'center',
  primaryColor: '#F8BBD9', // Rosa pastel
  secondaryColor: '#FFF0F5', // Lavanda muy claro
  style: 'pastel',
  quotationTitle: 'COTIZACIÓN DE POSTRES ARTESANALES',
  eventDateLabel: 'Fecha de entrega',
  validUntilLabel: 'Válida hasta',
  eventTypeLabel: 'Tipo de evento (opcional)',
  observationsText: '',
  footerMessage: 'Esta cotización ha sido elaborada considerando ingredientes de calidad, tiempo de preparación y dedicación artesanal para brindarte un resultado delicioso.',
  thankYouMessage: 'Gracias por confiar en mi trabajo para endulzar tus momentos',
};

export const LOGO_POSITION_OPTIONS: { value: LogoPosition; label: string }[] = [
  { value: 'left', label: 'Izquierda' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Derecha' },
];

export const PDF_STYLE_OPTIONS: { value: PDFStyle; label: string; description: string; preview: string }[] = [
  { 
    value: 'pastel', 
    label: 'Pastel', 
    description: 'Cálido y artesanal',
    preview: 'Rosa suave con decoraciones de postres'
  },
  { 
    value: 'minimal', 
    label: 'Minimal', 
    description: 'Limpio y moderno',
    preview: 'Líneas simples y elegantes'
  },
  { 
    value: 'elegant', 
    label: 'Elegante', 
    description: 'Sofisticado y refinado',
    preview: 'Bordes decorativos clásicos'
  },
];

export const COLOR_PRESETS = [
  { name: 'Rosa Pastel', color: '#F8BBD9', secondary: '#FFF0F5' },
  { name: 'Melocotón', color: '#FFCCBC', secondary: '#FFF3E0' },
  { name: 'Lavanda', color: '#D1C4E9', secondary: '#F3E5F5' },
  { name: 'Menta', color: '#B2DFDB', secondary: '#E0F2F1' },
  { name: 'Vainilla', color: '#FFE0B2', secondary: '#FFF8E1' },
  { name: 'Chocolate', color: '#BCAAA4', secondary: '#EFEBE9' },
  { name: 'Fresa', color: '#F48FB1', secondary: '#FCE4EC' },
  { name: 'Cielo', color: '#90CAF9', secondary: '#E3F2FD' },
];
