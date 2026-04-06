// client/src/pages/products.tsx
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, Filter, MapPin, XCircle, RefreshCw, LayoutGrid, ClipboardCheck, Lock, Loader2 } from "lucide-react";
import ProductCard from "@/components/product-card";
import SurveyForm from "@/components/survey-form";
import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/queryClient";
import { ProductWithFarmer } from "@/lib/types";

export default function Products() {
  const { user, isLoadingUser } = useAuth(); // ✅ Récupération de l'état de chargement
  const [isLocked, setIsLocked] = useState(true);
  const [mounted, setMounted] = useState(false); // ✅ Sécurité de montage

  // 🕒 1. GESTION DU VERROU (Argument Mémoire : Actualisation hebdomadaire)
  useEffect(() => {
    setMounted(true); // Le composant est prêt
    const lastSurvey = localStorage.getItem("agri_survey_timestamp");
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    
    if (lastSurvey && (Date.now() - parseInt(lastSurvey) < oneWeek)) {
      setIsLocked(false);
    } else {
      setIsLocked(true);
    }
  }, []);

  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    commune: 'all',
  });

  // --- 📊 COLLECTE DES DONNÉES ---
  const { data: products = [], isLoading, isError, refetch } = useQuery<ProductWithFarmer[]>({
    queryKey: ['/api/products', filters],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (filters.search) query.append("search", filters.search);
      if (filters.category !== "all") query.append("category", filters.category);
      if (filters.commune !== "all") query.append("commune", filters.commune);
      const res = await apiRequest('GET', `/api/products?${query.toString()}`);
      return res.json();
    },
  });

  const { data: categories = [] } = useQuery<string[]>({ 
    queryKey: ['/api/categories'],
    queryFn: async () => (await apiRequest('GET', '/api/categories')).json()
  });

  const { data: communes = [] } = useQuery<string[]>({ 
    queryKey: ['/api/communes'],
    queryFn: async () => (await apiRequest('GET', '/api/communes')).json()
  });

  // 🛡️ 2. ÉCRAN D'ATTENTE (Évite le crash React #310)
  if (isLoadingUser || !mounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse text-center">
          Vérification des accès au SI...
        </p>
      </div>
    );
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const shouldShowSurvey = user?.userType === 'buyer' && isLocked;

  return (
    <div className="container mx-auto px-4 py-8 animate-in fade-in duration-700">
      
      {/* --- MODAL SONDAGE OBLIGATOIRE --- */}
      <Dialog open={shouldShowSurvey}>
        <DialogContent 
          className="sm:max-w-[550px] rounded-[2.5rem] border-none shadow-2xl p-8"
          onPointerDownOutside={(e) => e.preventDefault()} 
        >
          <DialogHeader className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
              <ClipboardCheck size={32} />
            </div>
            <DialogTitle className="text-3xl font-black uppercase tracking-tighter">Sondage Hebdomadaire</DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium italic">
              « Votre avis aide nos agriculteurs ruraux. Débloquez le marché en 30 secondes. »
            </DialogDescription>
          </DialogHeader>
          <SurveyForm onSuccess={() => setIsLocked(false)} />
        </DialogContent>
      </Dialog>

      {/* Header Marché */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-8 border-border">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest">
            <LayoutGrid size={16} /> Marché de Lubumbashi
          </div>
          <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase leading-none text-left">Catalogue des Récoltes</h1>
        </div>
        
        {isLocked && user?.userType === 'buyer' ? (
           <Badge variant="destructive" className="h-10 px-6 rounded-full gap-2 font-black uppercase text-[9px]">
             <Lock size={14}/> Accès restreint
           </Badge>
        ) : (
          <div className="flex items-center gap-3">
            <Badge className="bg-green-500/10 text-green-600 border-none px-6 py-2 rounded-full font-black text-[9px] uppercase tracking-widest">
              Accès débloqué ✅
            </Badge>
            {isError && (
              <Button variant="destructive" size="sm" onClick={() => refetch()} className="rounded-xl font-bold">RÉESSAYER</Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <aside className="lg:col-span-1">
          <Card className="sticky top-24 border-none shadow-xl bg-card rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-muted/30 border-b p-6 text-left">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 opacity-60">
                <Filter size={14} /> Filtres
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase opacity-40 ml-1">Produit</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input placeholder="Chercher..." value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} className="pl-9 bg-muted/50 border-none rounded-xl h-11" />
                </div>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase opacity-40 ml-1">Provenance</label>
                <Select value={filters.commune} onValueChange={(v) => handleFilterChange('commune', v)}>
                  <SelectTrigger className="bg-muted/50 border-none h-11 rounded-xl font-bold"><MapPin size={14} className="mr-2 text-primary" /><SelectValue placeholder="Zone" /></SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="all">Tout Lubumbashi</SelectItem>
                    {communes.map(c => <SelectItem key={c} value={c} className="font-medium">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase opacity-40 ml-1">Catégorie</label>
                <Select value={filters.category} onValueChange={(v) => handleFilterChange('category', v)}>
                  <SelectTrigger className="bg-muted/50 border-none h-11 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="all">Tout le vivrier</SelectItem>
                    {categories.map(c => <SelectItem key={c} value={c} className="font-medium">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </aside>

        <main className="lg:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 6].map(i => <Skeleton key={i} className="h-80 w-full rounded-[2rem]" />)}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="text-center py-32 bg-muted/10 border-2 border-dashed rounded-[3rem] opacity-30">
               <XCircle size={48} className="mx-auto mb-4" />
               <p className="font-black uppercase tracking-widest text-[10px]">Aucune récolte disponible.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}