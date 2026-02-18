import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Tractor, ShoppingBasket, Zap, ShieldCheck, 
  Leaf, Star, MapPin, ArrowRight, Wifi, WifiOff, 
  Smartphone, Loader2, CloudUpload, UserCheck
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

  // ✅ 1. REDIRECTION AUTOMATIQUE (Optimisation de la productivité - Argument TFC)
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.userType === "farmer") setLocation("/farmer/dashboard");
      if (user.userType === "admin") setLocation("/panel/dashboard");
      // Note : L'acheteur reste sur le Home pour découvrir les produits
    }
  }, [isAuthenticated, user, setLocation]);

  // --- REQUÊTES DE DONNÉES ---
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
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      
      {/* ✅ 2. BANNIÈRE DE BIENVENUE PERSONNALISÉE (Uniquement pour l'Acheteur) */}
      {isAuthenticated && user?.userType === "buyer" && (
        <div className="bg-primary/10 border-b border-primary/20 py-3 animate-in slide-in-from-top duration-500">
          <div className="container mx-auto px-4 flex justify-between items-center text-xs md:text-sm">
            <p className="font-bold text-primary flex items-center gap-2">
              <UserCheck size={16} /> Ravi de vous revoir, {user.firstName} ! Prêt pour vos achats frais ?
            </p>
            <Link href="/buyer/dashboard">
              <Button size="sm" variant="outline" className="h-8 rounded-full border-primary text-primary hover:bg-primary/10 font-bold">
                MES COMMANDES
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* 🟢 HERO SECTION : L'ACCÈS AU TERROIR */}
      <section className="relative bg-slate-950 pt-20 pb-32 overflow-hidden border-b-4 border-primary">
        <div className="absolute inset-0 opacity-25 bg-[url('https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80')] bg-cover bg-center" />
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <Badge className="mb-6 bg-primary/20 text-primary border-primary/30 py-1.5 px-6 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
            📍 Lubumbashi • Haut-Katanga
          </Badge>
          
          <h1 className="text-4xl md:text-7xl font-black text-white mb-6 leading-[1.05] tracking-tighter max-w-5xl mx-auto">
            Relions nos <span className="text-primary italic">Champs</span> <br className="hidden md:block" /> 
            à nos <span className="text-brand-orange">Villes</span>.
          </h1>
          
          <p className="text-lg md:text-xl text-slate-300 mb-12 max-w-2xl mx-auto font-medium leading-relaxed italic">
            "La marketplace qui désenclave les producteurs de l'Annexe, Kipushi et Ruashi."
          </p>

          {/* BARRE DE RECHERCHE DYNAMIQUE */}
          <div className="bg-background/95 dark:bg-slate-900/90 backdrop-blur p-2 rounded-2xl shadow-2xl max-w-4xl mx-auto flex flex-col md:flex-row gap-2 border border-white/10">
            <div className="flex-1 flex items-center px-4 bg-muted/50 rounded-xl">
              <Search className="text-muted-foreground mr-3" size={20} />
              <Input 
                placeholder="Maïs, Tomates, Braise, Manioc..." 
                className="border-none bg-transparent focus-visible:ring-0 text-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Select value={selectedCommune} onValueChange={setSelectedCommune}>
              <SelectTrigger className="md:w-56 bg-muted/50 border-none rounded-xl h-12">
                <MapPin size={16} className="text-primary mr-2" />
                <SelectValue placeholder="Toutes les zones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tout Lubumbashi</SelectItem>
                {communes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} className="bg-primary hover:bg-primary/90 text-white px-10 h-12 rounded-xl font-black shadow-lg">
              RECHERCHER
            </Button>
          </div>

          {/* STATS EN TEMPS RÉEL */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-4xl mx-auto">
            <QuickStat label="Producteurs" value={stats?.totalFarmers} color="text-primary" loading={loadStats} />
            <QuickStat label="Produits frais" value={stats?.totalProducts} color="text-brand-orange" loading={loadStats} />
            <QuickStat label="Zones Rurales" value={stats?.totalCommunes} color="text-blue-400" loading={loadStats} />
            <div className="space-y-1">
              <p className={cn("text-3xl font-black tracking-tighter", isOnline ? "text-green-400" : "text-destructive animate-pulse")}>
                {isOnline ? "Online" : "Offline"}
              </p>
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Système</p>
            </div>
          </div>
        </div>
      </section>

      {/* ⚙️ SECTION INNOVATION : LE CŒUR DU TFC */}
      <section className="py-24 bg-muted/30 dark:bg-slate-900/20 transition-colors duration-300">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground uppercase">L'Ingénierie de la résilience</h2>
            <p className="text-muted-foreground italic">Solutions techniques aux défis de commercialisation du Katanga.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<WifiOff size={32} className="text-brand-orange" />}
              title="Mode Hors-ligne"
              desc="Publication des récoltes sans réseau internet. Synchronisation automatique dès le retour de la connectivité."
            />
            <FeatureCard 
              icon={<ShieldCheck size={32} className="text-primary" />}
              title="Traçabilité Native"
              desc="Affichage obligatoire de la date de récolte et de la commune rurale pour garantir la fraîcheur."
            />
            <FeatureCard 
              icon={<Smartphone size={32} className="text-blue-600" />}
              title="Passerelle USSD"
              desc="Accès simplifié aux prix du marché via le protocole *123# pour une inclusion numérique totale."
            />
          </div>
        </div>
      </section>

      {/* 🛒 DERNIÈRES RÉCOLTES */}
      <section className="py-24 container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-foreground">Fraîchement récolté</h2>
            <p className="text-muted-foreground italic">En provenance directe des ceintures vertes de Lubumbashi.</p>
          </div>
          <Link href="/products">
            <Button variant="ghost" className="group font-bold text-primary hover:bg-primary/5 rounded-full px-6">
              Tout voir <ArrowRight size={18} className="ml-2 group-hover:translate-x-2 transition-transform" />
            </Button>
          </Link>
        </div>

        {loadProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => <div key={i} className="h-80 bg-muted animate-pulse rounded-[2rem]" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.slice(0, 6).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* 👨‍🌾 CALL TO ACTION : CHOIX DU RÔLE (Caché si déjà connecté) */}
      {!isAuthenticated && (
        <section className="py-24 bg-slate-900 dark:bg-black text-white relative overflow-hidden transition-colors">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary opacity-50" />
          <div className="container mx-auto px-4 text-center space-y-12 relative z-10">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter">Prêt à cultiver votre succès ?</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link href="/register?type=farmer">
                <Button className="bg-primary hover:bg-primary/90 text-white px-12 py-8 rounded-2xl text-xl font-black shadow-2xl transition-all hover:scale-105 active:scale-95">
                  JE SUIS PRODUCTEUR
                </Button>
              </Link>
              <Link href="/register?type=buyer">
                <Button className="bg-brand-orange hover:bg-brand-orange/90 text-white px-12 py-8 rounded-2xl text-xl font-black shadow-2xl transition-all hover:scale-105 active:scale-95">
                  JE SUIS ACHETEUR
                </Button>
              </Link>
            </div>
            <p className="text-slate-500 text-sm italic">Rejoignez le premier réseau agricole numérique du Katanga.</p>
          </div>
        </section>
      )}

    </div>
  );
}

// --- SOUS-COMPOSANTS ---

function QuickStat({ label, value, color, loading }: { label: string, value?: number, color: string, loading: boolean }) {
  return (
    <div className="space-y-1">
      {loading ? (
        <Loader2 className="animate-spin mx-auto text-slate-500" size={24} />
      ) : (
        <p className={cn("text-4xl font-black tracking-tighter text-foreground", color)}>{value || 0}</p>
      )}
      <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">{label}</p>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <Card className="border-border bg-card hover:shadow-2xl transition-all duration-500 group border-none shadow-md rounded-[2rem] overflow-hidden">
      <CardContent className="pt-12 pb-10 px-8 text-center space-y-4">
        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 group-hover:bg-primary/5 transition-all duration-500 shadow-inner">
          {icon}
        </div>
        <h3 className="font-bold text-xl text-foreground uppercase tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed italic">{desc}</p>
      </CardContent>
    </Card>
  );
}