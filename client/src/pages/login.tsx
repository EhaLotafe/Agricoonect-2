// client/src/pages/login.tsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Sprout, Loader2, ArrowLeft, Lock, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { z } from "zod";

// Schéma de validation (Rigueur de la Conception Technique)
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

  /**
   * 🛡️ Protection des routes (Middleware Frontend)
   * Redirige automatiquement si l'utilisateur possède déjà un jeton valide.
   */
  useEffect(() => {
    if (isAuthenticated && user) {
      const target = user.userType === "admin" 
        ? "/panel/dashboard" 
        : user.userType === "farmer" 
          ? "/farmer/dashboard" 
          : "/products";
      navigate(target);
    }
  }, [isAuthenticated, user, navigate]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  /**
   * Mutation d'authentification (Sprint 1 : Sécurisation)
   */
  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const res = await apiRequest("POST", "/api/login", data);
      return res.json();
    },
    onSuccess: (data) => {
      const { token, user } = data;
      login(user, token); // Stockage persistant du JWT

      toast({ title: "Accès autorisé", description: `Ravi de vous revoir, ${user.firstName} !` });

      // Redirection selon le privilège RBAC
      if (user.userType === "admin") navigate("/panel/dashboard");
      else if (user.userType === "farmer") navigate("/farmer/dashboard");
      else navigate("/products"); 
    },
    onError: () => {
      toast({
        title: "Échec d'identification",
        description: "Identifiants incorrects. Accès refusé par le SI.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 transition-colors duration-500">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-4">
        
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-6 gap-2 text-muted-foreground hover:text-primary rounded-xl">
            <ArrowLeft size={16} /> Retour à l'accueil
          </Button>
        </Link>

        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary text-white shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform">
            <Sprout size={40} />
          </div>
          <h2 className="text-4xl font-black tracking-tighter uppercase">Agri-Connect</h2>
          <div className="flex items-center justify-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest">
            <ShieldCheck size={14} /> Connexion Sécurisée • RDC
          </div>
        </div>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border-2 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="space-y-1 bg-muted/30 border-b p-8">
            <CardTitle className="text-2xl font-black uppercase tracking-tight">Identification</CardTitle>
            <CardDescription className="font-medium italic">Accédez à votre espace d'intelligence marketing.</CardDescription>
          </CardHeader>
          
          <CardContent className="pt-8 px-8 pb-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-black text-[10px] uppercase tracking-widest opacity-60">Adresse Email</FormLabel>
                      <FormControl>
                        <Input placeholder="votre.nom@mail.cd" className="h-12 bg-muted/20 border-none rounded-xl" {...field} />
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
                      <FormLabel className="font-black text-[10px] uppercase tracking-widest opacity-60">Mot de passe</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••" 
                            className="h-12 bg-muted/20 border-none pr-12 rounded-xl" 
                            {...field} 
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-white text-lg font-black shadow-xl rounded-2xl transition-all active:scale-95"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> VÉRIFICATION...</>
                  ) : (
                    <><Lock className="mr-2 h-4 w-4" /> SE CONNECTER</>
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-10 pt-6 border-t text-center">
              <p className="text-sm text-muted-foreground font-medium">Nouveau sur la plateforme ?</p>
              <Link href="/register">
                <Button variant="link" className="mt-2 text-orange-600 font-black uppercase tracking-widest text-[10px] hover:no-underline">
                  Créer un compte de producteur ou d'acheteur
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="mt-8 text-[9px] text-muted-foreground uppercase tracking-[0.4em] font-black text-center opacity-30">
          Système de Marketing Agricole • Lubumbashi
        </p>
      </div>
    </div>
  );
}