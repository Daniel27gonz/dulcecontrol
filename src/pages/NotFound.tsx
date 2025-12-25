import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/30 to-accent/20 p-6">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
          <span className="text-5xl">🧁</span>
        </div>
        <h1 className="mb-2 text-6xl font-display font-bold text-foreground">404</h1>
        <p className="mb-6 text-xl text-muted-foreground">¡Oops! Página no encontrada</p>
        <p className="mb-8 text-muted-foreground max-w-md">
          La página que buscas no existe o ha sido movida.
        </p>
        <Link to="/">
          <Button variant="warm" size="lg">
            <Home className="w-4 h-4 mr-2" />
            Volver al inicio
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
