import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { 
  Package, ShoppingCart, MessageCircle, Plus, Edit, 
  Trash2, MapPin, Loader2, Tractor, CheckCircle, Wifi, WifiOff, 
  User, Mail, Phone, Calendar, ShieldCheck, UserCircle // ✅ Nouveaux imports
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
import { OrderWithDetails, ContactWithDetails } from "@/lib/types"

export default function FarmerDashboard() {
  const { user, logout, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const isOnline = useIsOnline();
  const [, setLocation] = useLocation();
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const [showProductForm, setShowProductForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false); // ✅ État pour le profil

  // 🛡️ SÉCURISATION RBAC
  if (!isAuthenticated || user?.userType !== 'farmer') {
    return (
      <div className="container mx-auto py-20 flex flex-col items-center justify-center animate-in fade-in">
        <Tractor size={80} className="text-muted-foreground mb-6 opacity-20" />
        <h2 className="text-2xl font-black tracking-tight mb-4 text-foreground">Accès Producteur Requis</h2>
        <Button onClick={() => setLocation("/login")} className="bg-primary px-8 rounded-xl font-bold">SE CONNECTER</Button>
      </div>
    );
  }

  // --- REQUÊTES DE DONNÉES ---
  const { data: products = [], isLoading: loadProducts } = useQuery<Product[]>({
    queryKey: ["/api/farmer/products", user.id],
    queryFn: async () => (await apiRequest('GET', `/api/farmer/${user.id}/products`)).json(),
  });

  const { data: orders = [], isLoading: loadOrders } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/farmer/orders", user.id],
    queryFn: async () => (await apiRequest('GET', `/api/farmer/${user.id}/orders`)).json(),
  });

  const { data: contacts = [], isLoading: loadContacts } = useQuery<ContactWithDetails[]>({
    queryKey: ["/api/farmer/contacts", user.id],
    queryFn: async () => (await apiRequest('GET', `/api/farmer/${user.id}/contacts`)).json(),
  });

  // --- MUTATIONS ---
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest('DELETE', `/api/products/${id}`),
    onSuccess: () => {
      toast({ title: "Produit supprimé", description: "L'offre a été retirée du catalogue." });
      queryClient.invalidateQueries({ queryKey: ["/api/farmer/products"] });
    }
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => 
      apiRequest('PATCH', `/api/orders/${id}`, { status }),
    onSuccess: () => {
      toast({ title: "Commande mise à jour" });
      queryClient.invalidateQueries({ queryKey: ["/api/farmer/orders"] });
    }
  });

  // --- STATS ---
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const pendingMessages = contacts.filter(c => c.status === 'pending');

  return (
    <div className="container mx-auto px-4 py-8 space-y-10 transition-colors duration-300 bg-background text-foreground">
      
      {/* 🟢 HEADER DYNAMIQUE : ÉTAT DU SYSTÈME & PROFIL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card border p-8 rounded-[2rem] shadow-sm">
        <div className="flex items-start gap-4">
          {/* Avatar cliquable pour voir le profil */}
          <button 
            onClick={() => setShowProfile(true)}
            className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center hover:scale-105 transition-transform border border-primary/20"
          >
            <UserCircle size={40} />
          </button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tighter">Mon Espace <span className="text-primary">Producteur</span></h1>
              {isOnline ? 
                <Badge className="bg-green-500/10 text-green-600 border-green-200 gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase"><Wifi size={12}/> En ligne</Badge> : 
                <Badge variant="destructive" className="gap-1.5 animate-pulse px-3 py-1 rounded-full text-[10px] font-bold uppercase"><WifiOff size={12}/> Mode Offline</Badge>
              }
            </div>
            <p className="text-muted-foreground font-medium italic">Gérez vos récoltes pour Lubumbashi • {user.firstName} {user.lastName}</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button onClick={() => setShowProfile(true)} variant="outline" className="rounded-xl font-bold h-14 px-6 border-primary/20 hover:bg-primary/5">
            <User size={18} className="mr-2" /> MON PROFIL
          </Button>
          <Button onClick={() => { setSelectedProduct(undefined); setShowProductForm(true); }} className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 gap-2 h-14 px-8 rounded-2xl font-black text-lg">
            <Plus size={24} /> PUBLIER
          </Button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStat title="Produits" value={products.length} icon={<Package />} color="text-primary" />
        <DashboardStat title="Commandes" value={pendingOrders.length} icon={<ShoppingCart />} color="text-brand-orange" />
        <DashboardStat title="Messages" value={pendingMessages.length} icon={<MessageCircle />} color="text-blue-600" />
        <DashboardStat title="Ventes" value={deliveredOrders.length} icon={<CheckCircle />} color="text-green-600" />
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="bg-muted p-1 rounded-2xl mb-8 border shadow-inner">
          <TabsTrigger value="products" className="px-8 py-3 font-bold rounded-xl">📦 Catalogue</TabsTrigger>
          <TabsTrigger value="orders" className="px-8 py-3 font-bold rounded-xl relative">
            💰 Ventes {pendingOrders.length > 0 && <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full text-[10px] text-white flex items-center justify-center animate-bounce font-black">{pendingOrders.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="contacts" className="px-8 py-3 font-bold rounded-xl">💬 Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="animate-in slide-in-from-bottom-4">
           {loadProducts ? <Loader /> : products.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {products.map(p => (
                  <Card key={p.id} className="rounded-3xl border shadow-sm bg-card">
                    <CardContent className="p-6 flex justify-between items-center">
                      <div className="space-y-2">
                        <h3 className="font-black text-xl text-foreground">{p.name}</h3>
                        <div className="flex gap-2">
                          <Badge variant={p.isApproved ? "default" : "outline"} className="text-[10px] uppercase">{p.isApproved ? "Vérifié" : "En attente"}</Badge>
                          <span className="text-primary font-black text-sm">{formatCurrency(p.price)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium"><MapPin size={12} className="text-primary"/> {p.commune}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="icon" variant="secondary" className="rounded-xl" onClick={() => { setSelectedProduct(p); setShowProductForm(true); }}><Edit size={18}/></Button>
                        <Button size="icon" variant="ghost" className="rounded-xl text-destructive" onClick={() => confirm("Supprimer ?") && deleteMutation.mutate(p.id)}><Trash2 size={18}/></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
             </div>
           ) : <EmptyState message="Pas encore de produits." />}
        </TabsContent>
        {/* Les autres TabsContent restent inchangés... */}
      </Tabs>

      {/* 👤 MODALE PROFIL (Innovation TFC : Auto-gestion) */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="sm:max-w-md rounded-[2rem] bg-card border-border transition-colors duration-300">
          <DialogHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <User size={40} />
            </div>
            <DialogTitle className="text-2xl font-black text-foreground">Détails du Compte</DialogTitle>
            <DialogDescription>Informations d'identité et de localisation sur Agri-Connect.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <ProfileInfo icon={<User size={16}/>} label="Nom complet" value={`${user.firstName} ${user.lastName}`} />
            <ProfileInfo icon={<Mail size={16}/>} label="Email" value={user.email} />
            <ProfileInfo icon={<ShieldCheck size={16}/>} label="Rôle Système" value={user.userType} />
            <ProfileInfo icon={<MapPin size={16}/>} label="Commune / Base" value={user.location || "Non renseignée"} />
            <ProfileInfo icon={<Phone size={16}/>} label="Téléphone" value={user.phone || "Non renseigné"} />
            <ProfileInfo icon={<Calendar size={16}/>} label="Membre depuis" value={format(new Date(user.createdAt || new Date()), 'MMMM yyyy', { locale: fr })} />
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button variant="outline" className="rounded-xl font-bold" onClick={() => setShowProfile(false)}>FERMER</Button>
            <Button variant="destructive" className="rounded-xl font-bold" onClick={logout}>SE DÉCONNECTER</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL FORMULAIRE PRODUIT */}
      <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tighter">
              {selectedProduct ? "Modifier la récolte" : "Nouvelle publication"}
            </DialogTitle>
            <DialogDescription>Assurez la traçabilité en renseignant la date de récolte.</DialogDescription>
          </DialogHeader>
          <ProductForm product={selectedProduct} onSuccess={() => setShowProductForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- SOUS-COMPOSANTS ---

function ProfileInfo({ icon, label, value }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50">
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="p-2 bg-background rounded-lg text-primary">{icon}</div>
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      </div>
      <span className="font-bold text-foreground text-sm">{value}</span>
    </div>
  );
}

function DashboardStat({ title, value, icon, color }: any) {
  return (
    <Card className="border-none shadow-md bg-card rounded-3xl group transition-all duration-300 hover:shadow-xl">
      <CardContent className="p-6 flex items-center gap-4">
        <div className={cn("p-4 rounded-2xl bg-muted transition-transform group-hover:scale-110", color)}>{icon}</div>
        <div>
          <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{title}</p>
          <p className="text-2xl font-black text-foreground">{value || 0}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Loader() {
  return <div className="flex flex-col items-center justify-center py-24 gap-4"><Loader2 className="animate-spin text-primary" size={48} /><p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Synchronisation...</p></div>;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-24 border-2 border-dashed rounded-[3rem] bg-muted/10 opacity-60">
      <Package size={56} className="mx-auto mb-6 text-muted-foreground/30" />
      <p className="text-lg font-medium italic text-foreground">{message}</p>
    </div>
  );
}