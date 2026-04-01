// client/src/components/product-form.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { CalendarIcon, Loader2, PlusCircle, X, WifiOff, CheckCircle2, Tag, MapPin } from "lucide-react";
import { z } from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Extension du schéma pour la gestion dynamique des zones rurales
const productFormSchema = insertProductSchema.omit({ farmerId: true }).extend({
  harvestDate: z.string().min(1, "Requis"),
  commune: z.string().min(1, "Sélectionnez une zone"),
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

  /**
   * Gestionnaire d'upload d'images avec authentification JWT
   */
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
        toast({ title: "Image ajoutée" });
      }
    } catch (err) {
      toast({ title: "Erreur upload", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Mutation avec logique de file d'attente Offline-First
   */
  const mutation = useMutation({
    mutationFn: async (values: ProductFormData) => {
      const finalData = {
        ...values,
        farmerId: Number(user?.id),
        commune: values.commune === "Autre" ? values.customCommune : values.commune,
        category: values.category === "Autre" ? values.customCategory : values.category,
        availableQuantity: Number(values.quantity),
        price: String(values.price),
      };

      if (!isOnline) {
        // Sauvegarde locale si le réseau est absent (Résilience technique)
        const queue = JSON.parse(localStorage.getItem("agri_offline_sync") || "[]");
        queue.push({ ...finalData, id: Date.now(), isOffline: true });
        localStorage.setItem("agri_offline_sync", JSON.stringify(queue));
        throw new Error("OFFLINE_SAVED");
      }

      const res = await apiRequest(
        product ? 'PATCH' : 'POST', 
        product ? `/api/products/${product.id}` : '/api/products', 
        finalData
      );
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Succès", description: "Produit publié sur le marché." });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => {
      if (err.message === "OFFLINE_SAVED") {
        toast({ title: "Mode Hors-ligne", description: "Annonce sauvegardée localement." });
        if (onSuccess) onSuccess();
      } else {
        toast({ title: "Erreur", description: err.message, variant: "destructive" });
      }
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {!isOnline && (
        <Badge variant="destructive" className="w-full justify-center py-2 rounded-xl animate-pulse gap-2 font-bold border-none shadow-md">
          <WifiOff size={16} /> CONNEXION INTERROMPUE - MODE LOCAL
        </Badge>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(data => mutation.mutate(data))} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] uppercase font-black opacity-60">Désignation</FormLabel>
                <FormControl><Input placeholder="ex: Maïs Blanc" className="rounded-xl bg-muted/50 border-none" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] uppercase font-black opacity-60">Catégorie</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl bg-muted/50 border-none">
                      <div className="flex items-center gap-2"><Tag size={14}/><SelectValue placeholder="Choisir..." /></div>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    <SelectItem value="Autre" className="font-bold text-primary italic">+ AUTRE</SelectItem>
                  </SelectContent>
                </Select>
                {selectedCategory === "Autre" && (
                  <Input {...form.register("customCategory")} placeholder="Précisez..." className="mt-2 rounded-xl" />
                )}
              </FormItem>
            )} />
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-muted/30 border border-border/50">
            <FormField control={form.control} name="price" render={({ field }) => (
              <FormItem><FormLabel className="text-[10px] font-black uppercase opacity-40">Prix (FC)</FormLabel>
              <Input type="number" {...field} className="rounded-lg border-none bg-background/50 font-bold" /></FormItem>
            )} />
            <FormField control={form.control} name="unit" render={({ field }) => (
              <FormItem><FormLabel className="text-[10px] font-black uppercase opacity-40">Unité</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="rounded-lg border-none bg-background/50 font-bold"><SelectValue /></SelectTrigger>
                <SelectContent>{['kg', 'sac', 'seau', 'botte', 'tas'].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select></FormItem>
            )} />
            <FormField control={form.control} name="quantity" render={({ field }) => (
              <FormItem><FormLabel className="text-[10px] font-black uppercase opacity-40">Quantité</FormLabel>
              <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} className="rounded-lg border-none bg-background/50 font-bold" /></FormItem>
            )} />
          </div>

          <div className="space-y-3">
            <FormLabel className="text-[10px] uppercase font-black opacity-60">Photos du produit (Preuve Qualité)</FormLabel>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {uploadedImages.map((url, index) => (
                <div key={index} className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border">
                  <img src={url} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => form.setValue("images", uploadedImages.filter((_, i) => i !== index))} className="absolute top-0 right-0 bg-destructive text-white p-1"><X size={10}/></button>
                </div>
              ))}
              <label className="flex flex-col items-center justify-center w-20 h-20 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors">
                {isUploading ? <Loader2 className="animate-spin text-primary" size={16}/> : <PlusCircle className="text-primary" size={20}/>}
                <input type="file" multiple className="hidden" onChange={handleImageUpload} disabled={isUploading} />
              </label>
            </div>
          </div>

          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] uppercase font-black opacity-60">Détails de culture</FormLabel>
              <FormControl><Textarea placeholder="Pratiques culturales..." className="rounded-xl bg-muted/50 border-none min-h-[80px]" {...field} value={field.value ?? ""} /></FormControl>
            </FormItem>
          )} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="harvestDate" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-[10px] uppercase font-black opacity-60"><CalendarIcon size={12}/> Date de récolte</FormLabel>
                <FormControl><Input type="date" {...field} className="rounded-xl bg-muted/50 border-none" /></FormControl>
              </FormItem>
            )} />
            
            <FormField control={form.control} name="commune" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] uppercase font-black opacity-60">Commune rurale</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="rounded-xl bg-muted/50 border-none"><div className="flex items-center gap-2"><MapPin size={14}/><SelectValue placeholder="Zone..." /></div></SelectTrigger></FormControl>
                  <SelectContent>
                    {communes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    <SelectItem value="Autre" className="italic font-bold">+ AUTRE ZONE</SelectItem>
                  </SelectContent>
                </Select>
                {selectedCommune === "Autre" && <Input {...form.register("customCommune")} placeholder="Village..." className="mt-2 rounded-xl" />}
              </FormItem>
            )} />
          </div>

          <Button 
            type="submit" 
            className={cn("w-full h-14 font-black rounded-2xl shadow-xl uppercase tracking-widest", isOnline ? "bg-primary" : "bg-orange-600")}
            disabled={mutation.isPending || isUploading}
          >
            {mutation.isPending ? <Loader2 className="animate-spin" /> : (isOnline ? "Publier l'annonce" : "Sauvegarder en local")}
          </Button>
        </form>
      </Form>
    </div>
  );
}