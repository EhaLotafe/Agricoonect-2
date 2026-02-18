import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, Package, ShoppingCart, Check, X, Search, 
  Loader2, ShieldAlert, MapPin, BarChart3, Trash2, UserCog, RefreshCw 
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn, formatCurrency } from "@/lib/utils";
import { User, Product } from "@shared/schema";
import { Link, useLocation } from "wouter";

// --- TYPES ---
type AdminStats = {
  totalFarmers: number;
  totalProducts: number;
  totalOrders: number;
  totalCommunes: number;
};

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [userSearch, setUserSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  // 🛡️ SÉCURISATION RBAC (Argument majeur du Chapitre 3)
  if (!isAuthenticated || user?.userType !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 animate-in fade-in">
        <ShieldAlert className="h-20 w-20 text-destructive animate-pulse" />
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black tracking-tighter uppercase text-foreground">Accès Refusé</h1>
          <p className="text-muted-foreground font-medium">Privilèges Administrateur requis pour cette zone.</p>
        </div>
        <Button onClick={() => setLocation("/login")} variant="default" className="font-bold">RETOUR À LA CONNEXION</Button>
      </div>
    );
  }

  // --- REQUÊTES DE DONNÉES ---
  const { data: stats, isLoading: loadStats } = useQuery<AdminStats>({ queryKey: ['/api/stats'] });
  
  const { data: usersList = [], isLoading: loadUsers } = useQuery<User[]>({
    queryKey: ['/api/admin/users', userSearch],
    queryFn: async () => (await apiRequest('GET', `/api/admin/users?search=${userSearch}`)).json(),
  });

  const { data: productsList = [], isLoading: loadProducts } = useQuery<Product[]>({
    queryKey: ['/api/admin/products', productSearch],
    queryFn: async () => (await apiRequest('GET', `/api/admin/products?search=${productSearch}`)).json(),
  });

  // --- MUTATIONS D'ADMINISTRATION ---

  // 1. Approuver un produit (PATCH conforme au backend)
  const approveMutation = useMutation({
    mutationFn: async (id: number) => apiRequest('PATCH', `/api/admin/products/${id}/approve`),
    onSuccess: () => {
      toast({ title: "Produit approuvé", description: "L'annonce est désormais publique sur la marketplace." });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" })
  });

  // 2. Rejeter/Supprimer un produit
  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => apiRequest('DELETE', `/api/products/${id}`),
    onSuccess: () => {
      toast({ title: "Produit rejeté", description: "L'annonce a été supprimée définitivement." });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" })
  });

  // 3. Activer/Désactiver un compte utilisateur
  const toggleUserMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number, active: boolean }) => 
      apiRequest('PUT', `/api/admin/users/${id}`, { isActive: active }),
    onSuccess: () => {
      toast({ title: "Utilisateur mis à jour" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" })
  });

  // Séparation des produits pour l'affichage
  const pendingProducts = productsList.filter(p => !p.isApproved);
  const approvedProducts = productsList.filter(p => p.isApproved);

  return (
    <div className="container mx-auto px-4 py-8 space-y-10 transition-colors duration-300 bg-background text-foreground">
      
      {/* 🟢 HEADER DU DASHBOARD */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card border p-8 rounded-[2rem] shadow-sm">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter text-foreground flex items-center gap-3">
            <UserCog className="text-primary h-10 w-10" /> Supervision <span className="text-primary">Agri-Connect</span>
          </h1>
          <p className="text-muted-foreground font-medium italic">Tableau de bord de régulation • Lubumbashi RDC</p>
        </div>
        <div className="flex items-center gap-3 bg-muted p-2 rounded-2xl border shadow-inner">
          <Badge className="bg-primary text-white font-bold px-4 py-1.5 rounded-xl uppercase tracking-widest text-[10px]">ADMINISTRATEUR</Badge>
          <Button variant="ghost" size="icon" onClick={() => queryClient.invalidateQueries()} className="rounded-xl hover:bg-background">
            <RefreshCw size={18} className={cn((loadStats || loadUsers || loadProducts) && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* 📊 SECTION STATISTIQUES (KPIs - Argument Chapitre 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard icon={<Users />} title="Agriculteurs" value={stats?.totalFarmers} color="bg-green-500" loading={loadStats} />
        <StatsCard icon={<Package />} title="Offres Actives" value={stats?.totalProducts} color="bg-orange-500" loading={loadStats} />
        <StatsCard icon={<ShoppingCart />} title="Transactions" value={stats?.totalOrders} color="bg-blue-600" loading={loadStats} />
        <StatsCard icon={<MapPin />} title="Communes Rurales" value={stats?.totalCommunes} color="bg-purple-600" loading={loadStats} />
      </div>

      <Tabs defaultValue="moderation" className="w-full">
        <TabsList className="bg-muted p-1 rounded-2xl mb-8 w-fit border shadow-inner">
          <TabsTrigger value="moderation" className="px-8 py-3 font-bold rounded-xl relative">
            Modération
            {pendingProducts.length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive rounded-full text-[10px] text-white flex items-center justify-center border-2 border-background animate-bounce font-black">
                {pendingProducts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="px-8 py-3 font-bold rounded-xl">Utilisateurs</TabsTrigger>
          <TabsTrigger value="catalog" className="px-8 py-3 font-bold rounded-xl">Tout le Catalogue</TabsTrigger>
        </TabsList>

        {/* --- ONGLET : MODÉRATION (Validation de Qualité) --- */}
        <TabsContent value="moderation" className="animate-in slide-in-from-bottom-4 duration-500">
          <Card className="rounded-[2rem] border-none shadow-xl bg-card">
            <CardHeader>
              <CardTitle className="text-2xl font-black">Produits en attente d'approbation</CardTitle>
              <CardDescription>Vérifiez la traçabilité et l'origine avant la mise en ligne publique.</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingProducts.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground italic bg-muted/20 rounded-3xl border-2 border-dashed">
                  Zéro produit en attente de modération. ✅
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingProducts.map(p => (
                    <div key={p.id} className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-6 border rounded-[1.5rem] bg-card hover:bg-muted/10 transition-colors gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="font-black text-xl text-foreground">{p.name}</h4>
                          <Badge variant="outline" className="text-primary border-primary/20 font-bold">{p.category}</Badge>
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-none uppercase text-[10px] font-bold tracking-widest">{p.commune}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl italic">"{p.description || 'Pas de description.'}"</p>
                        <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500 uppercase tracking-tighter">
                          <span>Prix: {formatCurrency(p.price)}</span>
                          <span>Stock: {p.availableQuantity} {p.unit}</span>
                          <span className="text-brand-orange">Récolté le: {p.harvestDate ? format(new Date(p.harvestDate), 'dd/MM/yyyy') : 'N/C'}</span>
                        </div>
                      </div>
                      <div className="flex gap-3 w-full lg:w-auto">
                        <Button onClick={() => approveMutation.mutate(p.id)} className="flex-1 bg-primary hover:bg-primary/90 font-black text-white" disabled={approveMutation.isPending}>
                          {approveMutation.isPending ? <Loader2 className="animate-spin" /> : <><Check className="mr-2 h-4 w-4" /> APPROUVER</>}
                        </Button>
                        <Button variant="destructive" onClick={() => deleteProductMutation.mutate(p.id)} className="flex-1 font-black" disabled={deleteProductMutation.isPending}>
                          <X className="mr-2 h-4 w-4" /> REJETER
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- ONGLET : UTILISATEURS (Gouvernance) --- */}
        <TabsContent value="users" className="animate-in fade-in duration-500">
          <Card className="rounded-[2rem] border-none shadow-xl bg-card">
            <CardHeader className="flex flex-col md:flex-row justify-between gap-4 border-b bg-muted/20 pb-8">
              <div>
                <CardTitle className="text-2xl font-black tracking-tight text-foreground">Gestion des Comptes</CardTitle>
                <CardDescription>Gérez l'accès des producteurs ruraux et des acheteurs urbains.</CardDescription>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input placeholder="Rechercher nom ou email..." className="pl-10 h-12 rounded-xl bg-background border-border" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
              </div>
            </CardHeader>
            <CardContent className="pt-8">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Identité</TableHead>
                    <TableHead className="font-bold">Rôle</TableHead>
                    <TableHead className="font-bold">Localisation</TableHead>
                    <TableHead className="font-bold">Statut</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersList.map(u => (
                    <TableRow key={u.id} className="group hover:bg-muted/5 transition-colors">
                      <TableCell>
                        <p className="font-bold text-foreground">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("capitalize text-[9px] font-black tracking-widest", u.userType === 'farmer' ? "bg-primary text-white" : "bg-brand-orange text-white")}>
                           {u.userType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{u.location || 'Haut-Katanga'}</TableCell>
                      <TableCell>
                        <Badge variant={u.isActive ? "default" : "secondary"} className="text-[10px] uppercase font-bold">
                          {u.isActive ? "Actif" : "Suspendu"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => toggleUserMutation.mutate({ id: u.id, active: !u.isActive })}
                          className={cn("font-bold rounded-lg", u.isActive ? "text-destructive hover:bg-destructive/10" : "text-primary hover:bg-primary/10")}
                        >
                          {u.isActive ? "Suspendre" : "Réactiver"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- ONGLET : CATALOGUE TOTAL --- */}
        <TabsContent value="catalog" className="animate-in fade-in duration-500">
          <Card className="rounded-[2rem] border-none shadow-xl bg-card">
             <CardHeader className="flex flex-col md:flex-row items-center justify-between border-b bg-muted/20 pb-8 gap-4">
                <div>
                  <CardTitle className="text-2xl font-black text-foreground">Inventaire Lubumbashi</CardTitle>
                  <CardDescription>Visualisation de tous les produits en ligne.</CardDescription>
                </div>
                <Input placeholder="Filtrer par nom..." className="w-full md:w-64 h-11 bg-background" value={productSearch} onChange={e => setProductSearch(e.target.value)} />
             </CardHeader>
             <CardContent className="pt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {productsList.map(p => (
                    <div key={p.id} className="p-6 border rounded-2xl flex justify-between items-center bg-card shadow-sm hover:shadow-md transition-all">
                       <div className="space-y-1">
                         <p className="font-black text-lg text-foreground tracking-tight">{p.name}</p>
                         <p className="text-sm text-brand-orange font-black uppercase">{formatCurrency(p.price)}</p>
                         <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Commune : {p.commune}</p>
                       </div>
                       <div className="flex flex-col items-end gap-2">
                         <Badge variant={p.isApproved ? "default" : "outline"} className={cn("text-[9px] font-black uppercase", p.isApproved ? "bg-primary/10 text-primary border-none" : "text-muted-foreground")}>
                            {p.isApproved ? "EN LIGNE" : "BROUILLON"}
                         </Badge>
                         <Button variant="ghost" size="icon" className="text-destructive h-9 w-9 hover:bg-destructive/10 rounded-xl" onClick={() => deleteProductMutation.mutate(p.id)} title="Supprimer">
                            <Trash2 size={16}/>
                         </Button>
                       </div>
                    </div>
                  ))}
                </div>
             </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- SOUS-COMPOSANT KPI CARD (RÉUTILISABLE) ---
function StatsCard({ icon, title, value, color, loading }: { icon: React.ReactNode, title: string, value?: number, color: string, loading: boolean }) {
  return (
    <Card className="border-none shadow-lg bg-card overflow-hidden transition-transform hover:scale-[1.02] duration-300">
      <CardContent className="p-0 flex h-28">
        <div className={cn("w-20 flex items-center justify-center text-white text-3xl shadow-inner", color)}>{icon}</div>
        <div className="flex-1 p-6 flex flex-col justify-center bg-card">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">{title}</p>
          {loading ? <Loader2 className="animate-spin h-6 w-6 text-primary" /> : <p className="text-3xl font-black tracking-tighter text-foreground leading-none">{value || 0}</p>}
        </div>
      </CardContent>
    </Card>
  );
}