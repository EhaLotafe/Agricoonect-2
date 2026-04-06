// client/src/pages/register.tsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Sprout, Tractor, ShoppingBasket, Loader2, UserPlus, 
  Eye, EyeOff, MapPin, ShieldCheck, ArrowLeft, CheckCircle, 
  Leaf, Zap, Sun, Moon, Wand2 
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { insertUserSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";
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
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

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

  const suggestPassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let retVal = "";
    for (let i = 0; i < 12; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    form.setValue("password", retVal);
    form.setValue("confirmPassword", retVal);
    setShowPass(true);
    setShowConfirmPass(true);
    toast({ title: "Sécurité renforcée", description: "Mot de passe robuste généré." });
  };

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
      toast({ title: "Inscription réussie", description: "Bienvenue sur Agri-Connect." });
    },
  });

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground transition-all duration-500">
      
      {/* --- CÔTÉ GAUCHE : BRANDING (VISIBLE SUR DESKTOP) --- */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-slate-950">
        <div className={cn(
          "absolute inset-0 transition-opacity duration-1000 bg-gradient-to-tr z-0",
          userType === 'farmer' ? "from-primary/30 via-slate-950 to-emerald-500/10" : "from-orange-500/20 via-slate-950 to-orange-900/10"
        )} />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 z-1" />
        
        <div className="relative z-10 w-full flex flex-col p-16">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer group w-fit mb-12">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-2xl group-hover:rotate-6 transition-transform">
                <Sprout size={28} />
              </div>
              <span className="text-2xl font-black text-white tracking-tighter uppercase text-left">Agri-Connect</span>
            </div>
          </Link>

          <div className="space-y-8">
            <h1 className="text-6xl font-black text-white leading-[0.99] tracking-tighter uppercase text-left">
              Cultivons <br/> l'intelligence <br/> <span className={cn("transition-colors duration-500 italic", userType === 'farmer' ? "text-primary" : "text-orange-500")}>ensemble.</span>
            </h1>
            <div className="space-y-4 max-w-md">
                <div className="flex gap-4 items-center p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <div className="p-2 bg-primary/20 rounded-lg text-primary"><Leaf size={24}/></div>
                    <p className="text-sm text-slate-300 font-medium italic">"Désenclavement numérique des zones rurales."</p>
                </div>
                <div className="flex gap-4 items-center p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400"><Zap size={24}/></div>
                    <p className="text-sm text-slate-300 font-medium italic">"Accès direct aux besoins réels de Lubumbashi."</p>
                </div>
            </div>
          </div>

          <div className="mt-auto pt-10 border-t border-white/10">
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">Faculté des Sciences • UNILU 2025</p>
          </div>
        </div>
      </div>

      {/* --- CÔTÉ DROIT : FORMULAIRE --- */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 lg:p-16 overflow-y-auto relative">
        
        <div className="absolute top-8 left-8 right-8 flex justify-between items-center">
          <Link href="/"><Button variant="ghost" size="sm" className="gap-2 font-bold rounded-xl"><ArrowLeft size={16} /> Accueil</Button></Link>
          <Button variant="outline" size="icon" onClick={toggleTheme} className="rounded-full border-2">
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} className="text-yellow-500" />}
          </Button>
        </div>

        <div className="w-full max-w-lg space-y-8 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center md:text-left space-y-1">
            <h2 className="text-4xl font-black tracking-tighter uppercase">Inscription</h2>
            <p className="text-muted-foreground font-medium italic text-sm">Créez votre identité sur le Système.</p>
          </div>

          <Card className={cn(
            "border-2 shadow-2xl rounded-[2.5rem] bg-card overflow-hidden transition-all duration-500",
            userType === 'farmer' ? "border-primary/30 shadow-primary/5" : "border-orange-500/30 shadow-orange-500/5"
          )}>
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(data => registerMutation.mutate(data))} className="space-y-6">
                  
                  {/* SÉLECTEUR DE RÔLE AVEC COULEURS DYNAMIQUES */}
                  <FormField control={form.control} name="userType" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Vous êtes un :</FormLabel>
                      <Tabs value={field.value} onValueChange={field.onChange} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 h-16 bg-muted/50 p-1.5 rounded-2xl border-2">
                          <TabsTrigger 
                            value="farmer" 
                            className="rounded-xl font-black gap-2 text-xs uppercase data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
                          >
                            <Tractor size={18} /> Agriculteur
                          </TabsTrigger>
                          <TabsTrigger 
                            value="buyer" 
                            className="rounded-xl font-black gap-2 text-xs uppercase data-[state=active]:bg-orange-600 data-[state=active]:text-white transition-all"
                          >
                            <ShoppingBasket size={18} /> Acheteur
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField name="firstName" render={({ field }) => (
                      <FormItem><FormLabel className="text-[10px] font-black uppercase opacity-60 ml-1">Prénom</FormLabel>
                      <FormControl><Input placeholder="Prénom" className="h-12 bg-background border-2 border-border focus:border-primary rounded-xl font-bold" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField name="lastName" render={({ field }) => (
                      <FormItem><FormLabel className="text-[10px] font-black uppercase opacity-60 ml-1">Nom</FormLabel>
                      <FormControl><Input placeholder="Nom" className="h-12 bg-background border-2 border-border focus:border-primary rounded-xl font-bold" {...field} /></FormControl></FormItem>
                    )} />
                  </div>

                  <FormField name="email" render={({ field }) => (
                    <FormItem><FormLabel className="text-[10px] font-black uppercase opacity-60 ml-1">Adresse Email</FormLabel>
                    <FormControl><Input type="email" placeholder="votre@email.cd" className="h-12 bg-background border-2 border-border focus:border-primary rounded-xl font-bold" {...field} /></FormControl></FormItem>
                  )} />

                  <FormField name="commune" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-widest"><MapPin size={14}/> Commune de Lubumbashi</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="h-12 bg-background border-2 border-border rounded-xl font-bold"><SelectValue placeholder="Choisir une commune" /></SelectTrigger></FormControl>
                        <SelectContent className="rounded-xl border-2 shadow-2xl">{COMMUNE_LIST.map(c => <SelectItem key={c} value={c} className="font-bold">{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </FormItem>
                  )} />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <FormLabel className="text-[10px] font-black uppercase opacity-60 ml-1">Mot de passe</FormLabel>
                       <Button type="button" variant="link" onClick={suggestPassword} className="h-auto p-0 text-[10px] font-black text-primary uppercase gap-1">
                         <Wand2 size={12}/> Suggérer
                       </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField name="password" render={({ field }) => (
                        <FormItem>
                          <div className="relative">
                            <Input type={showPass ? "text" : "password"} placeholder="Mot de passe" className="h-12 bg-background border-2 border-border focus:border-primary rounded-xl pr-10 font-bold" {...field} />
                            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary p-1">{showPass ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                          </div>
                        </FormItem>
                      )} />
                      <FormField name="confirmPassword" render={({ field }) => (
                        <FormItem>
                          <div className="relative">
                            <Input type={showConfirmPass ? "text" : "password"} placeholder="Confirmation" className="h-12 bg-background border-2 border-border focus:border-primary rounded-xl pr-10 font-bold" {...field} />
                            <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary p-1">{showConfirmPass ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                          </div>
                        </FormItem>
                      )} />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className={cn(
                        "w-full h-16 text-lg font-black shadow-xl rounded-2xl transition-all active:scale-95 uppercase tracking-widest", 
                        userType === 'farmer' ? "bg-primary" : "bg-orange-600 text-white"
                    )} 
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? <Loader2 className="animate-spin" /> : "S'INSCRIRE SUR AGRI-CONNECT"}
                  </Button>
                </form>
              </Form>
              <p className="mt-8 text-center text-sm text-muted-foreground font-medium">Déjà inscrit ? <Link href="/login" className="text-primary font-black underline ml-1">Se connecter</Link></p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}