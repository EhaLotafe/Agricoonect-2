import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { 
  ShoppingCart, Star, Package, CheckCircle, Clock, 
  AlertCircle, RefreshCw, LogIn, User, MapPin, PhoneCall, MessageSquare 
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { formatCurrency, cn, getCommuneColor } from "@/lib/utils";
import { OrderWithDetails } from "@/lib/types";
import { Link, useLocation } from "wouter";

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(5, "Votre avis est précieux, merci de l'étoffer un peu."),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

export default function BuyerDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  // 🛡️ SÉCURISATION RBAC (Argument Chapitre 3)
  if (!isAuthenticated || user?.userType !== "buyer") {
    return (
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <Card className="max-w-md border-border shadow-2xl rounded-[2rem] overflow-hidden animate-in fade-in zoom-in-95 bg-card">
          <CardContent className="p-10 text-center flex flex-col items-center">
            <div className="p-4 bg-destructive/10 rounded-full mb-6 text-destructive"><AlertCircle size={40} /></div>
            <h3 className="text-2xl font-black mb-2 uppercase tracking-tighter">Accès Client Requis</h3>
            <p className="text-muted-foreground mb-8">Veuillez vous connecter avec un compte acheteur pour suivre vos produits frais.</p>
            <Button onClick={() => setLocation("/login")} className="w-full bg-primary font-black py-6 rounded-2xl shadow-lg">SE CONNECTER</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- REQUÊTE COMMANDES ---
  const { data: orders = [], isLoading: ordersLoading, refetch } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/buyer/orders", user.id],
    queryFn: async () => (await apiRequest('GET', `/api/buyer/${user.id}/orders`)).json(),
  });

  const reviewForm = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 5, comment: '' },
  });

  // --- MUTATION AVIS ---
  const reviewMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      if (!selectedOrder) return;
      return await apiRequest('POST', '/api/reviews', {
        productId: selectedOrder.product.id,
        farmerId: selectedOrder.farmerId,
        rating: data.rating,
        comment: data.comment,
      });
    },
    onSuccess: () => {
      toast({ title: "Merci !", description: "Votre avis a été publié pour la communauté." });
      setShowReviewDialog(false);
      reviewForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/buyer/orders"] });
    },
    onError: (error: any) => toast({ title: "Erreur", description: error.message, variant: "destructive" }),
  });

  const getStatusInfo = (status: string) => {
    const configs: Record<string, { label: string, color: string, icon: any }> = {
      pending: { label: "Attente", color: "bg-yellow-500/10 text-yellow-600 border-yellow-200", icon: Clock },
      confirmed: { label: "Validée", color: "bg-blue-500/10 text-blue-600 border-blue-200", icon: CheckCircle },
      delivered: { label: "Reçue", color: "bg-primary/10 text-primary border-primary/20", icon: Package },
      cancelled: { label: "Annulée", color: "bg-red-500/10 text-red-600 border-red-200", icon: AlertCircle },
    };
    return configs[status] || { label: status, color: "bg-muted", icon: Package };
  };

  const pending = orders.filter(o => o.status === 'pending');
  const delivered = orders.filter(o => o.status === 'delivered');

  return (
    <div className="container mx-auto px-4 py-8 space-y-10 transition-all duration-300">
      
      {/* 🟢 HEADER STATS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card border p-8 rounded-[2rem] shadow-sm">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter uppercase">Mes <span className="text-primary">Achats</span></h1>
          <p className="text-muted-foreground font-medium italic">Suivi de vos produits en provenance directe des communes rurales.</p>
        </div>
        <div className="flex gap-2">
           <Button onClick={() => refetch()} variant="outline" size="sm" className="rounded-xl h-12 px-6 gap-2 font-black border-primary/20 hover:bg-primary/5">
            <RefreshCw size={14} className={cn(ordersLoading && "animate-spin")} /> ACTUALISER
          </Button>
          <Badge className="bg-primary/10 text-primary border-none py-2 px-4 rounded-xl font-black">{user.firstName}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickStat title="Commandes" value={orders.length} icon={<ShoppingCart size={20}/>} color="text-slate-600" />
        <QuickStat title="En attente" value={pending.length} icon={<Clock size={20}/>} color="text-yellow-600" />
        <QuickStat title="Livrées" value={delivered.length} icon={<Package size={20}/>} color="text-primary" />
        <QuickStat title="Points" value={delivered.length * 10} icon={<Star size={20}/>} color="text-brand-orange" />
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-muted p-1 rounded-2xl mb-8 border shadow-inner">
          <TabsTrigger value="all" className="px-8 py-3 font-bold rounded-xl uppercase text-[10px] tracking-widest">Toutes</TabsTrigger>
          <TabsTrigger value="pending" className="px-8 py-3 font-bold rounded-xl uppercase text-[10px] tracking-widest relative">
            En attente {pending.length > 0 && <span className="ml-2 h-2 w-2 bg-brand-orange rounded-full animate-ping" />}
          </TabsTrigger>
          <TabsTrigger value="delivered" className="px-8 py-3 font-bold rounded-xl uppercase text-[10px] tracking-widest">Livrées</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          {ordersLoading ? (
            <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-primary" size={40} /></div>
          ) : orders.length > 0 ? (
            orders.map(order => (
              <OrderRow 
                key={order.id} 
                order={order} 
                statusInfo={getStatusInfo(order.status)} 
                onReview={() => { setSelectedOrder(order); setShowReviewDialog(true); }} 
              />
            ))
          ) : (
            <EmptyState />
          )}
        </TabsContent>
      </Tabs>

      {/* 📝 DIALOG AVIS CLIENT */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] bg-card border-border shadow-2xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tighter">Noter le producteur</DialogTitle>
            <DialogDescription className="font-medium">Aidez les autres habitants de Lubumbashi à trouver les meilleurs produits.</DialogDescription>
          </DialogHeader>
          
          <div className="bg-muted/50 p-4 rounded-2xl border border-border/50 my-6 flex items-center gap-4">
             <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary font-bold">{selectedOrder?.product.name[0]}</div>
             <div>
                <p className="font-bold text-foreground">{selectedOrder?.product.name}</p>
                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Vendeur : {selectedOrder?.farmer.firstName}</p>
             </div>
          </div>

          <Form {...reviewForm}>
            <form onSubmit={reviewForm.handleSubmit(data => reviewMutation.mutate(data))} className="space-y-6">
              <FormField
                control={reviewForm.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-xs uppercase tracking-widest opacity-70">Qualité du produit</FormLabel>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={32} className={cn("cursor-pointer transition-all active:scale-75", s <= field.value ? "fill-yellow-400 text-yellow-400" : "text-slate-200 dark:text-slate-800")} onClick={() => field.onChange(s)} />
                      ))}
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={reviewForm.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-xs uppercase tracking-widest opacity-70">Commentaire détaillé</FormLabel>
                    <FormControl><Textarea placeholder="Racontez-nous la fraîcheur, le goût..." className="rounded-2xl bg-muted/20 border-border h-24" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-14 bg-primary font-black rounded-2xl shadow-xl shadow-primary/20 uppercase tracking-widest text-xs" disabled={reviewMutation.isPending}>
                {reviewMutation.isPending ? <RefreshCw className="animate-spin mr-2"/> : "PUBLIER MON AVIS"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- SOUS-COMPOSANTS ---

function QuickStat({ title, value, icon, color }: any) {
  return (
    <Card className="border-none shadow-md bg-card group hover:shadow-xl transition-all">
      <CardContent className="p-6 flex items-center gap-4">
        <div className={cn("p-3 rounded-2xl bg-muted transition-transform group-hover:rotate-6", color)}>{icon}</div>
        <div>
          <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{title}</p>
          <p className="text-2xl font-black tracking-tighter text-foreground mt-0.5">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderRow({ order, statusInfo, onReview }: { order: OrderWithDetails, statusInfo: any, onReview: () => void }) {
  const StatusIcon = statusInfo.icon;
  return (
    <Card className="overflow-hidden border-border bg-card hover:bg-muted/5 transition-all border-l-8 rounded-2xl shadow-sm" style={{ borderLeftColor: 'currentColor' }}>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-3">
              <h3 className="font-black text-xl tracking-tight text-foreground">{order.product.name}</h3>
              <Badge className={cn("text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full", statusInfo.color)}>
                <StatusIcon size={12} className="mr-1.5" /> {statusInfo.label}
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">
              Commande #{order.id} • {format(new Date(order.createdAt), 'dd MMMM yyyy', { locale: fr })}
            </p>
            
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2"><div className="p-1.5 bg-primary/10 rounded-lg text-primary"><User size={14}/></div> <span className="text-sm font-bold">{order.farmer.firstName}</span></div>
              <div className="flex items-center gap-2 font-black text-brand-orange text-sm uppercase"><span>{formatCurrency(order.totalPrice)}</span></div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm font-bold italic"><Package size={14}/> <span>{order.quantity} {order.product.unit}</span></div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* ✅ Bouton de contact direct (Désenclavement rural) */}
            <a href={`tel:${order.farmer.phone}`} className="flex-1 md:flex-none">
                <Button variant="outline" size="sm" className="w-full rounded-xl gap-2 font-bold h-11 border-primary/20 text-primary">
                    <PhoneCall size={16} /> APPELER
                </Button>
            </a>
            
            {order.status === 'delivered' && (
              <Button size="sm" variant="outline" className="flex-1 md:flex-none border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white font-bold rounded-xl h-11 transition-all shadow-sm" onClick={onReview}>
                <Star size={16} className="mr-2" /> NOTER
              </Button>
            )}
            <Link href={`/products/${order.product.id}`} className="flex-1 md:flex-none">
              <Button size="sm" variant="secondary" className="w-full rounded-xl font-bold h-11 px-8 shadow-sm">VOIR PRODUIT</Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-24 border-2 border-dashed rounded-[3rem] bg-muted/10">
      <ShoppingCart size={64} className="mx-auto text-muted-foreground/10 mb-6" />
      <h3 className="text-2xl font-black tracking-tight mb-2">Aucun achat détecté</h3>
      <p className="text-muted-foreground mb-10 max-w-xs mx-auto font-medium text-sm leading-relaxed italic">Vous n'avez pas encore passé de commande directe auprès de nos producteurs ruraux.</p>
      <Link href="/products"><Button className="bg-primary px-10 h-14 rounded-2xl font-black shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 uppercase tracking-widest text-xs">ACCÉDER AU MARCHÉ</Button></Link>
    </div>
  );
}