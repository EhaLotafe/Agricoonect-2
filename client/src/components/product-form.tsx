import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { insertProductSchema, type Product } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { useIsOnline } from "@/hooks/use-online";
import { CalendarIcon, Loader2, UploadCloud, WifiOff, CheckCircle2, Tag, MapPin, PlusCircle, X } from "lucide-react";
import { z } from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Schéma étendu pour le support de la saisie manuelle et de la traçabilité
const productFormSchema = insertProductSchema.omit({ farmerId: true }).extend({
  harvestDate: z.string().min(1, "La date de récolte est requise"),
  commune: z.string().min(1, "Veuillez sélectionner une commune"),
  customCommune: z.string().optional(),
  customCategory: z.string().optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

export default function ProductForm({ product, onSuccess }: { product?: Product; onSuccess?: () => void }) {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const isOnline = useIsOnline();
  const [isUploading, setIsUploading] = useState(false);

  const { data: categories = [] } = useQuery<string[]>({ queryKey: ['/api/categories'] });
  const { data: communes = [] } = useQuery<string[]>({ queryKey: ['/api/communes'] });

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      category: product?.category || '',
      price: product?.price || "0",
      unit: product?.unit || 'kg',
      quantity: product?.quantity || 1,
      availableQuantity: product?.availableQuantity || 1,
      location: product?.location || '',
      commune: product?.commune || '',
      province: product?.province || 'Haut-Katanga',
      harvestDate: product?.harvestDate ? format(new Date(product.harvestDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      images: product?.images || [],
    },
  });

  const selectedCommune = form.watch('commune');
  const selectedCategory = form.watch('category');
  const uploadedImages = form.watch('images') || [];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !token) return;

    setIsUploading(true);
    const formData = new FormData();
    Array.from(files).forEach(file => formData.append("images", file));

    try {
      const res = await fetch("/api/uploads", { 
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        form.setValue("images", [...uploadedImages, ...data.urls]);
        toast({ title: "Image chargée", description: "La photo a été ajoutée à l'annonce." });
      }
    } catch (err) {
      toast({ title: "Erreur", description: "Échec de l'envoi de l'image.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const mutation = useMutation({
    mutationFn: async (values: ProductFormData) => {
      // 🛠️ NETTOYAGE DES DONNÉES (Argument : Intégrité du SI)
      const finalData = {
        ...values,
        farmerId: Number(user?.id),
        commune: values.commune === "Autre" ? values.customCommune : values.commune,
        category: values.category === "Autre" ? values.customCategory : values.category,
        availableQuantity: Number(values.quantity),
        price: String(values.price),
      };

      if (!isOnline) {
        const queue = JSON.parse(localStorage.getItem("agri_offline_sync") || "[]");
        queue.push({ ...finalData, id: Date.now(), isOffline: true });
        localStorage.setItem("agri_offline_sync", JSON.stringify(queue));
        throw new Error("OFFLINE");
      }

      const res = await apiRequest(
        product ? 'PATCH' : 'POST', 
        product ? `/api/products/${product.id}` : '/api/products', 
        finalData
      );
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Félicitations !", description: "Votre produit est enregistré et publié." });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ["/api/farmer/products", user?.id] });
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => {
      if (err.message === "OFFLINE") {
        toast({ title: "Mode Hors-ligne", description: "Sauvegardé localement. Envoi auto dès que le réseau revient." });
        if (onSuccess) onSuccess();
      } else {
        toast({ title: "Erreur", description: err.message, variant: "destructive" });
      }
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!isOnline && (
        <Badge variant="destructive" className="w-full justify-center py-3 rounded-2xl animate-pulse gap-2 font-black border-none shadow-lg">
          <WifiOff size={18} /> MODE DÉCONNECTÉ ACTIVÉ
        </Badge>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(data => mutation.mutate(data))} className="space-y-8">
          
          {/* SECTION : NOM ET CATÉGORIE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="p-name" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Désignation du produit</FormLabel>
                <FormControl><Input id="p-name" placeholder="ex: Sac de braise" className="h-12 rounded-2xl bg-muted/40 border-none shadow-inner focus:ring-primary" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="p-cat" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Catégorie</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger id="p-cat" className="h-12 rounded-2xl bg-muted/40 border-none shadow-inner transition-all hover:bg-muted/60">
                      <div className="flex items-center gap-2"><Tag size={14} className="text-primary" /><SelectValue placeholder="Choisir..." /></div>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-2xl border-none shadow-2xl bg-popover/95 backdrop-blur-md">
                    {categories.map(c => <SelectItem key={c} value={c} className="rounded-lg">{c}</SelectItem>)}
                    <SelectItem value="Autre" className="font-black text-primary italic rounded-lg">+ AUTRE CATÉGORIE</SelectItem>
                  </SelectContent>
                </Select>
                {selectedCategory === "Autre" && (
                  <FormField control={form.control} name="customCategory" render={({ field }) => (
                    <Input {...field} id="p-custom-cat" placeholder="Précisez la catégorie..." className="mt-2 h-11 bg-primary/5 border-primary/20 rounded-xl animate-in slide-in-from-top-2" />
                  )} />
                )}
              </FormItem>
            )} />
          </div>

          {/* SECTION : PRIX ET STOCK (GLASS DESIGN) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 rounded-[2rem] bg-muted/30 dark:bg-slate-900/50 backdrop-blur-sm border border-border/50 shadow-2xl">
            <FormField control={form.control} name="price" render={({ field }) => (
              <FormItem><FormLabel htmlFor="p-price" className="text-[10px] font-black uppercase opacity-50 ml-1">Prix (CDF)</FormLabel>
              <Input id="p-price" type="number" {...field} value={field.value || ""} onChange={e => field.onChange(e.target.value)} className="h-11 bg-background/50 rounded-xl font-bold border-none" /></FormItem>
            )} />
            <FormField control={form.control} name="unit" render={({ field }) => (
              <FormItem><FormLabel htmlFor="p-unit" className="text-[10px] font-black uppercase opacity-50 ml-1">Unité</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="p-unit" className="h-11 bg-background/50 rounded-xl font-bold border-none"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl border-none bg-popover/95 backdrop-blur-md">{['kg', 'sac', 'seau', 'botte', 'tas', 'pièce'].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select></FormItem>
            )} />
            <FormField control={form.control} name="quantity" render={({ field }) => (
              <FormItem><FormLabel htmlFor="p-qty" className="text-[10px] font-black uppercase opacity-50 ml-1">Quantité</FormLabel>
              <Input id="p-qty" type="number" {...field} value={field.value || 0} onChange={e => field.onChange(Number(e.target.value))} className="h-11 bg-background/50 rounded-xl font-bold border-none" /></FormItem>
            )} />
          </div>

          {/* PHOTOS DU PRODUIT */}
          <div className="space-y-4">
            <FormLabel className="font-black text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Photos de la récolte (Preuve de qualité)</FormLabel>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
              {uploadedImages.map((url, index) => (
                <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border bg-muted group shadow-md">
                  <img src={url} className="w-full h-full object-cover" alt="Aperçu" />
                  <button type="button" onClick={() => form.setValue("images", uploadedImages.filter((_, i) => i !== index))} className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                </div>
              ))}
              <label className="flex flex-col items-center justify-center aspect-square rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary bg-primary/5 cursor-pointer transition-all hover:bg-primary/10">
                {isUploading ? <Loader2 className="animate-spin text-primary" /> : <PlusCircle className="text-primary" size={24} />}
                <span className="text-[9px] font-black mt-1 text-primary tracking-widest uppercase">AJOUTER</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} id="p-images" />
              </label>
            </div>
          </div>

          {/* DESCRIPTION */}
          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="p-desc" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground ml-1">
                Détails sur la culture (Argument Qualité)
              </FormLabel>
              <FormControl>
                <Textarea 
                  id="p-desc" 
                  placeholder="ex: Récolté à la main sans engrais chimiques..." 
                  className="h-28 rounded-2xl bg-muted/40 border-none shadow-inner p-4" 
                  {...field} 
                  value={field.value ?? ""} // ✅ FIX: Remplace null par une chaîne vide
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* TRAÇABILITÉ : DATE DE RÉCOLTE */}
          <FormField control={form.control} name="harvestDate" render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel htmlFor="p-date" className="flex items-center gap-2 text-brand-orange font-black text-[10px] uppercase tracking-widest ml-1">
                <CalendarIcon size={16} /> Date de récolte (Indicateur de fraîcheur)
              </FormLabel>
              <FormControl><Input id="p-date" type="date" {...field} className="h-12 rounded-2xl bg-muted/40 border-none shadow-inner" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* LOCALISATION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="commune" render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="p-com" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Commune rurale</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger id="p-com" className="h-12 rounded-2xl bg-muted/40 border-none shadow-inner"><div className="flex items-center gap-2"><MapPin size={14} className="text-primary" /><SelectValue placeholder="Zone..." /></div></SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-2xl border-none shadow-2xl bg-popover/95 backdrop-blur-md">
                    {communes.map(c => <SelectItem key={c} value={c} className="rounded-lg">{c}</SelectItem>)}
                    <SelectItem value="Autre" className="font-black text-primary italic rounded-lg">+ AUTRE ZONE</SelectItem>
                  </SelectContent>
                </Select>
                {selectedCommune === "Autre" && (
                  <FormField control={form.control} name="customCommune" render={({ field }) => (
                    <Input {...field} id="p-custom-com" placeholder="Nom de votre village..." className="mt-2 h-11 bg-primary/5 border-primary/20 rounded-xl animate-in slide-in-from-top-2" />
                  )} />
                )}
              </FormItem>
            )} />
            
            <FormField control={form.control} name="location" render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="p-loc" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Localisation précise</FormLabel>
                <FormControl><Input id="p-loc" placeholder="ex: Ferme Futuka" className="h-12 rounded-2xl bg-muted/40 border-none shadow-inner" {...field} /></FormControl>
              </FormItem>
            )} />
          </div>

          {/* BOUTON DYNAMIQUE */}
          <Button 
            type="submit" 
            className={cn(
              "w-full h-16 font-black text-lg shadow-2xl transition-all active:scale-[0.97] rounded-[1.5rem] uppercase tracking-widest",
              isOnline ? "bg-primary text-white" : "bg-brand-orange text-white"
            )}
            disabled={mutation.isPending || isUploading}
          >
            {mutation.isPending ? <Loader2 className="animate-spin" size={24} /> : (isOnline ? <span className="flex items-center gap-2">PUBLIER MAINTENANT <CheckCircle2 size={24}/></span> : "SAUVEGARDER (MODE OFFLINE)")}
          </Button>
        </form>
      </Form>
    </div>
  );
}