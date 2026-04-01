// client/src/components/survey-form.tsx
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSurveySchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, CheckCircle2, ChevronRight, ChevronLeft, CalendarDays, Truck, BarChart3, CloudRain, Sun, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

export default function SurveyForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);

  // 🕒 1. LOGIQUE DE RÉCURRENCE (7 JOURS)
  const lastDate = localStorage.getItem("agri_survey_timestamp");
  const isExpired = !lastDate || (Date.now() - parseInt(lastDate) > 7 * 24 * 60 * 60 * 1000);
  
  // Si expiré ou 1ère fois -> 5 questions (Analyse profonde)
  // Si fait récemment -> 3 questions (Mise à jour rapide)
  const totalSteps = isExpired ? 5 : 3;

  // 🌿 2. LOGIQUE SAISONNIÈRE DU HAUT-KATANGA
  const getSeasonalContext = () => {
    const month = new Date().getMonth(); 
    const isRainySeason = (month >= 10 || month <= 3); // Nov à Avril
    
    return {
      isRainy: isRainySeason,
      products: isRainySeason 
        ? [
            { name: "Farine de Maïs", icon: "🌽", trend: "Forte demande" },
            { name: "Haricots", icon: "🫘", trend: "Prix stable" },
            { name: "Minkubala", icon: "🐛", trend: "Saisonnier" },
            { name: "Manioc", icon: "🌿", trend: "Base alimentaire" }
          ]
        : [
            { name: "Tomates", icon: "🍅", trend: "Arrivage frais" },
            { name: "Oignons", icon: "🧅", trend: "Top Ventes" },
            { name: "Braise", icon: "🔥", trend: "Indispensable" },
            { name: "Pommes de terre", icon: "🥔", trend: "Culture irriguée" }
          ]
    };
  };

  const season = getSeasonalContext();

  const form = useForm({
    resolver: zodResolver(insertSurveySchema),
    defaultValues: {
      buyerId: user?.id || 0,
      productSought: "",
      buyingPeriod: "Cette semaine",
      quantity: 1,
      targetPrice: "1000",
      preferences: "Standard"
    },
  });

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        ...data,
        buyerId: Number(user?.id),
        quantity: Number(data.quantity),
        targetPrice: String(data.targetPrice),
      };

      await apiRequest("POST", "/api/surveys", payload);
      localStorage.setItem("agri_survey_timestamp", Date.now().toString());
      
      toast({ title: "Sondage réussi", description: "Vos données pilotent désormais le marché local." });
      queryClient.invalidateQueries({ queryKey: ["/api/market-trends"] });
      onSuccess();
    } catch (error) {
      toast({ title: "Erreur", description: "Veuillez vérifier vos accès.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-primary">
          <span className="flex items-center gap-1">
            {season.isRainy ? <CloudRain size={12}/> : <Sun size={12}/>} 
            {isExpired ? "Analyse Hebdomadaire Approfondie" : "Actualisation Rapide"}
          </span>
          <span>Étape {step} / {totalSteps}</span>
        </div>
        <Progress value={(step / totalSteps) * 100} className="h-1.5 bg-muted" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="min-h-[400px] flex flex-col justify-between">
          
          {/* ÉTAPE 1 : CHOIX DU PRODUIT SELON SAISON */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-500">
              <h2 className="text-xl font-black text-center uppercase tracking-tighter">
                Produits de la saison {season.isRainy ? "des Pluies" : "Sèche"}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {season.products.map((p) => (
                  <Card 
                    key={p.name}
                    className={cn(
                      "cursor-pointer transition-all border-2 relative overflow-hidden",
                      form.watch("productSought") === p.name ? 'border-primary bg-primary/5 shadow-md scale-105' : 'border-border/50 hover:border-primary/30'
                    )}
                    onClick={() => { form.setValue("productSought", p.name); setStep(2); }}
                  >
                    <div className="absolute top-0 right-0 bg-primary/10 text-primary text-[7px] px-2 py-0.5 font-black uppercase">{p.trend}</div>
                    <CardContent className="p-5 flex flex-col items-center gap-2">
                      <span className="text-4xl">{p.icon}</span>
                      <span className="font-extrabold text-[10px] uppercase text-center">{p.name}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ÉTAPE 2 : QUANTITÉ & PRIX (MÉTHODE QUANTITATIVE) */}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-black text-center uppercase">Volumes & Budget (FC)</h2>
              <div className="space-y-4">
                <FormField control={form.control} name="quantity" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase opacity-60">Quantité souhaitée (Sacs/Kg)</FormLabel>
                    <FormControl><Input type="number" className="h-12 rounded-xl bg-muted/30 border-none text-lg font-bold" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="targetPrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase opacity-60">Prix cible acceptable</FormLabel>
                    <FormControl><Input type="number" className="h-12 rounded-xl bg-muted/30 border-none text-lg font-bold text-primary" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
              <Button type="button" className="w-full h-12 rounded-xl font-black" onClick={() => setStep(3)}>CONTINUER</Button>
            </div>
          )}

          {/* ÉTAPE 3 : PÉRIODE */}
          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <h2 className="text-xl font-black text-center uppercase">Délai d'achat souhaité</h2>
              <div className="grid grid-cols-1 gap-2">
                {['Aujourd\'hui', 'Fin de semaine', 'Début du mois prochain'].map((p) => (
                  <Button 
                    key={p} type="button" variant="outline"
                    className={cn("h-14 rounded-xl border-2 font-bold justify-start px-6", form.watch("buyingPeriod") === p ? "border-primary bg-primary/5" : "")}
                    onClick={() => {
                      form.setValue("buyingPeriod", p);
                      if (totalSteps > 3) setStep(4);
                    }}
                  >
                    <CalendarDays className="mr-3 text-primary" size={18} /> {p}
                  </Button>
                ))}
              </div>
              {totalSteps === 3 && (
                <Button type="submit" className="w-full h-14 bg-primary font-black rounded-2xl shadow-xl uppercase mt-4">
                  {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : "DÉBLOQUER LE CATALOGUE"}
                </Button>
              )}
            </div>
          )}

          {/* ÉTAPE 4 : LOGISTIQUE (SI ANALYSE PROFONDE) */}
          {step === 4 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <h2 className="text-xl font-black text-center uppercase tracking-tight">Mode de livraison préféré</h2>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'dom', label: 'Livraison à domicile', icon: <Truck/> },
                  { id: 'col', label: 'Point de collecte (Marché)', icon: <MapPin/> }
                ].map((l) => (
                  <Button 
                    key={l.id} type="button" variant="outline" className="h-16 rounded-xl border-2 font-black gap-4 justify-start px-6"
                    onClick={() => {
                      form.setValue("preferences", `Livraison: ${l.label}`);
                      setStep(5);
                    }}
                  >
                    <span className="text-primary">{l.icon}</span> {l.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* ÉTAPE 5 : HABITUDES (SI ANALYSE PROFONDE) */}
          {step === 5 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary"><BarChart3 size={32}/></div>
              <h2 className="text-xl font-black uppercase tracking-tighter">Fréquence d'achat de ce produit</h2>
              <Select onValueChange={(val) => {
                const current = form.getValues("preferences");
                form.setValue("preferences", `${current} | Fréquence: ${val}`);
              }}>
                <SelectTrigger className="h-14 rounded-xl border-2 font-black"><SelectValue placeholder="Choisir la fréquence..." /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="daily" className="font-bold">Chaque jour</SelectItem>
                  <SelectItem value="weekly" className="font-bold">Chaque semaine</SelectItem>
                  <SelectItem value="monthly" className="font-bold">Une fois par mois</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" className="w-full h-16 bg-primary font-black rounded-2xl shadow-2xl uppercase tracking-widest text-sm" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : "FINALISER L'ANALYSE ET DÉBLOQUER"}
              </Button>
            </div>
          )}

          {step > 1 && (
            <Button type="button" variant="ghost" className="mt-4 font-bold text-muted-foreground" onClick={() => setStep(step - 1)}>
              <ChevronLeft size={14} className="mr-1" /> Retour
            </Button>
          )}

        </form>
      </Form>
    </div>
  );
}