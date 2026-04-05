// client/src/pages/register.tsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Sprout, Tractor, ShoppingBasket, Loader2, UserPlus, 
  Eye, EyeOff, MapPin, ShieldCheck, ArrowLeft, CheckCircle, 
  Leaf, Zap 
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { insertUserSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { z } from "zod";
import { cn } from "@/lib/utils";

const COMMUNE_LIST = ["Annexe", "Lubumbashi", "Kenya", "Katuba", "Kamalondo", "Kampemba", "Ruashi", "Autre"];

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
  const { login, isAuthenticated, user: authUser } = useAuth();
  const { toast } = useToast();
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (isAuthenticated && authUser) {
      const target = authUser.userType === "admin" ? "/panel/dashboard" : authUser.userType === "farmer" ? "/farmer/dashboard" : "/products";
      navigate(target);
    }
  }, [isAuthenticated, authUser, navigate]);

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
      const autoUsername = `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}`.replace(/\s/g, '');
      const finalLocation = data.commune === "Autre" ? data.customCommune : data.commune;
      const { confirmPassword, customCommune, commune, ...userData } = data;
      
      const payload = { ...userData, username: autoUsername, location: finalLocation };
      const res = await apiRequest('POST', '/api/register', payload);
      return res.json();
    },
    onSuccess: (data) => {
      login(data.user, data.token);
      toast({ title: "Compte créé !", description: "Bienvenue dans la communauté." });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      
      {/* --- CÔTÉ GAUCHE : BRANDING & VALEURS --- */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 via-slate-950 to-emerald-500/20 z-0" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] opacity-10 z-1" />
        
        <div className="relative z-10 w-full flex flex-col p-16">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer group w-fit mb-12">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-2xl group-hover:rotate-6 transition-transform">
                <Sprout size={28} />
              </div>
              <span className="text-2xl font-black text-white tracking-tighter uppercase">Agri-Connect</span>
            </div>
          </Link>

          <div className="space-y-8">
            <h1 className="text-6xl font-black text-white leading-[0.99] tracking-tighter uppercase">
              Cultivons <br/> l'intelligence <br/> <span className="text-primary italic">ensemble.</span>
            </h1>
            
            <div className="space-y-4 max-w-md">
                <div className="flex gap-4 items-center p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <div className="p-2 bg-primary/20 rounded-lg text-primary"><Leaf size={20}/></div>
                    <p className="text-sm text-slate-300 font-medium italic">"Valorisez vos récoltes grâce à la traçabilité numérique."</p>
                </div>
                <div className="flex gap-4 items-center p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400"><Zap size={20}/></div>
                    <p className="text-sm text-slate-300 font-medium italic">"Accédez aux meilleurs prix du marché de Lubumbashi."</p>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- CÔTÉ DROIT : FORMULAIRE --- */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 lg:p-16 overflow-y-auto">
        <Link href="/login" className="absolute top-8 right-8 hidden md:block">
          <Button variant="ghost" className="font-bold text-muted-foreground hover:text-primary">
            Déjà membre ? <span className="text-primary ml-1 font-black underline">Se connecter</span>
          </Button>
        </Link>

        <div className="w-full max-w-lg space-y-8 py-10 animate-in fade-in slide-in-from-bottom-4">
          <div className="text-center md:text-left space-y-2">
            <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">Créer un compte</h2>
            <p className="text-muted-foreground font-medium italic">Identifiez-vous pour accéder au marché de Lubumbashi.</p>
          </div>

          <Card className="border-2 shadow-2xl rounded-[2.5rem] overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(data => registerMutation.mutate(data))} className="space-y-6">
                  
                  <FormField
                    control={form.control}
                    name="userType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Type d'acteur</FormLabel>
                        <Tabs value={field.value} onValueChange={field.onChange} className="w-full">
                          <TabsList className="grid w-full grid-cols-2 h-14 bg-muted/50 p-1 rounded-2xl border">
                            <TabsTrigger value="farmer" className="rounded-xl font-black gap-2 text-xs uppercase data-[state=active]:bg-primary data-[state=active]:text-white">
                              <Tractor size={16} /> Agriculteur
                            </TabsTrigger>
                            <TabsTrigger value="buyer" className="rounded-xl font-black gap-2 text-xs uppercase data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                              <ShoppingBasket size={16} /> Acheteur
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField name="firstName" render={({ field }) => (
                      <FormItem><FormLabel className="text-[10px] font-black uppercase opacity-60 ml-1">Prénom</FormLabel>
                      <FormControl><Input placeholder="Prénom" className="h-12 bg-muted/30 border-none rounded-xl font-bold" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField name="lastName" render={({ field }) => (
                      <FormItem><FormLabel className="text-[10px] font-black uppercase opacity-60 ml-1">Nom</FormLabel>
                      <FormControl><Input placeholder="Nom" className="h-12 bg-muted/30 border-none rounded-xl font-bold" {...field} /></FormControl></FormItem>
                    )} />
                  </div>

                  <FormField name="email" render={({ field }) => (
                    <FormItem><FormLabel className="text-[10px] font-black uppercase opacity-60 ml-1">Adresse Email</FormLabel>
                    <FormControl><Input type="email" placeholder="votre@email.cd" className="h-12 bg-muted/30 border-none rounded-xl font-bold" {...field} /></FormControl></FormItem>
                  )} />

                  <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
                    <FormField name="commune" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-widest">
                           <MapPin size={14}/> {userType === 'farmer' ? "Bassin de production" : "Localisation"}
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger className="h-12 bg-background border-none rounded-xl shadow-sm"><SelectValue placeholder="Choisir une zone..." /></SelectTrigger></FormControl>
                          <SelectContent className="rounded-xl border-none shadow-2xl">
                            {COMMUNE_LIST.map(c => <SelectItem key={c} value={c} className="font-bold">{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField name="password" render={({ field }) => (
                      <FormItem><FormLabel className="text-[10px] font-black uppercase opacity-60 ml-1">Mot de passe</FormLabel>
                      <div className="relative">
                        <Input type={showPass ? "text" : "password"} className="h-12 bg-muted/30 border-none rounded-xl pr-10" {...field} />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {showPass ? <EyeOff size={18}/> : <Eye size={18}/>}
                        </button>
                      </div></FormItem>
                    )} />
                    <FormField name="confirmPassword" render={({ field }) => (
                      <FormItem><FormLabel className="text-[10px] font-black uppercase opacity-60 ml-1">Confirmation</FormLabel>
                      <Input type="password" placeholder="••••••••" className="h-12 bg-muted/30 border-none rounded-xl" {...field} /></FormItem>
                    )} />
                  </div>

                  <Button type="submit" className={cn("w-full h-16 text-lg font-black shadow-xl rounded-2xl transition-all active:scale-95 uppercase tracking-widest", userType === 'farmer' ? "bg-primary" : "bg-orange-600 text-white")} disabled={registerMutation.isPending}>
                    {registerMutation.isPending ? <Loader2 className="animate-spin" /> : <><UserPlus className="mr-2" /> S'inscrire</>}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}