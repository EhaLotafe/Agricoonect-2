import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { 
  Sprout, Menu, User, ShoppingBasket, Tractor, 
  Settings, Moon, Sun, Home, Package, LogOut, Shield, 
  Mail, MapPin, Phone, Calendar, UserCircle, Edit3, Save, X, Wifi, WifiOff, Loader2,
  ChevronDown, Info // ✅ Imports vérifiés
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription 
} from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/hooks/use-theme";
import { useIsOnline } from "@/hooks/use-online";
import { cn, formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const NAV_CONFIG = {
  public: [{ href: "/", label: "Accueil", icon: Home }, { href: "/products", label: "Marché", icon: Package }, { href: "/about", label: "À propos", icon: Info }],
  farmer: [{ href: "/", label: "Accueil", icon: Home }, { href: "/farmer/dashboard", label: "Mes Récoltes", icon: Tractor }],
  buyer: [{ href: "/", label: "Accueil", icon: Home }, { href: "/buyer/dashboard", label: "Mes Achats", icon: ShoppingBasket }],
  admin: [{ href: "/", label: "Accueil", icon: Home }, { href: "/panel/dashboard", label: "Supervision", icon: Settings }],
};

/**
 * 🌍 Fonction de traduction des rôles (Argument Mémoire : Localisation UX)
 */
const translateRole = (role?: string) => {
  if (!role) return "";
  const roles: Record<string, string> = {
    farmer: "Producteur ",
    buyer: "Acheteur ",
    admin: "Administrateur",
  };
  return roles[role.toLowerCase()] || role;
};

export default function Header() {
  const { user, logout, isAuthenticated, login } = useAuth();
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isOnline = useIsOnline();
  const { toast } = useToast();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const role = isAuthenticated && user ? user.userType : 'public';
  const navItems = NAV_CONFIG[role as keyof typeof NAV_CONFIG] || NAV_CONFIG.public;

  const form = useForm({
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
      location: user?.location || ""
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('PUT', `/api/admin/users/${user?.id}`, data);
      return res.json();
    },
    onSuccess: (updatedUser) => {
      const token = localStorage.getItem("agri_token");
      if (token) login(updatedUser, token);
      toast({ title: "Profil mis à jour" });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    }
  });

  return (
    <>
      <header className="bg-background/80 backdrop-blur-md sticky top-0 z-50 w-full border-b border-border shadow-sm transition-all duration-300">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer group">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg transform group-hover:rotate-6 transition-transform">
                <Sprout size={22} />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-black leading-none tracking-tighter text-foreground uppercase">Agri-Connect</h1>
                <p className="text-[9px] uppercase tracking-widest text-primary font-bold">Lubumbashi • RDC</p>
              </div>
            </div>
          </Link>

          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full h-9 w-9">
              {theme === "light" ? <Moon size={18} className="text-slate-600" /> : <Sun size={18} className="text-yellow-400" />}
            </Button>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 flex items-center gap-2 pl-2 pr-1 rounded-full bg-muted/50 hover:bg-muted transition-all border border-transparent hover:border-primary/20 group">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-black border-2 border-background">
                      {user?.firstName[0]}{user?.lastName[0]}
                    </div>
                    <span className="hidden sm:inline text-xs font-bold mr-1">{user?.firstName}</span>
                    <ChevronDown size={14} className="text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
                  </Button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent align="end" className="w-72 mt-2 rounded-[1.5rem] p-2 shadow-2xl border-border bg-popover/95 backdrop-blur-md animate-in fade-in zoom-in-95">
                  <div className="p-4 mb-2 rounded-2xl bg-muted/50 flex items-center gap-4 border border-border/50">
                    <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-white font-black text-lg shadow-lg">
                      {user?.firstName[0]}
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm font-black text-foreground truncate max-w-[140px]">{user?.firstName} {user?.lastName}</p>
                      {/* ✅ Rôle traduit ici */}
                      <Badge variant="secondary" className="w-fit text-[9px] uppercase mt-1 px-2 py-0 h-4 font-black tracking-tighter">
                        {translateRole(user?.userType)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-1 space-y-1">
                    <DropdownMenuItem className="rounded-xl cursor-pointer py-3 font-bold gap-3 focus:bg-primary focus:text-white group" onClick={() => setIsProfileOpen(true)}>
                      <UserCircle className="text-primary group-focus:text-white" size={18} /> Gérer mon profil
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="opacity-50" />
                    {navItems.map(item => (
                      <Link key={item.href} href={item.href}>
                        <DropdownMenuItem className="rounded-xl cursor-pointer py-3 font-bold gap-3 focus:bg-primary focus:text-white group">
                          <item.icon className="text-primary group-focus:text-white" size={18} /> {item.label}
                        </DropdownMenuItem>
                      </Link>
                    ))}
                    <DropdownMenuSeparator className="opacity-50" />
                    <DropdownMenuItem onClick={logout} className="rounded-xl text-destructive cursor-pointer py-3 font-black gap-3 focus:bg-destructive focus:text-white group">
                      <LogOut className="group-focus:text-white" size={18} /> Déconnexion
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login"><Button className="bg-primary hover:bg-primary/90 text-white font-black rounded-xl px-6 h-9 text-xs uppercase tracking-widest">Connexion</Button></Link>
            )}
          </div>
        </div>
      </header>

      {/* 👤 PANNEAU DE PROFIL LATÉRAL */}
      <Sheet open={isProfileOpen} onOpenChange={(val) => { setIsProfileOpen(val); if(!val) setIsEditing(false); }}>
        <SheetContent className="sm:max-w-md bg-card border-l-border p-0 overflow-hidden flex flex-col shadow-2xl">
          <div className="bg-primary h-32 w-full relative shrink-0">
             <div className="absolute -bottom-10 left-8 w-20 h-20 rounded-2xl bg-card border-4 border-card flex items-center justify-center text-primary shadow-xl">
               <UserCircle size={48} />
             </div>
             <div className="absolute top-4 left-4 text-left p-4">
                <SheetHeader>
                  <SheetTitle className="text-white font-black tracking-tight uppercase text-lg">Mon Compte</SheetTitle>
                  <SheetDescription className="text-white/70 text-[10px] font-bold uppercase tracking-widest italic">ESI UNILU • Lubumbashi</SheetDescription>
                </SheetHeader>
             </div>
          </div>

          <div className="mt-14 px-8 flex-1 overflow-y-auto pb-10">
            <div className="flex justify-between items-center mb-8">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-foreground tracking-tight">{user?.firstName} {user?.lastName}</h3>
                {/* ✅ Rôle traduit ici aussi */}
                <p className="text-xs font-bold text-primary uppercase tracking-widest">{translateRole(user?.userType)}</p>
              </div>
              <Button size="icon" variant="ghost" className="rounded-full text-primary hover:bg-primary/10 shadow-sm" onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? <X size={20} /> : <Edit3 size={20} />}
              </Button>
            </div>

            {isEditing ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(data => updateProfileMutation.mutate(data))} className="space-y-5 animate-in fade-in slide-in-from-right-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField name="firstName" render={({field}) => <FormItem><FormLabel className="text-[10px] uppercase font-black text-muted-foreground">Prénom</FormLabel><Input {...field} className="bg-muted/30 border-none rounded-xl h-11" /></FormItem>} />
                    <FormField name="lastName" render={({field}) => <FormItem><FormLabel className="text-[10px] uppercase font-black text-muted-foreground">Nom</FormLabel><Input {...field} className="bg-muted/30 border-none rounded-xl h-11" /></FormItem>} />
                  </div>
                  <FormField name="phone" render={({field}) => <FormItem><FormLabel className="text-[10px] uppercase font-black text-muted-foreground">Téléphone</FormLabel><Input {...field} className="bg-muted/30 border-none rounded-xl h-11" /></FormItem>} />
                  <FormField name="location" render={({field}) => <FormItem><FormLabel className="text-[10px] uppercase font-black text-muted-foreground">Commune / Zone</FormLabel><Input {...field} className="bg-muted/30 border-none rounded-xl h-11" /></FormItem>} />
                  
                  <Button type="submit" className="w-full bg-primary font-black rounded-2xl h-14 shadow-lg shadow-primary/20 mt-4" disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <><Save size={18} className="mr-2"/> ENREGISTRER</>}
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
                <ProfileRow icon={<Mail size={16}/>} label="Identifiant Email" value={user?.email} />
                <ProfileRow icon={<Phone size={16}/>} label="Contact Téléphonique" value={user?.phone || "Non renseigné"} />
                <ProfileRow icon={<MapPin size={16}/>} label="Zone d'activité rurale" value={user?.location || "Lubumbashi"} />
                <ProfileRow icon={<Calendar size={16}/>} label="Date d'adhésion" value={user?.createdAt ? format(new Date(user.createdAt), 'dd MMMM yyyy', { locale: fr }) : "N/A"} />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function ProfileRow({ icon, label, value }: { icon: any, label: string, value?: string }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/40 border border-border/50 hover:bg-muted/60 transition-colors">
      <div className="p-2.5 bg-background rounded-xl text-primary shadow-sm">{icon}</div>
      <div className="flex flex-col">
        <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{label}</span>
        <span className="text-sm font-bold text-foreground truncate max-w-[200px]">{value}</span>
      </div>
    </div>
  );
}