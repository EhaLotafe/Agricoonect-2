// client/src/pages/products.tsx
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, MapPin, XCircle, RefreshCw, LayoutGrid } from "lucide-react";
import ProductCard from "@/components/product-card";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { ProductWithFarmer } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function Products() {
  const [location, setLocation] = useLocation();
  // Extraction propre des paramètres d'URL
  const searchParams = new URLSearchParams(window.location.search);
  
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || 'all',
    commune: searchParams.get('commune') || 'all',
    saleMode: searchParams.get('saleMode') || 'all',
  });

  // --- REQUÊTE PRODUITS (FILTRAGE CÔTÉ SERVEUR) ---
  const { data: products = [], isLoading, isError, refetch } = useQuery<ProductWithFarmer[]>({
    queryKey: ['/api/products', filters],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (filters.search) query.append("search", filters.search);
      if (filters.category !== "all") query.append("category", filters.category);
      if (filters.commune !== "all") query.append("commune", filters.commune);
      if (filters.saleMode !== "all") query.append("saleMode", filters.saleMode);
      
      const res = await apiRequest('GET', `/api/products?${query.toString()}`);
      return res.json();
    },
  });

  // --- DONNÉES STATIQUES LUBUMBASHI ---
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

  const clearFilters = () => {
    setFilters({ search: '', category: 'all', commune: 'all', saleMode: 'all' });
    setLocation('/products'); // Nettoyage de l'URL
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== '' && v !== 'all').length;

  return (
    <div className="container mx-auto px-4 py-8 animate-in fade-in duration-700">
      
      {/* 🏷️ HEADER : ANALYSE DES DISPONIBILITÉS */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-8 border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <LayoutGrid size={20} />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Marché Digital</span>
          </div>
          <h1 className="text-4xl font-black text-foreground tracking-tighter">Catalogue des Récoltes</h1>
          <p className="text-muted-foreground font-medium">
            <span className="text-primary">{products.length}</span> produits frais disponibles actuellement.
          </p>
        </div>
        
        {isError && (
          <Button variant="destructive" size="sm" onClick={() => refetch()} className="gap-2 shadow-lg">
            <RefreshCw size={14} className="animate-spin-once" /> Erreur de chargement. Réessayer ?
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        
        {/* 🛠️ SIDEBAR : SYSTÈME DE FILTRAGE (RÉPONSE AU CIRCUIT COURT) */}
        <aside className="lg:col-span-1">
          <Card className="sticky top-24 border-border bg-card shadow-xl rounded-3xl overflow-hidden transition-colors">
            <CardHeader className="bg-muted/50 border-b">
              <CardTitle className="text-md flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-primary" />
                  <span className="font-black uppercase text-xs tracking-widest">Filtres</span>
                </div>
                {activeFiltersCount > 0 && (
                  <Badge className="bg-primary text-white text-[10px] animate-in zoom-in">{activeFiltersCount}</Badge>
                )}
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-8 space-y-8">
              
              {/* Recherche textuelle */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Désignation</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input
                    placeholder="ex: Farine de maïs..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10 bg-muted/30 border-border focus:ring-primary h-11 rounded-xl"
                  />
                </div>
              </div>

              {/* Filtre Commune (Argument central du TFC) */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Provenance (Lubumbashi)</label>
                <Select value={filters.commune} onValueChange={(v) => handleFilterChange('commune', v)}>
                  <SelectTrigger className="bg-muted/30 border-border h-11 rounded-xl">
                    <MapPin size={14} className="mr-2 text-primary" />
                    <SelectValue placeholder="Toutes les zones" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">Toutes les communes</SelectItem>
                    {communes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtre Catégorie */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Catégorie</label>
                <Select value={filters.category} onValueChange={(v) => handleFilterChange('category', v)}>
                  <SelectTrigger className="bg-muted/30 border-border h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">Toutes catégories</SelectItem>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Reset des filtres */}
              {activeFiltersCount > 0 && (
                <Button 
                  variant="ghost" 
                  onClick={clearFilters} 
                  className="w-full text-xs font-bold text-destructive hover:bg-destructive/5 gap-2 border border-destructive/10 rounded-xl"
                >
                  <XCircle size={14} /> RÉINITIALISER LES FILTRES
                </Button>
              )}
            </CardContent>
          </Card>
        </aside>

        {/* 🌾 GRILLE DE PRODUITS (MATÉRIALISATION DES RÉSULTATS) */}
        <main className="lg:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-96 w-full rounded-3xl" />)}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <Card className="bg-muted/10 border-dashed border-2 py-32 rounded-[2rem]">
              <CardContent className="text-center space-y-6">
                <div className="w-24 h-24 bg-background rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Search size={40} className="text-muted-foreground/30" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black tracking-tight">Aucun résultat trouvé</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto italic">
                    Aucun produit ne correspond à vos filtres dans cette zone de Lubumbashi.
                  </p>
                </div>
                <Button onClick={clearFilters} variant="outline" className="rounded-full px-8 border-primary text-primary font-bold">
                  VOIR TOUT LE CATALOGUE
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}