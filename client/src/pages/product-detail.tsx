// client/src/pages/product-detail.tsx
import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Star, MapPin, Phone, User, Package, MessageCircle, ShoppingCart, Clock, ArrowLeft, Loader2, Send, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatCurrency, getFreshnessStatus, getCommuneColor, cn } from "@/lib/utils";
import { ProductWithFarmer, ReviewWithUser } from "@/lib/types";

// Schémas de validation
const orderSchema = z.object({
  quantity: z.number().min(1, "Minimum 1"),
  deliveryAddress: z.string().min(5, "L'adresse est trop courte"),
});

const contactSchema = z.object({
  message: z.string().min(5, "Message trop court"),
  buyerPhone: z.string().min(9, "Numéro invalide"),
});

export default function ProductDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: product, isLoading, isError } = useQuery<ProductWithFarmer>({
    queryKey: [`/api/products/${id}`],
    queryFn: async () => (await apiRequest('GET', `/api/products/${id}`)).json(),
    enabled: !!id,
  });

  const { data: reviews = [] } = useQuery<ReviewWithUser[]>({
    queryKey: [`/api/products/${id}/reviews`],
    queryFn: async () => (await apiRequest('GET', `/api/products/${id}/reviews`)).json(),
    enabled: !!id,
  });

  const orderMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!product) throw new Error("Produit non défini");
      
      const payload = {
        productId: Number(product.id),
        farmerId: Number(product.farmerId),
        quantity: Number(data.quantity),
        totalPrice: (parseFloat(product.price) * data.quantity).toFixed(2),
        deliveryAddress: data.deliveryAddress,
        status: "pending" // Ajout explicite pour la validation Zod backend
      };
      
      const res = await apiRequest('POST', '/api/orders', payload);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Succès !", description: "Votre commande est transmise au producteur." });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${id}`] });
      setLocation("/buyer/dashboard");
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <Loader2 className="animate-spin text-primary" size={48} />
      <p className="font-black text-[10px] uppercase tracking-widest animate-pulse text-muted-foreground">Extraction de la traçabilité...</p>
    </div>
  );

  if (isError || !product) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-black">Produit introuvable</h2>
      <Button onClick={() => setLocation("/products")} className="mt-4 rounded-xl">Retour au marché</Button>
    </div>
  );

  const freshness = getFreshnessStatus(product.harvestDate);

  return (
    <div className="container mx-auto px-4 py-8 space-y-12 animate-in fade-in duration-700">
      
      <Button variant="ghost" onClick={() => window.history.back()} className="gap-2 font-bold hover:text-primary transition-colors rounded-xl">
        <ArrowLeft size={16} /> Retour au catalogue
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* BLOC IMAGE */}
        <div className="space-y-6">
          <Card className="overflow-hidden border-none shadow-2xl rounded-[2.5rem] aspect-square bg-muted relative group">
            {product.images?.[0] ? (
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground opacity-20"><Package size={64} /></div>
            )}
            <div className="absolute bottom-6 left-6 flex flex-wrap gap-2">
               <Badge className={cn("px-4 py-2 border-none shadow-lg font-black uppercase text-[10px]", getCommuneColor(product.commune))}>📍 {product.commune}</Badge>
               <Badge className={cn("px-4 py-2 border-none shadow-lg font-black uppercase text-[10px] bg-white text-slate-900", freshness.color)}>
                 <Clock size={14} className="mr-2" /> {freshness.label}
               </Badge>
            </div>
          </Card>
        </div>

        {/* BLOC INFOS */}
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="uppercase text-[10px] font-black tracking-widest">{product.category}</Badge>
              {product.isApproved && <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase flex gap-1"><ShieldCheck size={12}/> Certifié </Badge>}
            </div>
            <h1 className="text-5xl font-black text-foreground tracking-tighter uppercase leading-none">{product.name}</h1>
            <p className="flex items-center gap-2 text-muted-foreground font-medium italic"><MapPin size={18} className="text-primary" /> {product.location}, Lubumbashi RDC</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-card p-6 rounded-[2rem] border border-border shadow-sm">
                <p className="text-[10px] font-black text-muted-foreground uppercase mb-1 tracking-widest opacity-60">Prix Unitaire</p>
                <h2 className="text-3xl font-black text-brand-orange">{formatCurrency(product.price)} <span className="text-xs font-normal opacity-50">/ {product.unit}</span></h2>
             </div>
             <div className="bg-card p-6 rounded-[2rem] border border-border shadow-sm">
                <p className="text-[10px] font-black text-muted-foreground uppercase mb-1 tracking-widest opacity-60">Stock</p>
                <h3 className="text-3xl font-black text-primary">{product.availableQuantity} <span className="text-xs font-normal opacity-50 uppercase">{product.unit}s</span></h3>
             </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-black text-sm uppercase tracking-widest text-muted-foreground border-l-4 border-primary pl-3">Description du produit</h4>
            <p className="text-muted-foreground leading-relaxed italic text-lg">"{product.description || "Aucune description fournie par le producteur."}"</p>
          </div>

          <div className="pt-6 border-t flex flex-col sm:flex-row gap-4">
            {isAuthenticated && user?.userType === 'buyer' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <OrderDialog product={product} mutation={orderMutation} />
                <ContactDialog product={product} />
              </div>
            ) : !isAuthenticated ? (
              <Button onClick={() => setLocation('/login')} className="w-full h-16 bg-slate-900 text-white font-black text-lg rounded-2xl shadow-xl">SE CONNECTER POUR ACHETER</Button>
            ) : (
              <Badge variant="outline" className="w-full py-4 justify-center font-bold text-muted-foreground border-dashed">
                Connecté en mode {user?.userType}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 p-5 rounded-3xl bg-primary/5 border border-primary/10">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg"><User size={24}/></div>
            <div>
              <p className="text-[9px] font-black uppercase text-primary opacity-70">Responsable Production</p>
              <p className="font-black text-lg">{product.farmer?.firstName} {product.farmer?.lastName}</p>
            </div>
            <div className="ml-auto">
               <Badge className="bg-white text-primary border-primary/20">{product.farmer?.phone || "N/A"}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* AVIS */}
      <section className="pt-12 border-t space-y-8">
        <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3"><Star className="text-yellow-500 fill-yellow-500" /> Retours Consommateurs</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.length > 0 ? reviews.map(rev => (
            <Card key={rev.id} className="border-none shadow-md bg-card rounded-[2rem] p-6 space-y-3">
              <div className="flex justify-between items-center">
                <p className="font-bold text-sm">{rev.buyer.firstName}</p>
                <div className="flex text-yellow-500">{[...Array(rev.rating)].map((_, i) => <Star key={i} size={12} fill="currentColor"/>)}</div>
              </div>
              <p className="text-xs text-muted-foreground italic">"{rev.comment}"</p>
            </Card>
          )) : <p className="text-muted-foreground italic text-sm">Aucun avis pour le moment.</p>}
        </div>
      </section>
    </div>
  );
}

function OrderDialog({ product, mutation }: any) {
  const form = useForm({
    resolver: zodResolver(orderSchema),
    defaultValues: { quantity: 1, deliveryAddress: '' }
  });
  const qty = form.watch('quantity');
  const total = parseFloat(product.price) * (qty || 0);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="h-16 bg-primary text-white font-black text-lg gap-3 shadow-xl rounded-2xl hover:scale-[1.02] transition-transform">
          <ShoppingCart size={22} /> COMMANDER
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[2.5rem] p-8">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">Finaliser l'achat</DialogTitle>
          <DialogDescription className="font-bold text-primary text-[10px] uppercase tracking-widest mt-1">
             Transaction directe • Circuit court digital
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(data => mutation.mutate(data))} className="space-y-6 pt-4">
            <FormField control={form.control} name="quantity" render={({ field }) => (
              <FormItem>
                <FormLabel className="font-black text-[10px] uppercase opacity-60">Quantité ({product.unit}s)</FormLabel>
                <FormControl><Input type="number" className="h-12 rounded-xl bg-muted/50 border-none font-black text-xl" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="deliveryAddress" render={({ field }) => (
              <FormItem>
                <FormLabel className="font-black text-[10px] uppercase opacity-60">Lieu de livraison</FormLabel>
                <FormControl>
                  <Textarea placeholder="Quartier, Avenue, N°..." className="rounded-xl bg-muted/50 border-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="p-6 bg-primary/5 rounded-3xl border-2 border-primary/10 flex justify-between items-center">
              <span className="font-black text-[10px] uppercase text-primary">Total estimé</span>
              <span className="text-2xl font-black text-brand-orange">{formatCurrency(total)}</span>
            </div>
            <Button type="submit" className="w-full h-14 bg-primary text-white font-black rounded-2xl shadow-xl" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="animate-spin" /> : "CONFIRMER L'ACHAT"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ContactDialog({ product }: any) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-16 border-brand-orange text-brand-orange font-black text-lg gap-2 rounded-2xl hover:bg-brand-orange/5">
          <MessageCircle size={22} /> NÉGOCIER
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[2.5rem] p-8">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-black text-brand-orange uppercase">Contacter le paysan</DialogTitle>
          <DialogDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">Échange direct pour discuter des prix</DialogDescription>
        </DialogHeader>
        <div className="py-6 text-center space-y-4">
           <div className="w-20 h-20 bg-brand-orange/10 text-brand-orange rounded-full flex items-center justify-center mx-auto shadow-inner"><Phone size={32}/></div>
           <p className="font-medium text-muted-foreground italic">Le SI favorise le contact direct pour plus de transparence.</p>
           <div className="p-4 bg-muted/30 rounded-2xl border">
              <p className="text-[10px] font-black uppercase opacity-50 mb-1">Coordonnées du producteur</p>
              <p className="text-xl font-black">{product.farmer?.phone || "Non spécifié"}</p>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}