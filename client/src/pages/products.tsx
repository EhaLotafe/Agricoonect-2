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
import { Search, Filter, MapPin, XCircle, RefreshCw, LayoutGrid, ClipboardCheck, Lock } from "lucide-react";
import ProductCard from "@/components/product-card";
import SurveyForm from "@/components/survey-form";
import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/queryClient";
import { ProductWithFarmer } from "@/lib/types";

export default function Products() {
  const { user } = useAuth();
  
  // 🕒 ÉTAT DU VERROU (Argument Mémoire : Actualisation hebdomadaire de la donnée)
  const [isLocked, setIsLocked] = useState(true);

  useEffect(() => {
    // On vérifie si un sondage a été fait il y a moins de 7 jours
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

  // --- COLLECTE DES DONNÉES (Uniquement si débloqué ou si Admin/Farmer) ---
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

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // 🛡️ LOGIQUE DU VERROU : Seul l'acheteur est soumis au sondage récurrent
  const shouldShowSurvey = user?.userType === 'buyer' && isLocked;

  return (
    <div className="container mx-auto px-4 py-8 animate-in fade-in duration-700">
      
      {/* --- MODAL SONDAGE OBLIGATOIRE (Le Verrou de ton Hypothèse) --- */}
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
              « Pour maintenir la précision de nos indicateurs ruraux, merci d'actualiser vos besoins de la semaine. »
            </DialogDescription>
          </DialogHeader>
          
          <SurveyForm onSuccess={() => setIsLocked(false)} />
        </DialogContent>
      </Dialog>

      {/* Header : Analyse des flux de Lubumbashi */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-8 border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <LayoutGrid size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Marché de Proximité</span>
          </div>
          <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase">Catalogue des Récoltes</h1>
          <p className="text-muted-foreground font-medium italic">
            Visualisation de l'offre issue des ceintures vertes.
          </p>
        </div>
        
        {isLocked && user?.userType === 'buyer' ? (
           <Badge variant="destructive" className="h-10 px-6 rounded-full gap-2 font-black">
             <Lock size={14}/> MARCHÉ VERROUILLÉ
           </Badge>
        ) : (
          <div className="flex items-center gap-3">
            <Badge className="bg-green-500/10 text-green-600 border-none px-4 py-2 rounded-full font-bold">
              ACCÈS DÉBLOQUÉ ✅
            </Badge>
            {isError && (
              <Button variant="destructive" size="sm" onClick={() => refetch()} className="rounded-xl">
                <RefreshCw size={14} className="mr-2" /> RÉESSAYER
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        
        {/* Sidebar : Filtres de Circuit Court */}
        <aside className="lg:col-span-1">
          <Card className="sticky top-24 border-none shadow-xl bg-card rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Filter size={16} className="text-primary" /> Filtrage Géographique
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase opacity-50 ml-1">Produit recherché</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input
                    placeholder="Ex: Farine de maïs..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-9 bg-muted/50 border-none rounded-xl h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase opacity-50 ml-1">Provenance (Bassin rural)</label>
                <Select value={filters.commune} onValueChange={(v) => handleFilterChange('commune', v)}>
                  <SelectTrigger className="bg-muted/50 border-none h-11 rounded-xl font-bold">
                    <MapPin size={14} className="mr-2 text-primary" />
                    <SelectValue placeholder="Toutes zones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tout Lubumbashi</SelectItem>
                    {communes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase opacity-50 ml-1">Catégorie</label>
                <Select value={filters.category} onValueChange={(v) => handleFilterChange('category', v)}>
                  <SelectTrigger className="bg-muted/50 border-none h-11 rounded-xl font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tout le vivrier</SelectItem>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {(filters.search || filters.category !== 'all' || filters.commune !== 'all') && (
                <Button 
                  variant="ghost" 
                  onClick={() => setFilters({ search: '', category: 'all', commune: 'all' })} 
                  className="w-full text-[10px] font-black text-destructive hover:bg-destructive/5 rounded-xl uppercase"
                >
                  <XCircle size={14} className="mr-2" /> Effacer les filtres
                </Button>
              )}
            </CardContent>
          </Card>
        </aside>

        {/* Grille de Produits : Résultats du Marché */}
        <main className="lg:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 6].map(i => <Skeleton key={i} className="h-80 w-full rounded-[2rem]" />)}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="text-center py-32 bg-muted/10 border-2 border-dashed rounded-[3rem] opacity-50">
               <XCircle size={48} className="mx-auto mb-4 text-muted-foreground" />
               <p className="font-bold uppercase tracking-widest text-xs italic">Aucune récolte disponible pour ces critères.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}