import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Home, Search } from "lucide-react";

export function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <h1 className="text-[6rem] font-semibold text-primary mb-4">
            404
          </h1>
          <h2 className="text-[1.75rem] font-semibold text-foreground mb-2">
            Página no encontrada
          </h2>
          <p className="text-[0.875rem] text-foreground-secondary">
            Lo sentimos, la página que buscas no existe o ha sido movida.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Link to="/">
            <Button variant="primary" size="lg">
              <Home className="w-4 h-4 mr-2" />
              Ir al Dashboard
            </Button>
          </Link>
          <Link to="/pacientes">
            <Button variant="tertiary" size="lg">
              <Search className="w-4 h-4 mr-2" />
              Buscar Pacientes
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
