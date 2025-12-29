import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppHeader } from '@/components/AppHeader';
import { BottomNav } from '@/components/BottomNav';
import { QuotationForm } from '@/components/quotations/QuotationForm';
import { QuotationCard } from '@/components/quotations/QuotationCard';
import { useQuotations } from '@/hooks/useQuotations';

type FilterStatus = 'all' | 'draft' | 'sent' | 'accepted' | 'converted';

export default function QuotationsPage() {
  const { quotations } = useQuotations();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  const filteredQuotations = quotations
    .filter(q => {
      const matchesSearch = q.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.number.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || q.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const statusCounts = {
    all: quotations.length,
    draft: quotations.filter(q => q.status === 'draft').length,
    sent: quotations.filter(q => q.status === 'sent').length,
    accepted: quotations.filter(q => q.status === 'accepted').length,
    converted: quotations.filter(q => q.status === 'converted').length,
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title="Cotizaciones" />

      <div className="p-4 space-y-4">
        {/* Create Button */}
        <QuotationForm onSave={handleUpdate} />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente o número..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Tabs */}
        <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
          <TabsList className="w-full grid grid-cols-4 h-auto p-1">
            <TabsTrigger value="all" className="text-xs py-2">
              Todas ({statusCounts.all})
            </TabsTrigger>
            <TabsTrigger value="draft" className="text-xs py-2">
              Borrador ({statusCounts.draft})
            </TabsTrigger>
            <TabsTrigger value="sent" className="text-xs py-2">
              Enviadas ({statusCounts.sent})
            </TabsTrigger>
            <TabsTrigger value="converted" className="text-xs py-2">
              Pedidos ({statusCounts.converted})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Quotations List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredQuotations.map(quotation => (
              <QuotationCard 
                key={quotation.id} 
                quotation={quotation} 
                onUpdate={handleUpdate}
              />
            ))}
          </AnimatePresence>

          {filteredQuotations.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-foreground mb-1">
                {quotations.length === 0 ? 'Sin cotizaciones' : 'Sin resultados'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {quotations.length === 0 
                  ? 'Crea tu primera cotización profesional'
                  : 'Intenta con otros filtros de búsqueda'
                }
              </p>
            </motion.div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
