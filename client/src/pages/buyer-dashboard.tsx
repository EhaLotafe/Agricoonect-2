// client/src/pages/buyer-dashboard.tsx
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
  AlertCircle, RefreshCw, User, PhoneCall 
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
import { formatCurrency, cn } from "@/lib/utils";
import { OrderWithDetails } from "@/lib/types";
import { Link, useLocation } from "wouter";

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(5, "Merci d'étoffer votre avis."),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

export default function BuyerDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  /**
   * 🛡️ CONTRÔLE D'ACCÈS RBAC
   */
  if (!isAuthenticated || user?.userType !== "buyer") {
    return (
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <Card className="max-w-md border-none shadow-2xl rounded-[2.5rem] bg-card text-center p-10">
          <div className="p-4 bg-destructive/10 rounded-full mb-6 text-destructive inline-block"><AlertCircle size={40} /></div>
          <h3 className="text-2xl font-black uppercase tracking-tighter">Accès Client Requis</h3>
          <p className="text-muted-foreground mb-8 italic">Espace réservé au suivi des achats urbains.</p>
          <Button onClick={() => setLocation("/login")} className="w-full h-14 bg-primary rounded-2xl font-black shadow-lg">SE CONNECTER</Button>
        </Card>
      </div>
    );
  }

  // --- COLLECTE DES DONNÉES D'ACHAT ---
  const { data: orders = [], isLoading: ordersLoading, refetch } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/buyer/orders", user.id],
    queryFn: async () => (await apiRequest('GET', `/api/buyer/${user.id}/orders`)).json(),
  });

  const reviewForm = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 5, comment: '' },
  });

  // --- MUTATION : FIDÉLISATION PAR L'ÉCOUTE (CHAPITRE 1) ---
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
      toast({ title: "Avis publié", description: "Merci de contribuer à la transparence du marché." });
      setShowReviewDialog(false);
      reviewForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/buyer/orders"] });
    }
  });

  const getStatusInfo = (status: string) => {
    const configs: Record<string, { label: string, color: string, icon: any }> = {
      pending: { label: "En attente", color: "bg-yellow-500/10 text-yellow-600 border-yellow-200", icon: Clock },
      confirmed: { label: "Validée", color: "bg-blue-500/10 text-blue-600 border-blue-200", icon: CheckCircle },
      delivered: { label: "Reçue", color: "bg-green-500/10 text-green-600 border-green-200", icon: Package },
      cancelled: { label: "Annulée", color: "bg-red-500/10 text-red-600 border-red-200", icon: AlertCircle },
    };
    return configs[status] || { label: status, color: "bg-muted", icon: Package };
  };

  const pending = orders.filter(o => o.status === 'pending');
  const delivered = orders.filter(o => o.status === 'delivered');

  return (
    <div className="container mx-auto px-4 py-8 space-y-10 animate-in fade-in duration-500">
      
      {/* Header Dashboard */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-card border p-8 rounded-[2.5rem] shadow-sm">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tighter uppercase">Mes <span className="text-primary">Achats Frais</span></h1>
          <p className="text-muted-foreground font-medium italic">Suivi des récoltes commandées en circuit court.</p>
        </div>
        <div className="flex gap-3">
           <Button onClick={() => refetch()} variant="ghost" className="rounded-xl h-12 px-6 border">
            <RefreshCw size={14} className={cn("mr-2", ordersLoading && "animate-spin")} /> ACTUALISER
          </Button>
          <Badge className="bg-primary/10 text-primary py-2 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest">ESPACE CLIENT</Badge>
        </div>
      </div>

      {/* Statistiques Quantitatives de consommation */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickStat title="Total Commandes" value={orders.length} icon={<ShoppingCart />} color="text-slate-600" />
        <QuickStat title="À Recevoir" value={pending.length} icon={<Clock />} color="text-yellow-600" />
        <QuickStat title="Déjà Livrées" value={delivered.length} icon={<Package />} color="text-primary" />
        <QuickStat title="Évaluations" value={delivered.length} icon={<Star />} color="text-orange-500" />
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-muted p-1 rounded-2xl mb-8 border">
          <TabsTrigger value="all" className="px-8 py-3 font-bold rounded-xl uppercase text-[10px]">Toutes</TabsTrigger>
          <TabsTrigger value="pending" className="px-8 py-3 font-bold rounded-xl uppercase text-[10px] relative">
            En attente {pending.length > 0 && <span className="ml-2 bg-orange-500 text-white px-1.5 rounded-full text-[8px]">{pending.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="delivered" className="px-8 py-3 font-bold rounded-xl uppercase text-[10px]">Livrées</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {ordersLoading ? (
            <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-primary" size={32} /></div>
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
            <div className="text-center py-24 border-2 border-dashed rounded-[3rem] opacity-30">
               <ShoppingCart size={48} className="mx-auto mb-4" />
               <p className="italic">Aucune transaction enregistrée.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* MODAL NOTATION (Qualité SI) */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="rounded-[2.5rem] p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Évaluer la récolte</DialogTitle>
            <DialogDescription className="font-medium">Votre retour aide à valoriser les meilleurs producteurs de Lubumbashi.</DialogDescription>
          </DialogHeader>
          
          <div className="bg-muted/50 p-4 rounded-2xl flex items-center gap-4 my-4">
             <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-black">{selectedOrder?.product.name[0]}</div>
             <p className="font-black uppercase text-sm">{selectedOrder?.product.name}</p>
          </div>

          <Form {...reviewForm}>
            <form onSubmit={reviewForm.handleSubmit(data => reviewMutation.mutate(data))} className="space-y-6">
              <FormField control={reviewForm.control} name="rating" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase opacity-60">Qualité constatée</FormLabel>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={28} className={cn("cursor-pointer transition-transform active:scale-75", s <= field.value ? "fill-yellow-400 text-yellow-400" : "text-slate-200")} onClick={() => field.onChange(s)} />
                    ))}
                  </div>
                </FormItem>
              )} />
              <FormField control={reviewForm.control} name="comment" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase opacity-60">Commentaire</FormLabel>
                  <FormControl><Textarea placeholder="Fraîcheur, goût, ponctualité..." className="rounded-2xl bg-muted/20 border-none h-24" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full h-14 bg-primary font-black rounded-2xl shadow-xl uppercase tracking-widest text-xs" disabled={reviewMutation.isPending}>
                {reviewMutation.isPending ? <RefreshCw className="animate-spin" /> : "PUBLIER MON AVIS"}
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
    <Card className="border-none shadow-md bg-card rounded-[1.5rem]">
      <CardContent className="p-6 flex items-center gap-4">
        <div className={cn("p-3 rounded-xl bg-muted transition-colors", color)}>{icon}</div>
        <div>
          <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">{title}</p>
          <p className="text-2xl font-black text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderRow({ order, statusInfo, onReview }: { order: OrderWithDetails, statusInfo: any, onReview: () => void }) {
  const StatusIcon = statusInfo.icon;
  return (
    <Card className="overflow-hidden border bg-card rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              <h3 className="font-black text-xl uppercase tracking-tighter">{order.product.name}</h3>
              <Badge className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border-none", statusInfo.color)}>
                <StatusIcon size={10} className="mr-1" /> {statusInfo.label}
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
              N°{order.id} • {format(new Date(order.createdAt), 'dd MMMM yyyy', { locale: fr })}
            </p>
            <div className="flex gap-4 pt-2">
              <span className="text-sm font-black text-primary">{formatCurrency(order.totalPrice)}</span>
              <span className="text-sm font-bold text-muted-foreground italic">{order.quantity} {order.product.unit}s</span>
            </div>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            {/* ☎️ Désenclavement rural : Contact direct par téléphone */}
            <a href={`tel:${order.farmer.phone}`} className="flex-1 md:flex-none">
                <Button variant="outline" size="sm" className="w-full rounded-xl gap-2 font-bold h-11 border-primary/20 text-primary">
                    <PhoneCall size={16} /> APPELER
                </Button>
            </a>
            
            {order.status === 'delivered' && (
              <Button size="sm" className="flex-1 md:flex-none bg-orange-500 text-white font-bold rounded-xl h-11 shadow-lg" onClick={onReview}>
                NOTER
              </Button>
            )}
            <Link href={`/products/${order.product.id}`} className="flex-1 md:flex-none">
              <Button size="sm" variant="secondary" className="w-full rounded-xl font-bold h-11 border">DÉTAILS</Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}