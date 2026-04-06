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
  Smartphone, Loader2, BarChart3, ClipboardCheck, CalendarDays, Zap, TrendingUp
} from "lucide-react";
import ProductCard from "@/components/product-card";
import { useAuth } from "@/context/auth-context";
import { useIsOnline } from "@/hooks/use-online"; 
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { ProductWithFarmer } from "@/lib/types";

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

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.userType === "farmer") setLocation("/farmer/dashboard");
      if (user.userType === "admin") setLocation("/panel/dashboard");
    }
  }, [isAuthenticated, user?.userType, setLocation]);

  // --- REQUÊTES ---
  const { data: stats, isLoading: loadStats } = useQuery<AdminStats>({ 
    queryKey: ["/api/stats"],
    retry: false 
  });

  const { data: products = [], isLoading: loadProducts } = useQuery<ProductWithFarmer[]>({
    queryKey: ["/api/products", { limit: 6, approved: true }],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/products?limit=6&approved=true");
      return res.json();
    },
    retry: false
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
      
      {/* 🟢 SECTION 1 : HERO & STATS */}
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
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium italic">
            "La marketplace numérique qui désenclave les producteurs de l'Annexe, Kipushi et Ruashi."
          </p>

          <div className="bg-white dark:bg-slate-900 p-2 rounded-[2rem] shadow-2xl max-w-4xl mx-auto flex flex-col md:flex-row gap-2 border border-white/10 mt-12">
            <div className="flex-1 flex items-center px-6 bg-muted/30 rounded-2xl">
              <Search className="text-muted-foreground mr-3" size={20} />
              <Input placeholder="Maïs, Tomates, Braise..." className="border-none bg-transparent focus-visible:ring-0" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Select value={selectedCommune} onValueChange={setSelectedCommune}>
              <SelectTrigger className="md:w-64 bg-muted/30 border-none rounded-2xl h-14 font-bold">
                <MapPin size={18} className="text-primary mr-2" /><SelectValue placeholder="Provenance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tout Lubumbashi</SelectItem>
                {Array.isArray(communes) && communes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} className="bg-primary hover:bg-primary/90 text-white px-10 h-14 rounded-2xl font-black uppercase tracking-widest">Explorer</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 max-w-4xl mx-auto border-t border-white/10 pt-10">
            <QuickStat label="Producteurs" value={stats?.totalFarmers} color="text-primary" loading={loadStats} />
            <QuickStat label="Offres Actives" value={stats?.totalProducts} color="text-orange-500" loading={loadStats} />
            <QuickStat label="Zones Rurales" value={stats?.totalCommunes} color="text-blue-400" loading={loadStats} />
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                {isOnline ? <Wifi className="text-green-400 h-6 w-6" /> : <WifiOff className="text-destructive h-6 w-6 animate-pulse" />}
                <p className={cn("text-3xl font-black tracking-tighter", isOnline ? "text-green-400" : "text-destructive")}>{isOnline ? "Online" : "Offline"}</p>
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">État du SI</p>
            </div>
          </div>
        </div>
      </section>

      {/* 🟠 SECTION 2 : TENDANCES DU MOMENT (Immédiatement après le Hero) */}
      <section className="py-24 container mx-auto px-4">
        <div className="flex justify-between items-center mb-12 border-l-4 border-primary pl-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-orange-500">
               <TrendingUp size={20}/>
               <span className="text-[10px] font-black uppercase tracking-widest">Market Intelligence</span>
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground">Produits en Tendances</h2>
            <p className="text-muted-foreground italic">Les récoltes les plus sollicitées à Lubumbashi cette semaine.</p>
          </div>
          <Link href="/products">
            <Button variant="outline" className="hidden md:flex rounded-full border-primary text-primary font-bold">Voir tout le marché</Button>
          </Link>
        </div>

        {loadProducts ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => <div key={i} className="h-96 bg-muted animate-pulse rounded-[2.5rem]" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-700">
            {Array.isArray(products) && products.slice(0, 6).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* 🔵 SECTION 3 : LE VÉRROU MARKETING (Explication du Sondage) */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-5 py-2 rounded-full border border-primary/30">
                <ClipboardCheck size={20}/><span className="text-xs font-black uppercase tracking-widest">Le Verrou Marketing</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">Un SI piloté par <span className="text-primary italic">vos besoins</span>.</h2>
              <p className="text-lg text-slate-400 font-medium">
                Agri-Connect impose un <span className="text-white font-bold">sondage hebdomadaire obligatoire</span>. 
                Ce processus transforme chaque citadin en source d'intelligence pour aider les paysans à fixer le <span className="text-primary font-bold">juste prix</span> selon les saisons du Katanga.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex gap-4 items-start">
                   <div className="p-3 bg-white/5 rounded-xl text-primary"><CalendarDays size={24}/></div>
                   <div><h4 className="font-bold uppercase text-sm">Adaptation Saisonnière</h4><p className="text-xs text-slate-500 mt-1">Le sondage change selon le calendrier agricole provincial.</p></div>
                </div>
                <div className="flex gap-4 items-start">
                   <div className="p-3 bg-white/5 rounded-xl text-primary"><BarChart3 size={24}/></div>
                   <div><h4 className="font-bold uppercase text-sm">Analyse Quantitative</h4><p className="text-xs text-slate-500 mt-1">Calcul automatique du prix psychologique moyen.</p></div>
                </div>
              </div>
            </div>
            <Card className="bg-slate-800 border-slate-700 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10"><Zap size={100}/></div>
               <div className="space-y-6 relative z-10">
                  <span className="font-black text-xs text-primary uppercase tracking-widest">Aperçu du Dashboard SI</span>
                  <div className="space-y-4">
                     <div className="flex justify-between text-sm"><span className="text-slate-400">Demande en Maïs</span><span className="text-primary font-black">+92%</span></div>
                     <div className="h-2 bg-slate-700 rounded-full overflow-hidden"><div className="bg-primary h-full w-[92%]" /></div>
                     <div className="flex justify-between text-sm pt-4"><span className="text-slate-400">Demande en Maraîchage</span><span className="text-primary font-black">+45%</span></div>
                     <div className="h-2 bg-slate-700 rounded-full overflow-hidden"><div className="bg-primary h-full w-[45%]" /></div>
                  </div>
               </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ⚙️ SECTION 4 : INGÉNIERIE & RÉSILIENCE */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-black uppercase">Ingénierie de la Résilience</h2>
            <p className="text-muted-foreground italic font-medium">Des solutions adaptées aux défis de connectivité du Haut-Katanga.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard icon={<Zap size={32} className="text-orange-500" />} title="Mode Hors-ligne" desc="Architecture Offline-First permettant aux paysans de l'Annexe de publier sans couverture 4G immédiate." />
            <FeatureCard icon={<ShieldCheck size={32} className="text-primary" />} title="Traçabilité" desc="Algorithme de calcul de fraîcheur basé sur les données de récolte transmises par les producteurs." />
            <FeatureCard icon={<Smartphone size={32} className="text-blue-600" />} title="Inclusion USSD" desc="Extension prévue pour l'accès aux indicateurs de prix via protocole mobile simple sans internet." />
          </div>
        </div>
      </section>

      {/* 👨‍🌾 CALL TO ACTION */}
      {!isAuthenticated && (
        <section className="py-24 bg-slate-950 text-white text-center space-y-12">
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">Prêt à transformer <br/> l'agriculture locale ?</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link href="/register"><Button className="bg-primary hover:bg-primary/90 text-white px-12 h-20 rounded-2xl text-xl font-black uppercase tracking-widest shadow-2xl">Producteur</Button></Link>
            <Link href="/register"><Button variant="outline" className="border-white/20 text-white px-12 h-20 rounded-2xl text-xl font-black uppercase tracking-widest">Acheteur</Button></Link>
          </div>
        </section>
      )}
    </div>
  );
}

function QuickStat({ label, value, color, loading }: any) {
  return (
    <div className="space-y-1 text-center">
      {loading ? <Loader2 className="animate-spin mx-auto text-slate-500" size={24} /> : <p className={cn("text-4xl font-black tracking-tighter", color)}>{value ?? 0}</p>}
      <p className="text-[9px] uppercase font-black tracking-widest text-slate-500">{label}</p>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: any) {
  return (
    <Card className="border-none shadow-xl bg-card rounded-[2.5rem] overflow-hidden group transition-all hover:-translate-y-2">
      <CardContent className="pt-12 pb-10 px-8 text-center space-y-5">
        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto shadow-inner group-hover:rotate-6 transition-transform">{icon}</div>
        <h3 className="font-black text-xl uppercase tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed italic">{desc}</p>
      </CardContent>
    </Card>
  );
}