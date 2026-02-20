import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

// --- SCHÉMAS DE VALIDATION ---
const orderSchema = z.object({
  quantity: z.number().min(1, "Minimum 1"),
  deliveryAddress: z.string().min(5, "L'adresse de livraison est requise"),
});

const contactSchema = z.object({
  message: z.string().min(5, "Le message doit faire au moins 5 caractères"),
  buyerPhone: z.string().min(9, "Un numéro de téléphone valide est requis"),
});

export default function ProductDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);

  // --- REQUÊTES DE DONNÉES ---
  const { data: product, isLoading, isError, isFetching } = useQuery<ProductWithFarmer>({
    queryKey: [`/api/products/${id}`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/products/${id}`);
      return res.json();
    },
    enabled: !!id,
    staleTime: 0, 
  });

  const { data: reviews = [] } = useQuery<ReviewWithUser[]>({
    queryKey: [`/api/products/${id}/reviews`],
    queryFn: async () => (await apiRequest('GET', `/api/products/${id}/reviews`)).json(),
    enabled: !!id,
  });

  // --- MUTATIONS ---
  const orderMutation = useMutation({
    mutationFn: async (data: z.infer<typeof orderSchema>) => {
      return await apiRequest('POST', '/api/orders', {
        productId: Number(id),
        farmerId: product?.farmerId,
        quantity: data.quantity,
        totalPrice: (parseFloat(product!.price) * data.quantity).toString(),
        deliveryAddress: data.deliveryAddress,
      });
    },
    onSuccess: () => {
      toast({ title: "Commande passée", description: "Le producteur a été notifié de votre achat." });
      setShowOrderDialog(false);
      queryClient.invalidateQueries({ queryKey: [`/api/products/${id}`] });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" })
  });

  const contactMutation = useMutation({
    mutationFn: async (data: z.infer<typeof contactSchema>) => {
      return await apiRequest('POST', '/api/contacts', {
        productId: Number(id),
        farmerId: product?.farmerId,
        message: data.message,
        buyerPhone: data.buyerPhone 
      });
    },
    onSuccess: () => {
      toast({ title: "Message envoyé", description: "Le producteur vous contactera bientôt." });
      setShowContactDialog(false);
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" })
  });

  // --- GESTION ÉTATS ---
  if (isLoading || (isFetching && !product)) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4 bg-background">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-xs font-bold animate-pulse uppercase tracking-widest text-muted-foreground">Analyse des données...</p>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center space-y-6 animate-in fade-in">
        <div className="bg-destructive/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-destructive"><Package size={40} /></div>
        <h2 className="text-2xl font-black uppercase tracking-tighter">Produit introuvable</h2>
        <p className="text-muted-foreground">Cette annonce n'existe plus ou a été retirée du marché.</p>
        <Button onClick={() => setLocation("/products")} variant="outline" className="rounded-xl font-bold">RETOUR AU CATALOGUE</Button>
      </div>
    );
  }

  const freshness = getFreshnessStatus(product.harvestDate);

  return (
    <div className="container mx-auto px-4 py-8 space-y-12 animate-in fade-in duration-500 transition-colors duration-300">
      
      <Button variant="ghost" onClick={() => window.history.back()} className="gap-2 text-muted-foreground font-bold hover:text-primary transition-colors">
        <ArrowLeft size={16} /> Revenir au catalogue
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* IMAGE ET TRAÇABILITÉ */}
        <div className="space-y-6">
          <Card className="overflow-hidden border-none shadow-2xl rounded-[2.5rem] h-[500px] bg-muted relative group">
            {product.images?.[0] ? (
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground italic gap-2 font-medium">
                <Package size={48} className="opacity-20" />
                <span>Aucune photo disponible</span>
              </div>
            )}
            <div className="absolute bottom-6 left-6 flex flex-wrap gap-2">
               <Badge className={cn("px-4 py-2 border-none shadow-lg text-sm font-bold", getCommuneColor(product.commune))}>📍 {product.commune}</Badge>
               <Badge variant="outline" className={cn("px-4 py-2 text-sm gap-2 bg-white/90 dark:bg-black/90 shadow-lg border-none font-bold", freshness.color)}>
                 <Clock size={16} className={cn(freshness.label.includes('aujourd') && "animate-pulse")} /> {freshness.label}
               </Badge>
            </div>
          </Card>
        </div>

        {/* CONTENU */}
        <div className="space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="uppercase text-[10px] font-black tracking-[0.2em]">{product.category}</Badge>
              {product.isApproved && <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold uppercase gap-1"><ShieldCheck size={12}/> Produit Vérifié</Badge>}
            </div>
            <h1 className="text-5xl font-black text-foreground tracking-tighter leading-tight">{product.name}</h1>
            <p className="flex items-center gap-2 text-muted-foreground font-medium italic"><MapPin size={18} className="text-primary" /> {product.location}, Lubumbashi</p>
          </div>

          <div className="bg-card p-8 rounded-[2rem] border border-border flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-black text-muted-foreground uppercase mb-1 tracking-widest">Prix de vente</p>
              <h2 className="text-4xl font-black text-brand-orange">{formatCurrency(product.price)} <span className="text-sm font-normal text-muted-foreground">/ {product.unit}</span></h2>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-muted-foreground uppercase mb-1 tracking-widest">Stock Disponible</p>
              <h3 className="text-2xl font-bold text-primary">{product.availableQuantity} {product.unit}</h3>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-black text-lg border-l-4 border-primary pl-4 uppercase tracking-tighter text-foreground">Description détaillée</h4>
            <p className="text-muted-foreground leading-relaxed text-lg italic">"{product.description || "Le producteur n'a pas encore ajouté de précisions sur cette récolte."}"</p>
          </div>

          {/* ACTIONS (RBAC) */}
          <div className="pt-8 border-t space-y-4">
            {isAuthenticated ? (
              user?.userType === 'buyer' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <OrderDialog product={product} mutation={orderMutation} />
                  <ContactDialog product={product} mutation={contactMutation} />
                </div>
              ) : <Badge variant="outline" className="w-full py-4 justify-center font-bold text-muted-foreground border-dashed">Connecté en mode {user?.userType}</Badge>
            ) : (
              <Button className="w-full h-16 bg-slate-900 text-white font-black text-lg rounded-2xl shadow-xl hover:bg-slate-800" onClick={() => setLocation('/login')}>
                SE CONNECTER POUR COMMANDER
              </Button>
            )}
          </div>

          {/* INFOS PRODUCTEUR */}
          <Card className="border-border bg-muted/20 rounded-3xl overflow-hidden shadow-sm">
            <CardContent className="p-6 flex items-center gap-5">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><User size={28}/></div>
              <div>
                <p className="text-[10px] font-black uppercase text-primary tracking-widest">Vendeur Responsable</p>
                <p className="font-black text-xl text-foreground">{product.farmer?.firstName} {product.farmer?.lastName}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 font-medium"><Phone size={14}/> {product.farmer?.phone || "Non communiqué"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AVIS CLIENTS */}
      <section className="pt-16 border-t space-y-10">
        <h3 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <Star className="text-yellow-400 fill-yellow-400" size={32} /> Retours de la communauté
        </h3>
        {reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map(rev => (
              <Card key={rev.id} className="border-border shadow-md bg-card rounded-[2rem] overflow-hidden">
                <CardContent className="p-8 space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-foreground">{rev.buyer.firstName} {rev.buyer.lastName}</p>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase bg-muted px-2 py-1 rounded-lg">{format(new Date(rev.createdAt), 'dd MMM yyyy', { locale: fr })}</span>
                  </div>
                  <div className="flex text-yellow-400">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={16} fill={i < rev.rating ? "currentColor" : "none"} className={cn(i >= rev.rating && "text-muted-foreground/30")} />)}
                  </div>
                  <p className="text-muted-foreground italic text-sm leading-relaxed">"{rev.comment}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-muted/10 rounded-3xl border-2 border-dashed">
            <p className="text-muted-foreground italic font-medium text-sm tracking-wide">Aucun avis publié pour le moment sur ce produit.</p>
          </div>
        )}
      </section>
    </div>
  );
}

// --- SOUS-COMPOSANTS DES MODALES (DIALOGS) ---

function OrderDialog({ product, mutation }: any) {
  const form = useForm({
    resolver: zodResolver(orderSchema),
    defaultValues: { quantity: 1, deliveryAddress: '' }
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="h-16 bg-primary text-white font-black text-lg gap-2 shadow-xl rounded-2xl hover:scale-105 transition-transform" disabled={product.availableQuantity <= 0}>
          <ShoppingCart size={22} /> COMMANDER
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-[2rem] bg-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight text-foreground">Finaliser l'achat</DialogTitle>
          <DialogDescription className="font-medium text-muted-foreground italic">Achat direct auprès de {product.farmer?.firstName}.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(data => mutation.mutate(data))} className="space-y-6 pt-4">
            <FormField control={form.control} name="quantity" render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold text-foreground">Quantité souhaitée ({product.unit})</FormLabel>
                <FormControl><Input type="number" min={1} max={product.availableQuantity} className="h-12 rounded-xl bg-muted/20 border-none" {...field} value={field.value || ""} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="deliveryAddress" render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold text-foreground">Lieu de livraison à Lubumbashi</FormLabel>
                <FormControl><Textarea placeholder="Quartier, Avenue, N°, Commune..." className="rounded-xl bg-muted/20 border-none min-h-[100px]" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="p-5 bg-primary/5 rounded-2xl border-2 border-primary/10 flex justify-between items-center">
              <span className="font-bold text-sm text-muted-foreground uppercase tracking-widest">Total :</span>
              <span className="text-2xl font-black text-brand-orange">{formatCurrency(parseFloat(product.price) * (form.watch('quantity') || 1))}</span>
            </div>
            <Button type="submit" className="w-full h-14 bg-primary text-white font-black text-lg rounded-xl shadow-lg" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="animate-spin" /> : "CONFIRMER L'ACHAT"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ContactDialog({ product, mutation }: any) {
  const form = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: { message: '', buyerPhone: '' }
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-16 border-brand-orange text-brand-orange font-black text-lg gap-2 rounded-2xl hover:bg-brand-orange/5">
          <MessageCircle size={22} /> NÉGOCIER
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-[2rem] bg-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-brand-orange tracking-tight uppercase">Négociation directe</DialogTitle>
          <DialogDescription className="font-medium text-muted-foreground italic">Posez vos questions sur la récolte ou négociez les tarifs.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(data => mutation.mutate(data))} className="space-y-6 pt-4">
            <FormField control={form.control} name="message" render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold text-foreground">Votre message au producteur</FormLabel>
                <FormControl><Textarea placeholder="ex: Quel est votre dernier prix pour un gros volume ?" className="h-32 rounded-xl bg-muted/20 border-none" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="buyerPhone" render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold text-foreground">Votre Téléphone (Contact direct)</FormLabel>
                <FormControl><Input placeholder="+243..." className="h-12 rounded-xl bg-muted/20 border-none" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" className="w-full h-14 bg-brand-orange text-white text-lg font-black rounded-xl shadow-lg gap-2" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="animate-spin" /> : <><Send size={18}/> ENVOYER AU PRODUCTEUR</>}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}