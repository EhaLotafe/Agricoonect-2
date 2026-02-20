import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Sprout, Loader2, ArrowLeft, Lock, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { z } from "zod";
import { cn } from "@/lib/utils";

// Schéma de validation rigoureux pour la sécurité du SI
const loginSchema = z.object({
  email: z.string().email("Veuillez entrer un email valide (ex: nom@mail.com)"),
  password: z.string().min(1, "Le mot de passe est obligatoire"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const { login, user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  // ✅ REDIRECTION AUTOMATIQUE (Si déjà connecté, on protège la route)
  useEffect(() => {
    if (isAuthenticated && user) {
      const target = user.userType === "admin" 
        ? "/panel/dashboard" 
        : user.userType === "farmer" 
          ? "/farmer/dashboard" 
          : "/buyer/dashboard";
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
      const { token, user } = data;
      login(user, token); // On connecte l'utilisateur

      toast({
        title: "Connexion réussie",
        description: `Bienvenue, ${user.firstName} !`,
      });

      // 🚀 REDIRECTION STRATÉGIQUE (Argument UX du mémoire)
      if (user.userType === "admin") {
        navigate("/panel/dashboard");
      } else if (user.userType === "farmer") {
        navigate("/farmer/dashboard");
      } else {
        // L'acheteur arrive directement sur le marché !
        navigate("/products"); 
      }
    },
    onError: (error: any) => {
      toast({
        title: "Échec de l'identification",
        description: "Email ou mot de passe invalide. Veuillez vérifier vos accès.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-500">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Bouton Retour contextuel */}
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-6 gap-2 text-muted-foreground hover:text-primary transition-colors rounded-xl">
            <ArrowLeft size={16} /> Revenir à l'accueil
          </Button>
        </Link>

        {/* Branding & Identité Katangaise */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[1.5rem] bg-primary text-white shadow-2xl shadow-primary/20 mb-2 transform -rotate-3 transition-transform hover:rotate-0">
            <Sprout size={40} />
          </div>
          <h2 className="text-4xl font-black tracking-tighter text-foreground">Agri-Connect</h2>
          <div className="flex items-center justify-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.3em]">
            <ShieldCheck size={14} /> Accès Sécurisé • RDC
          </div>
        </div>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border-border bg-card shadow-2xl rounded-[2rem] overflow-hidden transition-colors border-2">
          <CardHeader className="space-y-1 bg-muted/30 border-b p-8">
            <CardTitle className="text-2xl font-black tracking-tight">Identification</CardTitle>
            <CardDescription className="text-muted-foreground font-medium">
              Connectez-vous pour gérer vos échanges agricoles.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8 px-8 pb-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Adresse Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="votre.nom@mail.cd" 
                          className="h-12 bg-background border-border focus:ring-primary rounded-xl" 
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
                      <FormLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Mot de passe</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••••••" 
                            className="h-12 bg-background border-border focus:ring-primary pr-12 rounded-xl" 
                            {...field} 
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                            title={showPassword ? "Cacher" : "Afficher"}
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
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-white text-lg font-black shadow-xl shadow-primary/10 transition-all active:scale-95 rounded-2xl"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> 
                      VÉRIFICATION...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" /> 
                      SE CONNECTER
                    </>
                  )}
                </Button>
              </form>
            </Form>

            {/* Lien d'inscription vers la couleur Accent (Orange) */}
            <div className="mt-10 pt-6 border-t border-border text-center">
              <p className="text-sm text-muted-foreground font-medium">
                Nouveau sur Agri-Connect ?
              </p>
              <Link href="/register">
                <Button variant="link" className="mt-2 text-brand-orange font-black uppercase tracking-widest text-[10px] hover:no-underline hover:opacity-80">
                  Créer mon compte de producteur ou d'acheteur
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Mentions finales */}
        <div className="mt-8 flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
           <p className="text-[9px] text-muted-foreground uppercase tracking-[0.4em] font-black text-center">
            Système de Marketing Agricole RDC
          </p>
        </div>
      </div>
    </div>
  );
}