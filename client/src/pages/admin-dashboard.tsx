// client/src/pages/admin-dashboard.tsx
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
  Loader2, ShieldAlert, MapPin, Trash2, UserCog, RefreshCw, Clock
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn, formatCurrency } from "@/lib/utils";
import { User, Product } from "@shared/schema";
import { useLocation } from "wouter";

type AdminStats = {
  totalFarmers: number;
  totalProducts: number;
  totalOrders: number;
  totalCommunes: number;
};

const translateRole = (role?: string) => {
  const roles: Record<string, string> = {
    farmer: "Producteur",
    buyer: "Acheteur",
    admin: "Administrateur",
  };
  return roles[role?.toLowerCase() || ""] || role;
};

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [userSearch, setUserSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  /**
   * 🛡️ Contrôle d'accès strict (RBAC)
   */
  if (!isAuthenticated || user?.userType !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
        <ShieldAlert className="h-20 w-20 text-destructive animate-pulse" />
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black uppercase tracking-tighter">Accès Refusé</h1>
          <p className="text-muted-foreground font-medium">Zone réservée à l'administration.</p>
        </div>
        <Button onClick={() => setLocation("/login")} className="font-bold">RETOUR</Button>
      </div>
    );
  }

  // --- COLLECTE DES DONNÉES ---
  const { data: stats, isLoading: loadStats } = useQuery<AdminStats>({ queryKey: ['/api/stats'] });
  
  const { data: usersList = [], isLoading: loadUsers } = useQuery<User[]>({
    queryKey: ['/api/admin/users', userSearch],
    queryFn: async () => (await apiRequest('GET', `/api/admin/users?search=${userSearch}`)).json(),
  });

  const { data: productsList = [], isLoading: loadProducts } = useQuery<Product[]>({
    queryKey: ['/api/admin/products', productSearch],
    queryFn: async () => (await apiRequest('GET', `/api/admin/products?search=${productSearch}`)).json(),
  });

  // --- ACTIONS D'ADMINISTRATION ---

  const approveMutation = useMutation({
    mutationFn: async (id: number) => apiRequest('PATCH', `/api/admin/products/${id}/approve`),
    onSuccess: () => {
      toast({ title: "Produit approuvé", description: "L'annonce est désormais en ligne." });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => apiRequest('DELETE', `/api/admin/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      toast({ title: "Action effectuée", description: "Le produit a été retiré du catalogue." });
    }
  });

  const toggleUserMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number, active: boolean }) => 
      apiRequest('PUT', `/api/admin/users/${id}`, { isActive: active }),
    onSuccess: () => {
      toast({ title: "Statut utilisateur mis à jour" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    }
  });

  const pendingProducts = productsList.filter(p => !p.isApproved);
  const approvedProducts = productsList.filter(p => p.isApproved);

  return (
    <div className="container mx-auto px-4 py-8 space-y-10 animate-in fade-in duration-500">
      
      {/* Header Dashboard */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card border p-8 rounded-[2rem] shadow-sm">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter text-foreground flex items-center gap-3">
            <UserCog className="text-primary h-10 w-10" /> Supervision <span className="text-primary">SI</span>
          </h1>
          <p className="text-muted-foreground font-medium italic">Régulation du marché • Lubumbashi RDC</p>
        </div>
        <div className="flex items-center gap-3 bg-muted p-2 rounded-2xl border">
          <Badge className="bg-primary text-white font-bold px-4 py-1.5 rounded-xl uppercase tracking-widest text-[9px]">ADMIN</Badge>
          <Button variant="ghost" size="icon" onClick={() => queryClient.invalidateQueries()} className="rounded-xl">
            <RefreshCw size={18} className={cn((loadStats || loadUsers || loadProducts) && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* KPIs (Indicateurs Quantitatifs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard icon={<Users />} title="Agriculteurs" value={stats?.totalFarmers} color="bg-green-600" loading={loadStats} />
        <StatsCard icon={<Package />} title="Offres" value={stats?.totalProducts} color="bg-orange-500" loading={loadStats} />
        <StatsCard icon={<ShoppingCart />} title="Commandes" value={stats?.totalOrders} color="bg-blue-600" loading={loadStats} />
        <StatsCard icon={<MapPin />} title="Communes" value={stats?.totalCommunes} color="bg-purple-600" loading={loadStats} />
      </div>

      <Tabs defaultValue="moderation" className="w-full">
        <TabsList className="bg-muted p-1 rounded-2xl mb-8 w-fit border">
          <TabsTrigger value="moderation" className="px-8 py-3 font-bold rounded-xl relative">
            Modération {pendingProducts.length > 0 && <span className="ml-2 bg-destructive text-white px-2 py-0.5 rounded-full text-[10px]">{pendingProducts.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="users" className="px-8 py-3 font-bold rounded-xl">Utilisateurs</TabsTrigger>
          <TabsTrigger value="catalog" className="px-8 py-3 font-bold rounded-xl">Inventaire</TabsTrigger>
        </TabsList>

        {/* Tab : Modération (Traçabilité & Qualité) */}
        <TabsContent value="moderation">
          <Card className="rounded-[2rem] border-none shadow-xl bg-card overflow-hidden">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-2xl font-black uppercase tracking-tight">Validation des annonces</CardTitle>
              <CardDescription>Vérifiez les preuves de récolte avant publication.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              {pendingProducts.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground italic border-2 border-dashed rounded-3xl">Aucun produit en attente.</div>
              ) : (
                <div className="space-y-6">
                  {pendingProducts.map(p => (
                    <div key={p.id} className="flex flex-col lg:flex-row items-center p-6 border rounded-3xl gap-6 bg-card hover:bg-muted/5 transition-colors">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-muted shrink-0 shadow-inner">
                        {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover" /> : <div className="flex h-full items-center justify-center text-[10px] uppercase font-bold text-muted-foreground">No img</div>}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                          <h4 className="font-black text-xl">{p.name}</h4>
                          <Badge variant="outline" className="text-[10px] uppercase">{p.commune}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground italic truncate max-w-lg">{p.description}</p>
                        <p className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                          <Clock size={12}/> Récolté le : {p.harvestDate ? format(new Date(p.harvestDate), 'dd MMM yyyy', { locale: fr }) : 'Non spécifié'}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button onClick={() => approveMutation.mutate(p.id)} size="sm" className="bg-primary text-white font-bold rounded-xl" disabled={approveMutation.isPending}>APPROUVER</Button>
                        <Button variant="outline" size="sm" onClick={() => deleteProductMutation.mutate(p.id)} className="text-destructive font-bold border-destructive/20 rounded-xl" disabled={deleteProductMutation.isPending}>REJETER</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab : Utilisateurs (Gouvernance) */}
        <TabsContent value="users">
          <Card className="rounded-[2rem] border-none shadow-xl bg-card overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 pb-6">
              <CardTitle className="text-2xl font-black uppercase tracking-tight">Acteurs du Marché</CardTitle>
              <Input placeholder="Chercher un nom..." className="w-64 bg-background h-10 rounded-xl" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest pl-8">Identité</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Rôle</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Zone</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Statut</TableHead>
                    <TableHead className="text-right font-black uppercase text-[10px] tracking-widest pr-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersList.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="pl-8">
                        <p className="font-bold">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest">{translateRole(u.userType)}</Badge></TableCell>
                      <TableCell className="text-sm">{u.location || '-'}</TableCell>
                      <TableCell><Badge variant={u.isActive ? "default" : "secondary"} className="text-[10px] uppercase font-bold">{u.isActive ? "Actif" : "Suspendu"}</Badge></TableCell>
                      <TableCell className="text-right pr-8">
                        <Button variant="ghost" size="sm" onClick={() => toggleUserMutation.mutate({ id: u.id, active: !u.isActive })} className={cn("font-bold text-xs", u.isActive ? "text-destructive" : "text-primary")}>
                          {u.isActive ? "Bannir" : "Réactiver"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab : Inventaire Global */}
        <TabsContent value="catalog">
          <Card className="rounded-[2rem] border-none shadow-xl bg-card p-8">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {approvedProducts.map(p => (
                  <div key={p.id} className="p-4 border rounded-2xl flex justify-between items-center bg-muted/10">
                     <div>
                       <p className="font-black uppercase tracking-tight text-sm">{p.name}</p>
                       <p className="text-xs font-bold text-primary">{formatCurrency(p.price)}</p>
                       <p className="text-[9px] text-muted-foreground mt-1">{p.commune}</p>
                     </div>
                     <Button variant="ghost" size="icon" className="text-destructive h-8 w-8 rounded-lg" onClick={() => deleteProductMutation.mutate(p.id)}><Trash2 size={14}/></Button>
                  </div>
                ))}
             </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Composant unitaire pour les KPIs du dashboard
 */
function StatsCard({ icon, title, value, color, loading }: { icon: React.ReactNode, title: string, value?: number, color: string, loading: boolean }) {
  return (
    <Card className="border-none shadow-lg bg-card overflow-hidden h-24 flex items-center transition-transform hover:scale-[1.02]">
      <div className={cn("w-16 h-full flex items-center justify-center text-white", color)}>{icon}</div>
      <div className="px-6 flex flex-col justify-center">
        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{title}</p>
        {loading ? <Loader2 className="animate-spin h-5 w-5 text-primary mt-1" /> : <p className="text-3xl font-black tracking-tighter">{value || 0}</p>}
      </div>
    </Card>
  );
}