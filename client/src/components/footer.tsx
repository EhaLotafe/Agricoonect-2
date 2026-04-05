// client/src/components/footer.tsx
import { Sprout, Facebook, MapPin, MessageSquare, Globe, WifiOff, ShoppingBag, LayoutDashboard, UserPlus, Phone } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";

/**
 * Composant Footer : Dynamique et Adaptatif (RBAC & Contextuel)
 * Justification TFC : Optimise la charge cognitive en ne montrant que les liens pertinents.
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();

  // 🛡️ 1. LOGIQUE D'AFFICHAGE CONTEXTUELLE
  // On cache le footer sur les pages d'authentification pour focaliser l'attention de l'utilisateur
  const hiddenRoutes = ["/login", "/register"];
  if (hiddenRoutes.includes(location)) return null;

  return (
    <footer className="bg-slate-50 dark:bg-slate-950 text-foreground pt-16 pb-8 border-t-4 border-primary transition-colors duration-300">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        
        {/* Colonne 1 : Vision & Innovation */}
        <div className="space-y-5">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
              <Sprout className="text-white" size={28} />
            </div>
            <div>
              <h4 className="text-2xl font-black tracking-tighter uppercase leading-none">Agri-Connect</h4>
              <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">Haut-Katanga • RDC</p>
            </div>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Pionnier du <span className="text-foreground font-bold">Circuit Court Digital</span> à Lubumbashi. 
            Désenclavement des producteurs ruraux via technologie <span className="text-foreground font-bold italic">Offline-First</span>.
          </p>
          <div className="flex space-x-3">
            <SocialLink icon={<Facebook size={18} />} />
            <SocialLink icon={<MessageSquare size={18} />} />
          </div>
        </div>

        {/* Colonne 2 : Navigation Marketplace (DYNAMIQUE SELON LE RÔLE) */}
        <div>
          <h5 className="font-black text-sm uppercase tracking-widest mb-6 text-primary underline underline-offset-8 decoration-2">Explorer</h5>
          <ul className="space-y-4 text-muted-foreground text-sm">
            <FooterLink href="/products" label="Catalogue des récoltes" icon={<ShoppingBag size={14}/>} />
            
            {/* ✅ Affichage conditionnel basé sur le rôle (RBAC) */}
            {!isAuthenticated && (
              <FooterLink href="/register" label="Devenir Producteur" icon={<UserPlus size={14}/>} />
            )}
            
            {user?.userType === 'farmer' && (
              <FooterLink href="/farmer/dashboard" label="Mon Dashboard" icon={<LayoutDashboard size={14}/>} />
            )}
            
            {user?.userType === 'buyer' && (
              <FooterLink href="/buyer/dashboard" label="Suivi de mes achats" icon={<LayoutDashboard size={14}/>} />
            )}

            <FooterLink href="/about" label="Notre Mission" icon={<Globe size={14}/>} />
          </ul>
        </div>

        {/* Colonne 3 : Accessibilité & SI */}
        <div>
          <h5 className="font-black text-sm uppercase tracking-widest mb-6 text-primary underline underline-offset-8 decoration-2">Accessibilité</h5>
          <ul className="space-y-4 text-muted-foreground text-sm">
            <li className="flex items-start gap-3">
              <MapPin size={18} className="text-primary shrink-0" />
              <span>Avenue Route Kasapa, Lubumbashi</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={18} className="text-primary shrink-0" />
              <span>+243 990 918 934</span>
            </li>
            <li className="flex items-center gap-3 italic">
              <WifiOff size={16} className="text-primary" />
              <span className="text-xs">Optimisé pour zones à faible débit</span>
            </li>
            <li className="pt-2">
              <div className="bg-primary/10 border border-primary/20 px-3 py-1 rounded-lg w-fit">
                <span className="text-[10px] font-mono font-bold text-primary tracking-widest uppercase">Version SI: 2025.1-PROD</span>
              </div>
            </li>
          </ul>
        </div>

        {/* Colonne 4 : Alertes Récoltes */}
        <div>
          <h5 className="font-black text-sm uppercase tracking-widest mb-6 text-primary underline underline-offset-8 decoration-2">Alertes</h5>
          <p className="text-muted-foreground text-sm mb-4 italic leading-snug">
            Recevez les arrivages frais des communes rurales en priorité.
          </p>
          <div className="space-y-2">
            <Input 
              type="email" 
              placeholder="votre@email.cd" 
              className="bg-background border-border h-11 rounded-xl"
            />
            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-black h-11 shadow-md rounded-xl transition-transform active:scale-95">
              S'ABONNER
            </Button>
          </div>
        </div>
      </div>

      {/* Copyright & Mentions SI */}
      <div className="container mx-auto px-4 border-t border-border mt-16 pt-8 flex flex-col items-center text-center">
        <p className="text-muted-foreground text-[11px] max-w-2xl">
          &copy; {currentYear} <span className="font-bold text-foreground italic">AGRI-CONNECT MARKETPLACE</span>. 
          Architecture logicielle conçue pour la modernisation de l'agriculture locale (Haut-Katanga).
        </p>
        <p className="text-[9px] uppercase tracking-[0.3em] text-primary font-bold mt-4 opacity-50">
          "Réduire la fracture numérique par l'intelligence marketing"
        </p>
      </div>
    </footer>
  );
}

/**
 * Sous-composants pour la cohérence et la performance
 */
function SocialLink({ icon }: { icon: React.ReactNode }) {
  return (
    <a href="#" className="p-2.5 bg-muted rounded-xl hover:bg-primary hover:text-white transition-all duration-300 shadow-sm border border-transparent hover:border-primary/20">
      {icon}
    </a>
  );
}

function FooterLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="hover:text-primary flex items-center gap-2 hover:translate-x-1 transition-all inline-block cursor-pointer font-medium">
        <span className="text-primary/50">{icon}</span> {label}
      </Link>
    </li>
  );
}