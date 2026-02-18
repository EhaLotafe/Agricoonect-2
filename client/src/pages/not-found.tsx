// client/src/pages/not-found.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft, Sprout } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground transition-colors duration-300 p-4">
      <Card className="w-full max-w-md shadow-2xl border-border bg-card rounded-[2rem] overflow-hidden animate-in zoom-in-95 duration-500">
        
        {/* Header avec icône d'alerte stylisée */}
        <CardHeader className="text-center pb-2 bg-muted/30 border-b">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-destructive/10 rounded-2xl">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black tracking-tighter uppercase">Page introuvable</CardTitle>
          <CardDescription className="font-medium">Erreur 404 • Hors des sentiers</CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-8 pt-8">
          <div className="space-y-2">
            <p className="text-muted-foreground leading-relaxed">
              Désolé, la page que vous recherchez n'existe pas ou a été déplacée. 
              Même les meilleurs cultivateurs se perdent parfois !
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/">
              <Button className="w-full h-12 bg-primary hover:bg-primary/90 gap-2 font-bold shadow-lg shadow-primary/20 rounded-xl">
                <Home size={18} /> RETOUR À L'ACCUEIL
              </Button>
            </Link>
            
            <Button 
              variant="ghost" 
              onClick={() => window.history.back()} 
              className="w-full h-12 gap-2 text-muted-foreground hover:text-foreground font-bold rounded-xl"
            >
              <ArrowLeft size={18} /> Revenir en arrière
            </Button>
          </div>
          
          <div className="pt-6 border-t flex items-center justify-center gap-2">
            <Sprout size={14} className="text-primary opacity-50" />
            <p className="text-[9px] text-muted-foreground uppercase tracking-[0.3em] font-black opacity-50">
              Agri-Connect Marketplace
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}