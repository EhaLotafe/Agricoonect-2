import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Star, MapPin, Phone, User, Package, MessageCircle, ShoppingCart, Clock, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
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
  deliveryAddress: z.string().min(5, "L'adresse est requise"),
  notes: z.string().optional(),
});

const contactSchema = z.object({
  message: z.string().min(5, "Message trop court"),
  buyerPhone: z.string().min(9, "Téléphone requis"),
});

export default function ProductDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);

  // --- REQUÊTES ---
  const { data: product, isLoading } = useQuery<ProductWithFarmer>({
    queryKey: [`/api/products/${id}`],
    queryFn: async () => (await apiRequest('GET', `/api/products/${id}`)).json(),
    enabled: !!id,
  });

  const { data: reviews = [] } = useQuery<ReviewWithUser[]>({
    queryKey: [`/api/products/${id}/reviews`],
    queryFn: async () => (await apiRequest('GET', `/api/products/${id}/reviews`)).json(),
    enabled: !!id,
  });

  // --- MUTATIONS ---
  const orderMutation = useMutation({
    mutationFn: async (data: z.infer<typeof orderSchema>) => {
      const orderData = {
        productId: Number(id),
        farmerId: product?.farmerId,
        quantity: data.quantity,
        totalPrice: (parseFloat(product!.price) * data.quantity).toString(),
        deliveryAddress: data.deliveryAddress,
        notes: data.notes,
      };
      return await apiRequest('POST', '/api/orders', orderData);
    },
    onSuccess: () => {
      toast({ title: "Commande envoyée", description: "Le producteur a été notifié." });
      setShowOrderDialog(false);
      queryClient.invalidateQueries({ queryKey: [`/api/products/${id}`] });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" })
  });

  const contactMutation = useMutation({
    mutationFn: async (data: z.infer<typeof contactSchema>) => {
      const contactData = { productId: Number(id), farmerId: product?.farmerId, message: data.message, buyerPhone: data.buyerPhone };
      return await apiRequest('POST', '/api/contacts', contactData);
    },
    onSuccess: () => {
      toast({ title: "Message envoyé", description: "Le producteur vous contactera bientôt." });
      setShowContactDialog(false);
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" })
  });

  if (isLoading) return <div className="flex justify-center py-40"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  if (!product) return <div className="text-center py-20">Produit introuvable.</div>;

  const freshness = getFreshnessStatus(product.harvestDate);

  return (
    <div className="container mx-auto px-4 py-8 space-y-12 animate-in fade-in duration-500">
      
      <Button variant="ghost" onClick={() => window.history.back()} className="gap-2 text-muted-foreground hover:text-primary">
        <ArrowLeft size={16} /> Revenir au catalogue
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* IMAGE ET BADGES DE TRAÇABILITÉ */}
        <div className="space-y-6">
          <div className="overflow-hidden rounded-[2rem] h-[450px] shadow-2xl bg-muted border-4 border-white dark:border-slate-800">
            {product.images?.[0] ? (
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground italic">Aucune photo disponible</div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Badge className={cn("px-5 py-2 border-none shadow-md text-sm font-bold", getCommuneColor(product.commune))}>
              📍 Lubumbashi / {product.commune}
            </Badge>
            <Badge variant="outline" className={cn("px-5 py-2 text-sm gap-2 bg-card shadow-sm", freshness.color)}>
              <Clock size={16} className={cn(freshness.label.includes('aujourd') && "animate-pulse")} /> 
              {freshness.label}
            </Badge>
          </div>
        </div>

        {/* CONTENU ET PRIX */}
        <div className="space-y-8">
          <div className="space-y-2">
            <Badge variant="secondary" className="uppercase text-[10px] font-black tracking-[0.2em]">{product.category}</Badge>
            <h1 className="text-5xl font-black text-foreground tracking-tighter leading-none">{product.name}</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-2 font-medium">
              <MapPin size={18} className="text-primary" /> {product.location}, RDC
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-border flex items-center justify-between shadow-inner">
            <div>
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Prix Producteur</p>
              <h2 className="text-4xl font-black text-brand-orange">{formatCurrency(product.price)} <span className="text-sm font-normal text-muted-foreground">/ {product.unit}</span></h2>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Disponibilité</p>
              <h3 className="text-2xl font-bold text-primary">{product.availableQuantity} {product.unit}</h3>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-black text-lg border-l-4 border-primary pl-4 uppercase tracking-tight">Description</h4>
            <p className="text-muted-foreground leading-relaxed text-lg italic">"{product.description || "Le producteur n'a pas encore ajouté de description détaillée pour cette récolte."}"</p>
          </div>

          {/* ACTIONS TRANSACTIONNELLES (RBAC) */}
          <div className="pt-8 border-t space-y-4">
            {isAuthenticated ? (
              user?.userType === 'buyer' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <OrderDialog product={product} mutation={orderMutation} />
                  <ContactDialog product={product} mutation={contactMutation} />
                </div>
              ) : (
                <div className="p-4 bg-muted rounded-xl text-center text-sm font-bold text-muted-foreground">
                   Connecté en tant que {user?.userType}. Seuls les clients peuvent commander.
                </div>
              )
            ) : (
              <Button className="w-full h-16 bg-slate-900 text-white font-black text-lg rounded-2xl" onClick={() => setLocation('/login')}>
                SE CONNECTER POUR COMMANDER
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* SECTION REPUTATION / AVIS CLIENTS (Essentiel pour le mémoire) */}
      <section className="pt-16 border-t space-y-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-yellow-400/10 rounded-2xl text-yellow-500"><Star size={32} fill="currentColor" /></div>
          <div>
            <h3 className="text-3xl font-black tracking-tight">Avis de la communauté</h3>
            <p className="text-muted-foreground">Basé sur {reviews.length} transactions vérifiées.</p>
          </div>
        </div>

        {reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map(rev => (
              <Card key={rev.id} className="border-none shadow-lg bg-card rounded-3xl overflow-hidden">
                <CardContent className="p-8 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">{rev.buyer.firstName[0]}</div>
                      <p className="font-bold">{rev.buyer.firstName} {rev.buyer.lastName}</p>
                    </div>
                    <span className="text-[10px] font-black text-muted-foreground uppercase bg-muted px-2 py-1 rounded">{format(new Date(rev.createdAt), 'dd MMM yyyy', { locale: fr })}</span>
                  </div>
                  <div className="flex text-yellow-400">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill={i < rev.rating ? "currentColor" : "none"} className={cn(i >= rev.rating && "text-muted-foreground")} />)}
                  </div>
                  <p className="text-foreground italic leading-relaxed text-sm">"{rev.comment}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-muted/20 border-dashed border-2 py-16 rounded-[2rem]">
            <CardContent className="text-center text-muted-foreground italic">Aucun avis n'a encore été publié pour ce produit.</CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

// --- SOUS-COMPOSANTS DES MODALES ---

function OrderDialog({ product, mutation }: any) {
  const form = useForm({
    resolver: zodResolver(orderSchema),
    defaultValues: { quantity: 1, deliveryAddress: '', notes: '' }
  });

  const currentQty = form.watch('quantity') || 0;
  const totalPrice = parseFloat(product.price) * currentQty;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="h-16 bg-primary text-white font-black text-lg gap-2 shadow-xl rounded-2xl hover:scale-[1.02] transition-transform">
          <ShoppingCart size={22} /> COMMANDER
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Finaliser l'achat</DialogTitle>
          <DialogDescription>Achat direct auprès de {product.farmer?.firstName} {product.farmer?.lastName}.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(data => mutation.mutate(data))} className="space-y-6 pt-4">
            <FormField control={form.control} name="quantity" render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">Quantité ({product.unit})</FormLabel>
                <Input type="number" min={1} max={product.availableQuantity} className="h-12" {...field} onChange={e => field.onChange(Number(e.target.value))} />
              </FormItem>
            )} />
            <FormField control={form.control} name="deliveryAddress" render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">Adresse à Lubumbashi</FormLabel>
                <Textarea placeholder="Commune, Quartier, N°..." {...field} />
              </FormItem>
            )} />
            <div className="p-4 bg-primary/5 rounded-2xl border-2 border-primary/10 flex justify-between items-center">
              <span className="font-bold text-sm">Total à payer :</span>
              <span className="text-2xl font-black text-brand-orange">{formatCurrency(totalPrice)}</span>
            </div>
            <Button type="submit" className="w-full h-14 bg-primary text-lg font-black" disabled={mutation.isPending}>
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
      <DialogContent className="sm:max-w-md rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-brand-orange">Contacter le vendeur</DialogTitle>
          <DialogDescription>Posez une question ou négociez pour le produit : {product.name}.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(data => mutation.mutate(data))} className="space-y-6 pt-4">
            <FormField control={form.control} name="message" render={({ field }) => (
              <FormItem><FormLabel className="font-bold">Votre message</FormLabel><Textarea placeholder="ex: Je souhaite prendre 10 sacs, quel est votre dernier prix ?" {...field} /></FormItem>
            )} />
            <FormField control={form.control} name="buyerPhone" render={({ field }) => (
              <FormItem><FormLabel className="font-bold">Votre téléphone (Contact direct)</FormLabel><Input placeholder="+243..." {...field} /></FormItem>
            )} />
            <Button type="submit" className="w-full h-14 bg-brand-orange text-white text-lg font-black" disabled={mutation.isPending}>ENVOYER LE MESSAGE</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}