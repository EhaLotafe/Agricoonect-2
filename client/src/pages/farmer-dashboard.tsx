// client/src/pages/farmer-dashboard.tsx
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Package, ShoppingCart, MessageCircle, Plus, Edit, 
  Trash2, MapPin, Loader2, Tractor, CheckCircle, Wifi, WifiOff, 
  User, Mail, Phone, Calendar, ShieldCheck, UserCircle, BarChart3, TrendingUp
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useIsOnline } from "@/hooks/use-online";
import { useLocation } from "wouter";
import ProductForm from "@/components/product-form";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, cn } from "@/lib/utils";
import { Product } from "@shared/schema"; 
import { OrderWithDetails, ContactWithDetails, MarketTrend } from "@/lib/types";

export default function FarmerDashboard() {
  const { user, logout, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const isOnline = useIsOnline();
  const [, setLocation] = useLocation();
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const [showProductForm, setShowProductForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  /**
   * 🛡️ Contrôle d'Accès RBAC
   */
  if (!isAuthenticated || user?.userType !== 'farmer') {
    return (
      <div className="container mx-auto py-20 flex flex-col items-center justify-center">
        <Tractor size={80} className="text-muted-foreground mb-6 opacity-20" />
        <h2 className="text-2xl font-black mb-4 uppercase">Accès Producteur Requis</h2>
        <Button onClick={() => setLocation("/login")} className="font-bold rounded-xl">SE CONNECTER</Button>
      </div>
    );
  }

  // --- COLLECTE DES DONNÉES (TanStack Query) ---
  
  const { data: products = [], isLoading: loadProducts } = useQuery<Product[]>({
    queryKey: ["/api/farmer/products", user.id],
    queryFn: async () => (await apiRequest('GET', `/api/farmer/${user.id}/products`)).json(),
  });

  const { data: trends = [], isLoading: loadTrends } = useQuery<MarketTrend[]>({
    queryKey: ["/api/market-trends"],
    queryFn: async () => (await apiRequest('GET', '/api/market-trends')).json(),
    enabled: isOnline // Les tendances nécessitent le moteur d'analyse en ligne
  });

  const { data: orders = [] } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/farmer/orders", user.id],
    queryFn: async () => (await apiRequest('GET', `/api/farmer/${user.id}/orders`)).json(),
  });

  // --- GESTION DES ACTIONS ---

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest('DELETE', `/api/products/${id}`),
    onSuccess: () => {
      toast({ title: "Produit supprimé" });
      queryClient.invalidateQueries({ queryKey: ["/api/farmer/products"] });
    }
  });

  const pendingOrders = orders.filter(o => o.status === 'pending');

  return (
    <div className="container mx-auto px-4 py-8 space-y-10 animate-in fade-in duration-500">
      
      {/* Header Statut & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-card border p-8 rounded-[2.5rem] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
            <Tractor size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black tracking-tighter uppercase">Espace Producteur</h1>
              {isOnline ? 
                <Badge className="bg-green-500/10 text-green-600 border-none px-3 py-1 rounded-full text-[10px] font-bold"><Wifi size={12} className="mr-1"/> ONLINE</Badge> : 
                <Badge variant="destructive" className="animate-pulse px-3 py-1 rounded-full text-[10px] font-bold"><WifiOff size={12} className="mr-1"/> OFFLINE</Badge>
              }
            </div>
            <p className="text-muted-foreground text-sm italic font-medium">Bienvenue, {user.firstName} {user.lastName}</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button onClick={() => setShowProfile(true)} variant="outline" className="rounded-xl font-bold h-12 border-primary/20">PROFIL</Button>
          <Button onClick={() => { setSelectedProduct(undefined); setShowProductForm(true); }} className="bg-primary text-white gap-2 h-12 px-8 rounded-xl font-black">
            <Plus size={20} /> PUBLIER RÉCOLTE
          </Button>
        </div>
      </div>

      {/* Indicateurs de Performance (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStat title="Mes Récoltes" value={products.length} icon={<Package />} color="text-primary" />
        <DashboardStat title="Commandes" value={pendingOrders.length} icon={<ShoppingCart />} color="text-orange-500" />
        <DashboardStat title="Top Demande" value={trends[0]?.product || "-"} icon={<TrendingUp />} color="text-blue-600" />
        <DashboardStat title="Ventes Totales" value={orders.length} icon={<CheckCircle />} color="text-green-600" />
      </div>

      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="bg-muted p-1 rounded-2xl mb-8 border">
          <TabsTrigger value="trends" className="px-8 py-3 font-bold rounded-xl flex gap-2">
            <BarChart3 size={18}/> Intelligence du Marché
          </TabsTrigger>
          <TabsTrigger value="products" className="px-8 py-3 font-bold rounded-xl">📦 Mon Catalogue</TabsTrigger>
          <TabsTrigger value="orders" className="px-8 py-3 font-bold rounded-xl relative">
            💰 Ventes {pendingOrders.length > 0 && <span className="ml-2 bg-destructive text-white h-4 w-4 rounded-full text-[10px] flex items-center justify-center">{pendingOrders.length}</span>}
          </TabsTrigger>
        </TabsList>

        {/* --- ONGLET : INTELLIGENCE (COEUR DU MÉMOIRE) --- */}
        <TabsContent value="trends" className="animate-in slide-in-from-bottom-4">
          <Card className="rounded-[2rem] border-none shadow-xl bg-slate-900 text-white overflow-hidden">
             <CardHeader className="bg-slate-800/50 pb-8">
                <CardTitle className="text-2xl font-black uppercase tracking-tight text-primary">Analyse de la demande à Lubumbashi</CardTitle>
                <CardDescription className="text-slate-400">Basé sur les {trends.reduce((acc, t) => acc + t.demandCount, 0)} sondages récents des consommateurs urbains.</CardDescription>
             </CardHeader>
             <CardContent className="p-8">
                {loadTrends ? <Loader2 className="animate-spin mx-auto h-12 w-12 text-primary" /> : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     {trends.map((t, i) => (
                       <div key={i} className="p-6 rounded-3xl bg-slate-800 border border-slate-700 space-y-3 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform"><BarChart3 size={60}/></div>
                          <Badge className="bg-primary text-white font-black">{i + 1}er RANG</Badge>
                          <h4 className="text-2xl font-black uppercase tracking-tighter">{t.product}</h4>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-400 uppercase">Volume souhaité par le marché</p>
                            <p className="text-xl font-black text-primary">{t.totalQuantityRequested} Unités</p>
                          </div>
                          <div className="pt-4 border-t border-slate-700">
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Prix Moyen Accepté</p>
                             <p className="text-lg font-bold text-green-400">{formatCurrency(t.averageTargetPrice || 0)}</p>
                          </div>
                       </div>
                     ))}
                  </div>
                )}
             </CardContent>
          </Card>
        </TabsContent>

        {/* --- ONGLET : CATALOGUE --- */}
        <TabsContent value="products">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {products.map(p => (
                <Card key={p.id} className="rounded-3xl border shadow-sm bg-card overflow-hidden">
                  <CardContent className="p-6 flex justify-between items-center">
                    <div className="space-y-2">
                      <h3 className="font-black text-xl uppercase truncate">{p.name}</h3>
                      <div className="flex gap-2">
                        <Badge variant={p.isApproved ? "default" : "outline"} className="text-[9px] uppercase font-bold">{p.isApproved ? "Public" : "Vérification..."}</Badge>
                        <span className="text-primary font-black">{formatCurrency(p.price)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin size={12}/> {p.commune}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="secondary" className="rounded-xl" onClick={() => { setSelectedProduct(p); setShowProductForm(true); }}><Edit size={18}/></Button>
                      <Button size="icon" variant="ghost" className="rounded-xl text-destructive" onClick={() => confirm("Supprimer l'offre ?") && deleteMutation.mutate(p.id)}><Trash2 size={18}/></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {products.length === 0 && <EmptyState message="Vous n'avez publié aucune récolte." />}
           </div>
        </TabsContent>

        {/* --- ONGLET : VENTES (SIMPLIFIÉ) --- */}
        <TabsContent value="orders">
          <Card className="rounded-[2rem] border-none shadow-xl p-8">
             <div className="text-center py-10">
               <ShoppingCart size={48} className="mx-auto text-muted-foreground opacity-20 mb-4" />
               <p className="font-medium text-muted-foreground">Gestion des commandes en cours de développement.</p>
             </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Profil Modal */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="rounded-[2.5rem] bg-card border-none shadow-2xl p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-24 h-24 bg-primary text-white rounded-3xl flex items-center justify-center shadow-lg transform rotate-3">
              <UserCircle size={56} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">{user.firstName} {user.lastName}</h2>
              <Badge className="bg-primary/10 text-primary font-black uppercase text-[10px] mt-2 tracking-widest">PRODUCTEUR AGRICOLE</Badge>
            </div>
            <div className="w-full space-y-3 pt-6">
              <ProfileRow icon={<Mail size={16}/>} label="Email" value={user.email} />
              <ProfileRow icon={<MapPin size={16}/>} label="Base" value={user.location || "Lubumbashi"} />
              <ProfileRow icon={<Phone size={16}/>} label="Contact" value={user.phone || "-"} />
            </div>
            <Button variant="destructive" className="w-full rounded-2xl h-14 font-black mt-6" onClick={logout}>DÉCONNEXION</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Formulaire Produit Modal */}
      <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-8 border-none shadow-2xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-black uppercase tracking-tighter">Publication de Récolte</DialogTitle>
            <DialogDescription>Assurez la fraîcheur et la traçabilité de votre produit.</DialogDescription>
          </DialogHeader>
          <ProductForm product={selectedProduct} onSuccess={() => setShowProductForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- SOUS-COMPOSANTS ---

function DashboardStat({ title, value, icon, color }: any) {
  return (
    <Card className="border-none shadow-lg bg-card rounded-[2rem] group transition-all hover:scale-[1.03]">
      <CardContent className="p-6 flex items-center gap-4">
        <div className={cn("p-4 rounded-2xl bg-muted transition-colors group-hover:bg-primary/10", color)}>{icon}</div>
        <div>
          <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{title}</p>
          <p className="text-xl font-black text-foreground">{value || 0}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileRow({ icon, label, value }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border">
      <div className="flex items-center gap-3">
        <div className="text-primary">{icon}</div>
        <span className="text-[10px] font-black uppercase text-muted-foreground">{label}</span>
      </div>
      <span className="font-bold text-sm">{value}</span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full text-center py-20 border-2 border-dashed rounded-[3rem] opacity-40">
      <Package size={48} className="mx-auto mb-4" />
      <p className="italic font-medium">{message}</p>
    </div>
  );
}