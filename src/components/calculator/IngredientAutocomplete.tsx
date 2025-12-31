import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useBaseIngredients, BaseIngredient } from '@/context/BaseIngredientsContext';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

interface IngredientAutocompleteProps {
  value: string;
  onSelect: (ingredient: { name: string; pricePerUnit: number; unit: string }) => void;
  onChange: (value: string) => void;
  placeholder?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  harinas: '🌾 Harinas',
  azucares: '🍬 Azúcares',
  lacteos: '🥛 Lácteos',
  huevos: '🥚 Huevos',
  grasas: '🧈 Grasas',
  chocolates: '🍫 Chocolates',
  levaduras: '🧪 Levaduras',
  esencias: '✨ Esencias',
  frutos_secos: '🥜 Frutos Secos',
  frutas: '🍓 Frutas',
  colorantes: '🎨 Colorantes',
  rellenos: '🍯 Rellenos',
  coberturas: '🍰 Coberturas',
  otros: '📦 Otros',
};

export function IngredientAutocomplete({
  value,
  onSelect,
  onChange,
  placeholder = "Buscar o escribir ingrediente..."
}: IngredientAutocompleteProps) {
  const { ingredients: baseIngredients, getIngredientsByCategory } = useBaseIngredients();
  const { settings } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter ingredients based on search
  const filteredIngredients = baseIngredients.filter(ing =>
    ing.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group filtered ingredients by category
  const groupedIngredients = filteredIngredients.reduce((acc, ing) => {
    if (!acc[ing.category]) {
      acc[ing.category] = [];
    }
    acc[ing.category].push(ing);
    return acc;
  }, {} as Record<string, BaseIngredient[]>);

  const handleInputClick = () => {
    setIsOpen(true);
    setSearchTerm(value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  const handleSelectIngredient = (ingredient: BaseIngredient) => {
    onSelect({
      name: ingredient.name,
      pricePerUnit: ingredient.pricePerUnit,
      unit: ingredient.unit,
    });
    setSearchTerm(ingredient.name);
    setIsOpen(false);
  };

  const categories = Object.keys(groupedIngredients).sort();
  const hasConfiguredIngredients = baseIngredients.some(ing => ing.pricePerUnit > 0);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onClick={handleInputClick}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-muted rounded-lg transition-colors"
        >
          <ChevronDown className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-xl shadow-lg max-h-72 overflow-hidden">
          {/* Search header */}
          <div className="sticky top-0 bg-popover border-b border-border p-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  onChange(e.target.value);
                }}
                placeholder="Filtrar ingredientes..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-muted rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>
          </div>

          {/* Ingredient list */}
          <div className="overflow-y-auto max-h-56">
            {!hasConfiguredIngredients && (
              <div className="p-4 text-center">
                <Package className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Configura los precios en <strong>Configuración → Control de Materia Prima</strong>
                </p>
              </div>
            )}

            {categories.length === 0 && searchTerm && (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  No se encontraron ingredientes
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Puedes escribir un ingrediente personalizado
                </p>
              </div>
            )}

            {categories.map(category => (
              <div key={category}>
                <div className="sticky top-0 bg-muted/80 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                  {CATEGORY_LABELS[category] || category}
                </div>
                {groupedIngredients[category].map(ingredient => (
                  <button
                    key={ingredient.id}
                    type="button"
                    onClick={() => handleSelectIngredient(ingredient)}
                    className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-muted transition-colors text-left"
                  >
                    <div>
                      <span className="text-sm font-medium">{ingredient.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({ingredient.unit})
                      </span>
                    </div>
                    <div className="text-right">
                      {ingredient.pricePerUnit > 0 ? (
                        <span className="text-sm font-semibold text-primary">
                          {settings.currencySymbol}{ingredient.pricePerUnit.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Sin precio
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Footer hint */}
          <div className="sticky bottom-0 bg-muted/80 backdrop-blur-sm border-t border-border px-3 py-2">
            <p className="text-xs text-muted-foreground text-center">
              💡 Los precios se administran desde Configuración
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
