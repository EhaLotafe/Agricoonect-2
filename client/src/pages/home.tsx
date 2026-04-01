// client/src/pages/home.tsx
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, ShieldCheck, MapPin, ArrowRight, Wifi, WifiOff, 
  Smartphone, Loader2, UserCheck, LayoutGrid, Zap
} from "lucide-react";
import ProductCard from "@/components/product-card";
import { useAuth } from "@/context/auth-context";
import { useIsOnline } from "@/hooks/use-online"; 
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { Product } from "@shared/schema";

type AdminStats = {
  totalFarmers: number;
  totalProducts: number;
  totalOrders: number;
  totalCommunes: number;
};

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const isOnline = useIsOnline();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCommune, setSelectedCommune] = useState("all");

  /**
   * 🛡️ REDIRECTION RBAC (Logique métier du Chapitre 3)
   * Oriente l'acteur vers son interface de gestion dès la connexion.
   */
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.userType === "farmer") setLocation("/farmer/dashboard");
      if (user.userType === "admin") setLocation("/panel/dashboard");
    }
  }, [isAuthenticated, user, setLocation]);

  // --- COLLECTE DES DONNÉES STATISTIQUES (Méthode Quantitative) ---
  const { data: stats, isLoading: loadStats } = useQuery<AdminStats>({ 
    queryKey: ["/api/stats"] 
  });

  const { data: products = [], isLoading: loadProducts } = useQuery<Product[]>({
    queryKey: ["/api/products", { limit: 6, approved: true }],
    queryFn: async () => (await apiRequest("GET", "/api/products?limit=6&approved=true")).json(),
  });

  const { data: communes = [] } = useQuery<string[]>({ 
    queryKey: ["/api/communes"] 
  });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append("search", searchQuery);
    if (selectedCommune !== "all") params.append("commune", selectedCommune);
    setLocation(`/products?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500">
      
      {/* Barre de notification contextuelle */}
      {isAuthenticated && user?.userType === "buyer" && (
        <div className="bg-primary/10 border-b border-primary/20 py-3 animate-in slide-in-from-top duration-500">
          <div className="container mx-auto px-4 flex justify-between items-center text-xs">
            <p className="font-bold text-primary flex items-center gap-2 uppercase tracking-widest">
              <UserCheck size={14} /> Session Active : {user.firstName}
            </p>
            <Link href="/buyer/dashboard">
              <Button size="sm" variant="link" className="text-primary font-black p-0 h-auto">MES ACHATS →</Button>
            </Link>
          </div>
        </div>
      )}

      {/* 🟢 HERO SECTION : L'ACCÈS AU TERROIR RURAL */}
      <section className="relative bg-slate-950 pt-20 pb-32 overflow-hidden border-b-4 border-primary">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?auto=format&fit=crop&q=80')] bg-cover bg-center" />
        
        <div className="container mx-auto px-4 relative z-10 text-center space-y-8">
          <Badge className="bg-primary/20 text-primary border-primary/30 py-1.5 px-6 rounded-full text-[10px] font-black uppercase tracking-[0.3em]">
            Haut-Katanga • RDC
          </Badge>
          
          <h1 className="text-5xl md:text-8xl font-black text-white leading-[0.95] tracking-tighter max-w-5xl mx-auto uppercase">
            Relions nos <span className="text-primary italic">Champs</span> <br/> 
            à nos <span className="text-orange-500">Villes</span>.
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed italic">
            "La marketplace numérique qui désenclave les producteurs de l'Annexe, Kipushi et Ruashi."
          </p>

          {/* MOTEUR DE RECHERCHE GÉOGRAPHIQUE */}
          <div className="bg-white dark:bg-slate-900 p-2 rounded-[2rem] shadow-2xl max-w-4xl mx-auto flex flex-col md:flex-row gap-2 border border-white/10 mt-12">
            <div className="flex-1 flex items-center px-6 bg-muted/30 rounded-2xl">
              <Search className="text-muted-foreground mr-3" size={20} />
              <Input 
                placeholder="Chercher un produit (ex: Maïs, Tomates...)" 
                className="border-none bg-transparent focus-visible:ring-0 text-foreground font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedCommune} onValueChange={setSelectedCommune}>
              <SelectTrigger className="md:w-64 bg-muted/30 border-none rounded-2xl h-14 font-bold">
                <MapPin size={18} className="text-primary mr-2" />
                <SelectValue placeholder="Provenance" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">Tout Lubumbashi</SelectItem>
                {communes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} className="bg-primary hover:bg-primary/90 text-white px-10 h-14 rounded-2xl font-black uppercase tracking-widest shadow-lg transition-transform active:scale-95">
              Explorer
            </Button>
          </div>

          {/* INDICATEURS SYSTÈME EN TEMPS RÉEL */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 max-w-4xl mx-auto border-t border-white/10 pt-10">
            <QuickStat label="Producteurs" value={stats?.totalFarmers} color="text-primary" loading={loadStats} />
            <QuickStat label="Offres Actives" value={stats?.totalProducts} color="text-orange-500" loading={loadStats} />
            <QuickStat label="Zones Rurales" value={stats?.totalCommunes} color="text-blue-400" loading={loadStats} />
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                {isOnline ? <Wifi className="text-green-400 h-6 w-6" /> : <WifiOff className="text-destructive h-6 w-6 animate-pulse" />}
                <p className={cn("text-3xl font-black tracking-tighter", isOnline ? "text-green-400" : "text-destructive")}>
                  {isOnline ? "Online" : "Offline"}
                </p>
              </div>
              <p className="text-[9px] uppercase font-black tracking-widest text-slate-500">État du SI</p>
            </div>
          </div>
        </div>
      </section>

      {/* ⚙️ SECTION TECHNIQUE : ARCHITECTURE DE RÉSILIENCE */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-black tracking-tight uppercase">Ingénierie Logicielle</h2>
            <p className="text-muted-foreground italic font-medium">Des solutions adaptées aux défis de connectivité du Haut-Katanga.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap size={32} className="text-orange-500" />}
              title="Mode Hors-ligne"
              desc="Architecture Offline-First permettant aux paysans de l'Annexe de publier sans couverture 4G immédiate."
            />
            <FeatureCard 
              icon={<ShieldCheck size={32} className="text-primary" />}
              title="Traçabilité"
              desc="Algorithme de calcul de fraîcheur basé sur les données de récolte transmises par les producteurs ruraux."
            />
            <FeatureCard 
              icon={<Smartphone size={32} className="text-blue-600" />}
              title="Inclusion USSD"
              desc="Extension prévue pour l'accès aux indicateurs de prix via protocole mobile simple sans internet."
            />
          </div>
        </div>
      </section>

      {/* 🛒 DERNIERS ARRIVAGES (Visualisation du Marché) */}
      <section className="py-24 container mx-auto px-4">
        <div className="flex justify-between items-end mb-12 border-l-4 border-primary pl-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-black uppercase tracking-tighter">Récoltes du jour</h2>
            <p className="text-muted-foreground font-medium italic">Produits validés par le service de modération Agri-Connect.</p>
          </div>
          <Link href="/products">
            <Button variant="outline" className="rounded-full font-black text-[10px] uppercase tracking-widest border-primary text-primary hover:bg-primary hover:text-white">
              Voir tout le marché <ArrowRight size={14} className="ml-2" />
            </Button>
          </Link>
        </div>

        {loadProducts ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => <div key={i} className="h-96 bg-muted animate-pulse rounded-[2.5rem]" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-700">
            {products.slice(0, 6).map(p => <ProductCard key={p.id} product={p as any} />)}
          </div>
        )}
      </section>

      {/* 👨‍🌾 CALL TO ACTION : CONVERSION DES ACTEURS */}
      {!isAuthenticated && (
        <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
          <div className="container mx-auto px-4 text-center space-y-12 relative z-10">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">Prêt à transformer <br/> l'agriculture locale ?</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link href="/register">
                <Button className="bg-primary hover:bg-primary/90 text-white px-12 h-20 rounded-2xl text-xl font-black uppercase tracking-widest shadow-2xl transition-transform hover:scale-105">
                  Je suis Producteur
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" className="border-white/20 text-white px-12 h-20 rounded-2xl text-xl font-black uppercase tracking-widest transition-transform hover:scale-105">
                  Je suis Acheteur
                </Button>
              </Link>
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.5em]">Système de Marketing Agricole • 2025</p>
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * Composant Statistique rapide (KPI)
 */
function QuickStat({ label, value, color, loading }: { label: string, value?: number, color: string, loading: boolean }) {
  return (
    <div className="space-y-1">
      {loading ? (
        <Loader2 className="animate-spin mx-auto text-slate-500" size={24} />
      ) : (
        <p className={cn("text-4xl font-black tracking-tighter text-foreground", color)}>{value || 0}</p>
      )}
      <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500">{label}</p>
    </div>
  );
}

/**
 * Composant de présentation des innovations techniques
 */
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <Card className="border-none shadow-xl bg-card rounded-[2.5rem] overflow-hidden group transition-all hover:-translate-y-2">
      <CardContent className="pt-12 pb-10 px-8 text-center space-y-5">
        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto shadow-inner transition-transform group-hover:rotate-6">
          {icon}
        </div>
        <h3 className="font-black text-xl uppercase tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed italic">{desc}</p>
      </CardContent>
    </Card>
  );
}