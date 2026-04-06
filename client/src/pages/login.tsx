// client/src/pages/login.tsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { 
  Sprout, Loader2, ArrowLeft, Lock, ShieldCheck, 
  Eye, EyeOff, BarChart3, Globe, Sun, Moon 
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { useTheme } from "@/hooks/use-theme"; // ✅ Ajout du hook de thème
import { z } from "zod";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Format d'email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const { login, user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme(); // ✅ Gestion du thème en local
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      const target = user.userType === "admin" ? "/panel/dashboard" : user.userType === "farmer" ? "/farmer/dashboard" : "/products";
      navigate(target);
    }
  }, [isAuthenticated, user, navigate]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const res = await apiRequest("POST", "/api/login", data);
      return res.json();
    },
    onSuccess: (data) => {
      login(data.user, data.token);
      toast({ title: "Accès autorisé", description: "Ravi de vous revoir !" });
    },
    onError: () => {
      toast({ title: "Échec", description: "Identifiants incorrects.", variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground transition-colors duration-300">
      
      {/* --- CÔTÉ GAUCHE : BRANDING (DESKTOP) --- */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-slate-950 to-orange-500/20 z-0" />
        
        <div className="relative z-10 w-full flex flex-col justify-between p-16">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-2xl transition-transform group-hover:rotate-6">
                <Sprout size={28} />
              </div>
              <span className="text-2xl font-black text-white tracking-tighter uppercase">Agri-Connect</span>
            </div>
          </Link>

          <div className="space-y-6">
            
            <h1 className="text-7xl font-black text-white leading-[0.95] tracking-tighter uppercase">
              L'intelligence <br/> du terrain <br/> <span className="text-primary italic">connectée.</span>
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-10">
            <div className="flex items-center gap-4 text-white/70 font-bold uppercase text-[10px] tracking-widest">
              <BarChart3 className="text-primary" /> Analyse quantitative
            </div>
            <div className="flex items-center gap-4 text-white/70 font-bold uppercase text-[10px] tracking-widest">
              <Globe className="text-primary" /> Circuit court
            </div>
          </div>
        </div>
      </div>

      {/* --- CÔTÉ DROIT : FORMULAIRE --- */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-16 relative">
        
        {/* Boutons d'action rapides (Haut de page) */}
        <div className="absolute top-8 left-8 right-8 flex justify-between items-center">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 font-bold rounded-xl">
              <ArrowLeft size={16} /> Accueil
            </Button>
          </Link>
          
          {/* ✅ Sélecteur de Thème dédié au Login */}
          <Button variant="outline" size="icon" onClick={toggleTheme} className="rounded-full border-2">
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} className="text-yellow-500" />}
          </Button>
        </div>

        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
          <div className="text-center md:text-left">
            <h2 className="text-4xl font-black tracking-tighter uppercase">Connexion</h2>
            <p className="text-muted-foreground font-medium italic">Entrez vos accès pour accéder au SI.</p>
          </div>

          <Card className="border-2 border-border shadow-2xl rounded-[2.5rem] bg-card overflow-hidden">
            <CardContent className="p-8 md:p-10">
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-6">
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-70">Identifiant Email</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="votre@email.cd" 
                            className="h-14 bg-background border-2 border-border focus:border-primary focus:ring-0 rounded-2xl px-6 text-foreground font-bold" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-70">Mot de passe</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="••••••••" 
                              className="h-14 bg-background border-2 border-border focus:border-primary focus:ring-0 rounded-2xl px-6 pr-12 text-foreground font-bold" 
                              {...field} 
                            />
                            <button 
                              type="button" 
                              onClick={() => setShowPassword(!showPassword)} 
                              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-lg transition-colors text-primary"
                            >
                              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-16 bg-primary hover:bg-primary/90 text-white text-lg font-black shadow-xl rounded-2xl transition-all active:scale-95 uppercase tracking-widest"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? <Loader2 className="animate-spin" /> : "SE CONNECTER"}
                  </Button>
                </form>
              </Form>

              <div className="mt-10 pt-8 border-t text-center">
                <p className="text-sm text-muted-foreground font-medium mb-4">Nouveau membre ?</p>
                <Link href="/register">
                  <span className="text-primary font-black uppercase text-xs tracking-widest cursor-pointer hover:underline">
                    Créer mon compte de producteur ou d'acheteur
                  </span>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex items-center justify-center gap-2 opacity-30">
          </div>
        </div>
      </div>
    </div>
  );
}