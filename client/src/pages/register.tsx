import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sprout, Tractor, ShoppingBasket, Loader2, UserPlus, Eye, EyeOff, MapPin, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "wouter";
import { insertUserSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { z } from "zod";
import { cn } from "@/lib/utils";

// 📍 Communes de Lubumbashi
const COMMUNE_LIST = ["Annexe", "Lubumbashi", "Kenya", "Katuba", "Kamalondo", "Kampemba", "Ruashi", "Autre"];

// Schéma de validation : on ignore 'username' car on le génère auto
const registerSchema = insertUserSchema.omit({ username: true }).extend({
  confirmPassword: z.string().min(1, "La confirmation est requise"),
  commune: z.string().min(1, "Veuillez choisir votre zone"),
  customCommune: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [showPass, setShowPass] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '', lastName: '', email: '', phone: '',
      password: '', confirmPassword: '', userType: 'buyer',
      commune: '', customCommune: '', isActive: true,
    },
  });

  const userType = form.watch('userType');
  const selectedCommune = form.watch('commune');

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      // 🤖 GÉNÉRATION AUTO DU USERNAME (Point clé du mémoire)
      const autoUsername = `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}`.replace(/\s/g, '');
      
      const finalLocation = data.commune === "Autre" ? data.customCommune : data.commune;
      const { confirmPassword, customCommune, commune, ...userData } = data;
      
      const payload = { 
        ...userData, 
        username: autoUsername, 
        location: finalLocation 
      };

      const res = await apiRequest('POST', '/api/register', payload);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.token) {
        login(data.user, data.token); // Synchronisation immédiate de la session
        toast({ title: "Bienvenue !", description: "Votre compte Agri-Connect est prêt." });
        
        // Redirection intelligente selon le rôle (RBAC)
        navigate(data.user.userType === 'farmer' ? '/farmer/dashboard' : '/buyer/dashboard');
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "Échec", 
        description: error.message || "Erreur lors de la création du compte.", 
        variant: "destructive" 
      });
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center py-12 px-4 transition-colors duration-300">
      <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        {/* Logo & Branding */}
        <div className="text-center space-y-3">
          <Link href="/">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary text-white rounded-2xl shadow-xl cursor-pointer hover:rotate-6 transition-transform">
              <Sprout size={32} />
            </div>
          </Link>
          <h1 className="text-3xl font-black tracking-tighter">Créer mon compte</h1>
          <div className="flex items-center justify-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em]">
            <ShieldCheck size={14} /> Inscription Sécurisée
          </div>
        </div>

        <Card className="border-border bg-card shadow-2xl rounded-[2rem] overflow-hidden border-2">
          <CardHeader className="bg-muted/30 border-b pb-6 text-center">
            <CardTitle className="text-lg uppercase tracking-widest font-black text-primary">Rejoignez la communauté</CardTitle>
          </CardHeader>
          
          <CardContent className="pt-8 space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(data => registerMutation.mutate(data), (err) => {
                console.error("Erreurs validation:", err);
                toast({ title: "Champs requis", description: "Veuillez vérifier les informations saisies.", variant: "destructive"});
              })} className="space-y-6">
                
                {/* 🎭 SÉLECTION DU RÔLE */}
                <FormField
                  control={form.control}
                  name="userType"
                  render={({ field }) => (
                    <Tabs value={field.value} onValueChange={field.onChange} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 h-14 bg-muted p-1 rounded-xl">
                        <TabsTrigger value="farmer" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white font-black gap-2 text-xs uppercase">
                          <Tractor size={16} /> Agriculteur
                        </TabsTrigger>
                        <TabsTrigger value="buyer" className="rounded-lg data-[state=active]:bg-brand-orange data-[state=active]:text-white font-black gap-2 text-xs uppercase">
                          <ShoppingBasket size={16} /> Acheteur
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  )}
                />

                {/* IDENTITÉ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="firstName" render={({ field }) => (
                    <FormItem><FormLabel className="font-bold">Prénom *</FormLabel>
                    <FormControl><Input placeholder="Prénom" className="h-11 bg-background rounded-xl" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="lastName" render={({ field }) => (
                    <FormItem><FormLabel className="font-bold">Nom *</FormLabel>
                    <FormControl><Input placeholder="Nom" className="h-11 bg-background rounded-xl" {...field} /></FormControl></FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel className="font-bold">Email *</FormLabel>
                  <FormControl><Input type="email" placeholder="votre@email.cd" className="h-11 bg-background rounded-xl" {...field} /></FormControl></FormItem>
                )} />

                {/* 📍 ZONE DE RÉSIDENCE / PRODUCTION */}
                <div className="space-y-4 p-5 bg-muted/20 rounded-[1.5rem] border-2 border-dashed">
                  <FormField control={form.control} name="commune" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-muted-foreground">
                        <MapPin size={14} className="text-primary"/> 
                        {userType === 'farmer' ? "Zone de production" : "Localisation (Lubumbashi)"}
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background h-11 rounded-xl"><SelectValue placeholder="Choisir une zone..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                          {COMMUNE_LIST.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />

                  {selectedCommune === "Autre" && (
                    <FormField control={form.control} name="customCommune" render={({ field }) => (
                      <FormItem className="animate-in slide-in-from-top-2">
                        <FormControl><Input placeholder="Précisez votre quartier ou village..." className="h-11 bg-background border-primary/30 rounded-xl" {...field} /></FormControl>
                      </FormItem>
                    )} />
                  )}
                </div>

                {/* SÉCURITÉ + ŒIL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem><FormLabel className="font-bold">Mot de passe</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showPass ? "text" : "password"} className="h-11 bg-background pr-10 rounded-xl" {...field} />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-slate-400 hover:text-primary transition-colors">
                          {showPass ? <EyeOff size={18}/> : <Eye size={18}/>}
                        </button>
                      </div>
                    </FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                    <FormItem><FormLabel className="font-bold">Confirmation</FormLabel>
                    <FormControl><Input type="password" placeholder="••••••••" className="h-11 bg-background rounded-xl" {...field} /></FormControl></FormItem>
                  )} />
                </div>

                <Button 
                  type="submit" 
                  className={cn(
                    "w-full h-16 text-lg font-black shadow-xl transition-all active:scale-95 rounded-2xl uppercase tracking-widest",
                    userType === 'farmer' ? "bg-primary" : "bg-brand-orange text-white"
                  )}
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? <Loader2 className="animate-spin" /> : <><UserPlus className="mr-2" /> CRÉER MON COMPTE</>}
                </Button>
              </form>
            </Form>

            <div className="mt-8 text-center border-t pt-6">
              <p className="text-muted-foreground text-sm font-medium">Déjà membre ? <Link href="/login" className="text-primary font-bold underline ml-1">Connectez-vous ici</Link></p>
            </div>
          </CardContent>
        </Card>
        
        <p className="text-center text-[10px] text-muted-foreground uppercase tracking-[0.4em] font-black opacity-30">
          Système de Marketing Agricole RDC • 2025
        </p>
      </div>
    </div>
  );
}