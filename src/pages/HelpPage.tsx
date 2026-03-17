import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calculator, BookOpen, ShoppingCart, Wallet, FileText, ChevronDown, Lightbulb, Target, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const HelpPage = () => {
  const navigate = useNavigate();

  const modules = [
    {
      id: "calculator",
      title: "Calculadora de Costos",
      icon: Calculator,
      color: "text-primary",
      bgColor: "bg-primary/10",
      description: "Aprende a calcular el costo real de tus productos",
      guides: [
        {
          question: "¿Cómo agrego ingredientes?",
          answer: `1. Ve a la Calculadora desde el menú inferior
2. Dale un nombre a tu receta (ej: "Torta de Chocolate")
3. Selecciona una categoría
4. En "Ingredientes", toca "Agregar ingrediente"
5. Escribe el nombre del ingrediente
6. Ingresa la cantidad que usas y el precio por unidad

💡 Ejemplo: Si usas 500g de harina y el kilo cuesta $2,000, pon:
- Cantidad: 500
- Unidad: g
- Precio por unidad: $2 (porque 2000/1000 = 2 por gramo)`
        },
        {
          question: "¿Qué son los gastos indirectos?",
          answer: `Los gastos indirectos son costos que no van directo al producto pero igual afectan tu negocio:

🔥 Gas: El gas que usas para hornear
💡 Luz: La electricidad del horno, batidora, etc.
📦 Empaque: Cajas, bolsas, cintas, etiquetas
⏱️ Mano de obra: Tu tiempo y trabajo

💡 ¿Cómo calcularlos?
- Gas: Si un tanque cuesta $500 y te dura 20 horneadas, cada horneada = $25
- Luz: Estima cuánto sube tu recibo cuando cocinas
- Empaque: Suma cajas + bolsas + decoración por producto
- Mano de obra: ¿Cuánto vale tu hora? × horas que tardas`
        },
        {
          question: "¿Cómo fijo mi margen de ganancia?",
          answer: `El margen de ganancia es el porcentaje extra que agregas sobre tu costo para obtener tu ganancia.

📊 Márgenes recomendados:
- Productos básicos (galletas, pan): 30-50%
- Productos elaborados (tortas, pasteles): 50-80%
- Productos premium (personalizados, bodas): 80-150%

💡 Ejemplo práctico:
Si tu torta cuesta $500 en ingredientes + gastos:
- Con 50% de margen: $500 × 1.50 = $750 precio de venta
- Con 80% de margen: $500 × 1.80 = $900 precio de venta

⚠️ Considera tu mercado: ¿Qué precios maneja tu competencia?`
        },
        {
          question: "¿Cómo sé si mi precio es correcto?",
          answer: `Tu precio es correcto cuando:

✅ Cubre TODOS tus costos (ingredientes + gastos indirectos)
✅ Te deja una ganancia justa por tu trabajo
✅ Es competitivo en tu mercado
✅ Tus clientes están dispuestos a pagarlo

🔴 Señales de que tu precio está MAL:
- Trabajas mucho pero no ves ganancias
- Tus clientes siempre regatean
- No puedes comprar ingredientes de calidad

💡 Tip: Revisa tus precios cada 3 meses o cuando suban los ingredientes`
        }
      ]
    },
    {
      id: "recipes",
      title: "Mis Recetas",
      icon: BookOpen,
      color: "text-accent",
      bgColor: "bg-accent/10",
      description: "Organiza y consulta todas tus recetas guardadas",
      guides: [
        {
          question: "¿Cómo guardo una receta?",
          answer: `1. Calcula tu receta en la Calculadora
2. Revisa que todos los datos estén correctos
3. Toca "Guardar receta"
4. ¡Listo! La encontrarás en "Mis Recetas"

💡 Puedes guardar todas las recetas que quieras y consultarlas cuando necesites.`
        },
        {
          question: "¿Cómo edito una receta existente?",
          answer: `1. Ve a "Mis Recetas"
2. Busca la receta que quieres modificar
3. Toca los tres puntos (⋮) o "Ver detalles"
4. Selecciona "Editar receta"
5. Modifica lo que necesites
6. Guarda los cambios

💡 Útil cuando cambian los precios de tus ingredientes o quieres ajustar el margen.`
        },
        {
          question: "¿Puedo usar mis recetas en cotizaciones?",
          answer: `¡Sí! Cuando creas una cotización:

1. Ve a "Cotizar" en el menú
2. Toca "Nueva cotización"
3. En productos, selecciona "Agregar de recetas"
4. Elige las recetas que quieres incluir
5. El precio se calcula automáticamente

💡 Esto te ahorra tiempo y asegura que siempre cobres el precio correcto.`
        }
      ]
    },
    {
      id: "orders",
      title: "Pedidos",
      icon: ShoppingCart,
      color: "text-warning",
      bgColor: "bg-warning/10",
      description: "Gestiona tus pedidos y entregas",
      guides: [
        {
          question: "¿Cómo registro un pedido?",
          answer: `1. Ve a "Pedidos" en el menú inferior
2. Toca el botón "+" para nuevo pedido
3. Llena los datos:
   - Nombre del cliente
   - Teléfono (para contactarlo)
   - Productos que pidió
   - Fecha de entrega
   - Total a cobrar
4. Guarda el pedido

💡 Puedes convertir una cotización aceptada en pedido automáticamente.`
        },
        {
          question: "¿Cómo manejo los estados del pedido?",
          answer: `Cada pedido tiene un estado:

🟡 Pendiente: Recién registrado, falta preparar
🔵 En proceso: Ya estás trabajando en él
🟢 Completado: Entregado y pagado
🔴 Cancelado: El cliente canceló

💡 Actualiza el estado para llevar control de tu producción y no olvidar entregas.`
        },
        {
          question: "¿Cómo veo mis próximas entregas?",
          answer: `En el Dashboard (pantalla principal):

1. Verás "Próximos pedidos" con las entregas más cercanas
2. Cada tarjeta muestra cliente, fecha y productos
3. Toca un pedido para ver todos los detalles

💡 Revisa esto cada mañana para planificar tu día de trabajo.`
        }
      ]
    },
    {
      id: "finances",
      title: "Finanzas",
      icon: Wallet,
      color: "text-success",
      bgColor: "bg-success/10",
      description: "Controla tus ingresos y gastos",
      guides: [
        {
          question: "¿Cómo registro mis ingresos?",
          answer: `1. Ve a "Finanzas" en el menú
2. Toca "Agregar transacción"
3. Selecciona "Ingreso"
4. Llena:
   - Monto recibido
   - Categoría (venta, anticipo, etc.)
   - Descripción breve
5. Guarda

💡 Registra cada venta, aunque sea pequeña. Así sabrás exactamente cuánto ganas.`
        },
        {
          question: "¿Cómo registro mis gastos?",
          answer: `1. Ve a "Finanzas"
2. Toca "Agregar transacción"
3. Selecciona "Gasto"
4. Llena:
   - Monto gastado
   - Categoría (ingredientes, empaque, gas, etc.)
   - Descripción

💡 Categorías comunes:
- Ingredientes: Harina, azúcar, huevos, etc.
- Empaque: Cajas, bolsas, cintas
- Servicios: Gas, luz, agua
- Herramientas: Moldes, boquillas, etc.`
        },
        {
          question: "¿Cómo sé si mi negocio es rentable?",
          answer: `En Finanzas verás:

📈 Total de ingresos del mes
📉 Total de gastos del mes
💰 Balance = Ingresos - Gastos

✅ Si el balance es POSITIVO: ¡Vas bien!
⚠️ Si el balance es NEGATIVO: Revisa tus precios y gastos

💡 Tips para mejorar:
- Sube precios si tus márgenes son muy bajos
- Busca proveedores más económicos
- Reduce gastos innecesarios`
        }
      ]
    },
    {
      id: "quotations",
      title: "Cotizaciones",
      icon: FileText,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      description: "Crea y envía cotizaciones profesionales",
      guides: [
        {
          question: "¿Cómo creo una cotización?",
          answer: `1. Ve a "Cotizar" en el menú
2. Toca "Nueva cotización"
3. Llena los datos del cliente:
   - Nombre
   - Teléfono (para WhatsApp)
4. Agrega productos:
   - Desde tus recetas guardadas
   - O productos personalizados
5. Ajusta cantidades y precios si es necesario
6. Agrega descuento si quieres
7. Guarda la cotización

💡 La cotización se genera con un número único para llevar control.`
        },
        {
          question: "¿Cómo envío la cotización por WhatsApp?",
          answer: `1. Abre la cotización que quieres enviar
2. Toca el botón de WhatsApp 📱
3. Se abrirá WhatsApp con:
   - El número del cliente
   - Un mensaje profesional con el resumen
   - Opción de adjuntar el PDF

💡 El cliente recibe un mensaje claro con todos los detalles y el total a pagar.`
        },
        {
          question: "¿Cómo convierto una cotización en pedido?",
          answer: `Cuando el cliente acepta:

1. Abre la cotización
2. Toca "Convertir a pedido"
3. Ajusta la fecha de entrega
4. ¡Listo! Se crea el pedido automáticamente

💡 Esto te ahorra tiempo y evita errores al pasar los datos manualmente.`
        },
        {
          question: "¿Qué significan los estados de cotización?",
          answer: `📝 Borrador: Aún no la has enviado
📤 Enviada: Ya la mandaste al cliente
✅ Aceptada: El cliente dijo que sí
🔄 Convertida: Ya es un pedido

💡 Mantén actualizados los estados para saber qué cotizaciones están pendientes de respuesta.`
        }
      ]
    }
  ];

  const tips = [
    {
      icon: Target,
      title: "Conoce tu mercado",
      description: "Investiga qué precios manejan otros emprendimientos similares en tu zona."
    },
    {
      icon: PiggyBank,
      title: "Separa tus finanzas",
      description: "Ten una cuenta o cartera exclusiva para tu negocio, no mezcles con gastos personales."
    },
    {
      icon: Lightbulb,
      title: "Actualiza tus precios",
      description: "Cada vez que suban los ingredientes, recalcula tus costos y ajusta precios."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Cómo usar la app
            </h1>
            <p className="text-sm text-muted-foreground">
              Guías y tutoriales para sacar el máximo provecho
            </p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Quick Tips */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Tips rápidos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tips.map((tip, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="p-2 rounded-full bg-background">
                  <tip.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{tip.title}</p>
                  <p className="text-xs text-muted-foreground">{tip.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Module Guides */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Guías por módulo</h2>
          
          {modules.map((module) => (
            <Card key={module.id} className="overflow-hidden">
              <CardHeader className={`${module.bgColor} pb-3`}>
                <CardTitle className="text-base flex items-center gap-2">
                  <module.icon className={`h-5 w-5 ${module.color}`} />
                  {module.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {module.description}
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <Accordion type="single" collapsible className="w-full">
                  {module.guides.map((guide, index) => (
                    <AccordionItem 
                      key={index} 
                      value={`${module.id}-${index}`}
                      className="border-b last:border-b-0"
                    >
                      <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline">
                        {guide.question}
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                          {guide.answer}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
};

export default HelpPage;
