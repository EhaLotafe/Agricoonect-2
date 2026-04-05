// client/src/pages/login.tsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card"; // CardHeader et CardTitle supprimés car on fait un design custom
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge"; // ✅ IMPORTATION AJOUTÉE ICI
import { Sprout, Loader2, ArrowLeft, Lock, ShieldCheck, Eye, EyeOff, BarChart3, Globe } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { z } from "zod";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Format d'email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const { login, user, isAuthenticated } = useAuth();
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
      toast({ title: "Accès autorisé", description: `Ravi de vous revoir, ${data.user.firstName} !` });
    },
    onError: () => {
      toast({ title: "Échec", description: "Identifiants incorrects.", variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      
      {/* --- CÔTÉ GAUCHE : BRANDING (VISIBLE SUR DESKTOP) --- */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-slate-950 to-orange-500/20 z-0" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 z-1" />
        
        <div className="relative z-10 w-full flex flex-col justify-between p-16">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-2xl group-hover:rotate-6 transition-transform">
                <Sprout size={28} />
              </div>
              <span className="text-2xl font-black text-white tracking-tighter uppercase">Agri-Connect</span>
            </div>
          </Link>

          <div className="space-y-6">
            <h1 className="text-6xl font-black text-white leading-[0.95] tracking-tighter uppercase">
              Le futur de <br/> l'agriculture <br/> <span className="text-primary italic">est ici.</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-md font-medium leading-relaxed italic">
              "Réduire la fracture numérique en connectant les bassins de production ruraux aux citadins de Lubumbashi."
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/5 rounded-xl text-primary"><BarChart3 size={24}/></div>
              <p className="text-xs text-slate-300 font-bold uppercase tracking-widest">Analyse de la demande</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/5 rounded-xl text-primary"><Globe size={24}/></div>
              <p className="text-xs text-slate-300 font-bold uppercase tracking-widest">Circuit Court</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- CÔTÉ DROIT : FORMULAIRE --- */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-16 relative">
        <Link href="/" className="absolute top-8 left-8 md:hidden">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground rounded-xl">
            <ArrowLeft size={16} /> Retour
          </Button>
        </Link>

        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
          <div className="text-center md:text-left space-y-2">
            <div className="md:hidden inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-white shadow-xl mb-4">
               <Sprout size={32} />
            </div>
            <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">Identification</h2>
            <p className="text-muted-foreground font-medium italic">Accédez à votre espace sécurisé.</p>
          </div>

          <Card className="border-2 shadow-2xl rounded-[2.5rem] overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-8 md:p-10">
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-60">Adresse Email</FormLabel>
                        <FormControl>
                          <Input placeholder="votre.nom@mail.cd" className="h-14 bg-muted/30 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-medium" {...field} />
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
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-60">Mot de passe</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="••••••••" 
                              className="h-14 bg-muted/30 border-none rounded-2xl pr-12 font-medium" 
                              {...field} 
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
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
                    {loginMutation.isPending ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Vérification...</>
                    ) : (
                      <><Lock className="mr-2 h-5 w-5" /> Se Connecter</>
                    )}
                  </Button>
                </form>
              </Form>

              <div className="mt-10 pt-8 border-t text-center space-y-4">
                <p className="text-sm text-muted-foreground font-medium">Nouveau sur Agri-Connect ?</p>
                <Link href="/register">
                  <Button variant="outline" className="w-full h-14 border-2 border-primary/20 text-primary font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-primary/5">
                    Créer mon compte
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-center gap-2 opacity-50">
            <ShieldCheck size={14} className="text-primary" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em]">Système de Marketing Sécurisé</span>
          </div>
        </div>
      </div>
    </div>
  );
}