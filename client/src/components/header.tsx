// client/src/components/header.tsx
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { 
  Sprout, Menu, User, ShoppingBasket, Tractor, 
  Settings, Moon, Sun, Home, Package, LogOut, 
  Mail, MapPin, Phone, Calendar, UserCircle, Edit3, Save, X, WifiOff, Loader2,
  ChevronDown, Info 
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
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const NAV_CONFIG = {
  public: [{ href: "/", label: "Accueil", icon: Home }, { href: "/products", label: "Marché", icon: Package }, { href: "/about", label: "À propos", icon: Info }],
  farmer: [{ href: "/", label: "Accueil", icon: Home }, { href: "/farmer/dashboard", label: "Tableau de Bord", icon: Tractor }],
  buyer: [{ href: "/", label: "Accueil", icon: Home }, { href: "/buyer/dashboard", label: "Mes Achats", icon: ShoppingBasket }],
  admin: [{ href: "/", label: "Accueil", icon: Home }, { href: "/panel/dashboard", label: "Supervision", icon: Settings }],
};

const translateRole = (role?: string) => {
  const roles: Record<string, string> = {
    farmer: "Producteur Agricole",
    buyer: "Acheteur Urbain",
    admin: "Administrateur SI",
  };
  return role ? (roles[role.toLowerCase()] || role) : "";
};

export default function Header() {
  const { user, logout, isAuthenticated, login } = useAuth();
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isOnline = useIsOnline();
  const { toast } = useToast();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 🛡️ MASQUAGE DU HEADER (Innovation UX)
  const hideHeaderRoutes = ["/login", "/register"];
  if (hideHeaderRoutes.includes(location)) return null;

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
      <header className="bg-background/80 backdrop-blur-xl sticky top-0 z-50 w-full border-b border-border/50 shadow-sm transition-all duration-300">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* LOGO SECTION */}
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer group">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:rotate-6">
                <Sprout size={22} />
              </div>
              <div className="hidden sm:block leading-none">
                <h1 className="text-lg font-black tracking-tighter uppercase text-foreground">Agri-Connect</h1>
                <p className="text-[8px] uppercase tracking-[0.3em] text-primary font-black">Haut-Katanga • RDC</p>
              </div>
            </div>
          </Link>

          {/* ACTIONS SECTION */}
          <div className="flex items-center space-x-3">
            {!isOnline && (
              <Badge variant="destructive" className="hidden md:flex animate-pulse gap-1 px-3 py-1 rounded-full text-[9px] font-black">
                <WifiOff size={12} /> HORS-LIGNE
              </Badge>
            )}

            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full h-9 w-9 hover:bg-primary/10 transition-colors">
              {theme === "light" ? <Moon size={18} className="text-slate-600" /> : <Sun size={18} className="text-yellow-400" />}
            </Button>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 flex items-center gap-2 pl-2 pr-1 rounded-full bg-muted/40 border border-transparent hover:border-primary/20 transition-all">
                    <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center text-white text-[10px] font-black">
                      {user?.firstName[0]}{user?.lastName[0]}
                    </div>
                    <span className="hidden sm:inline text-xs font-bold text-foreground">{user?.firstName}</span>
                    <ChevronDown size={14} className="text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent align="end" className="w-64 mt-2 rounded-[1.5rem] p-2 shadow-2xl border-border/50 bg-popover/95 backdrop-blur-md">
                  <div className="p-4 mb-2 rounded-2xl bg-muted/50 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-black">
                      {user?.firstName[0]}
                    </div>
                    <div className="flex flex-col truncate">
                      <p className="text-xs font-black truncate text-foreground">{user?.firstName} {user?.lastName}</p>
                      <span className="text-[9px] font-bold text-primary uppercase tracking-widest">{translateRole(user?.userType)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <DropdownMenuItem className="rounded-xl cursor-pointer py-2.5 font-bold gap-3 focus:bg-primary focus:text-white" onClick={() => setIsProfileOpen(true)}>
                      <UserCircle size={18} /> Gérer mon compte
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {navItems.map(item => (
                      <Link key={item.href} href={item.href}>
                        <DropdownMenuItem className="rounded-xl cursor-pointer py-2.5 font-bold gap-3 focus:bg-primary focus:text-white">
                          <item.icon size={18} /> {item.label}
                        </DropdownMenuItem>
                      </Link>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="rounded-xl text-destructive cursor-pointer py-2.5 font-black gap-3 focus:bg-destructive focus:text-white">
                      <LogOut size={18} /> Déconnexion
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                 <Link href="/login">
                    <Button variant="ghost" className="text-xs font-black uppercase tracking-widest hover:text-primary rounded-xl">Connexion</Button>
                 </Link>
                 <Link href="/register">
                    <Button className="bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl px-5 shadow-lg shadow-primary/20">S'inscrire</Button>
                 </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 👤 PANNEAU PROFIL (S'ADAPTE AU DESIGN DES PAGES LOGIN) */}
      <Sheet open={isProfileOpen} onOpenChange={(val) => { setIsProfileOpen(val); if(!val) setIsEditing(false); }}>
        <SheetContent className="sm:max-w-md bg-card p-0 flex flex-col shadow-2xl border-l-border/50">
          <div className="bg-slate-950 h-32 w-full relative shrink-0">
             <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-transparent opacity-50" />
             <div className="absolute -bottom-10 left-8 w-20 h-20 rounded-2xl bg-card border-4 border-card flex items-center justify-center text-primary shadow-xl">
               <UserCircle size={48} />
             </div>
             <div className="absolute top-6 left-6">
                <SheetHeader className="text-left">
                  <SheetTitle className="text-white font-black uppercase tracking-tighter text-xl">Mon Profil</SheetTitle>
                  <SheetDescription className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Identité sur le Système</SheetDescription>
                </SheetHeader>
             </div>
          </div>

          <div className="mt-14 px-8 flex-1 overflow-y-auto pb-10">
            <div className="flex justify-between items-center mb-8">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-foreground tracking-tighter">{user?.firstName} {user?.lastName}</h3>
                <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase tracking-widest">
                  {translateRole(user?.userType)}
                </Badge>
              </div>
              <Button size="icon" variant="ghost" className="rounded-full text-primary hover:bg-primary/10 transition-all shadow-sm" onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? <X size={20} /> : <Edit3 size={20} />}
              </Button>
            </div>

            {isEditing ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(data => updateProfileMutation.mutate(data))} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField name="firstName" render={({field}) => <FormItem><FormLabel className="text-[10px] uppercase font-black opacity-50 ml-1">Prénom</FormLabel><Input {...field} className="h-12 bg-muted/30 border-none rounded-xl font-medium" /></FormItem>} />
                    <FormField name="lastName" render={({field}) => <FormItem><FormLabel className="text-[10px] uppercase font-black opacity-50 ml-1">Nom</FormLabel><Input {...field} className="h-12 bg-muted/30 border-none rounded-xl font-medium" /></FormItem>} />
                  </div>
                  <FormField name="phone" render={({field}) => <FormItem><FormLabel className="text-[10px] uppercase font-black opacity-50 ml-1">Téléphone</FormLabel><Input {...field} className="h-12 bg-muted/30 border-none rounded-xl font-medium" /></FormItem>} />
                  <FormField name="location" render={({field}) => <FormItem><FormLabel className="text-[10px] uppercase font-black opacity-50 ml-1">Commune / Zone</FormLabel><Input {...field} className="h-12 bg-muted/30 border-none rounded-xl font-medium" /></FormItem>} />
                  
                  <Button type="submit" className="w-full bg-primary font-black rounded-2xl h-14 shadow-xl shadow-primary/20 mt-4 uppercase tracking-widest text-xs" disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <><Save size={18} className="mr-2"/> Enregistrer les modifications</>}
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                <ProfileRow icon={<Mail size={16}/>} label="Email" value={user?.email} />
                <ProfileRow icon={<Phone size={16}/>} label="Téléphone" value={user?.phone || "Non renseigné"} />
                <ProfileRow icon={<MapPin size={16}/>} label="Localisation" value={user?.location || "Lubumbashi"} />
                <ProfileRow icon={<Calendar size={16}/>} label="Adhésion" value={user?.createdAt ? format(new Date(user.createdAt), 'dd MMMM yyyy', { locale: fr }) : "N/A"} />
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
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors">
      <div className="p-2.5 bg-background rounded-xl text-primary shadow-sm">{icon}</div>
      <div className="flex flex-col">
        <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{label}</span>
        <span className="text-sm font-bold text-foreground truncate max-w-[200px]">{value}</span>
      </div>
    </div>
  );
}