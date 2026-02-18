// client/src/components/footer.tsx
import { Sprout, Facebook, Mail, Phone, Twitter, MapPin, MessageSquare, Globe, WifiOff } from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-50 dark:bg-slate-950 text-foreground pt-16 pb-8 border-t-4 border-primary transition-colors duration-300">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        
        {/* Colonne 1 : Vision & Innovation (Le cœur du mémoire) */}
        <div className="space-y-5">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
              <Sprout className="text-white" size={28} />
            </div>
            <div>
              <h4 className="text-2xl font-black tracking-tighter">Agri-Connect</h4>
              <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">Haut-Katanga • RDC</p>
            </div>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Pionnier du <span className="text-foreground font-bold">Circuit Court Digital</span> à Lubumbashi. 
            Nous désenclavons les producteurs de l'Annexe, Kipushi et Ruashi grâce à une technologie 
            <span className="text-foreground font-bold italic"> Offline-First</span>.
          </p>
          <div className="flex space-x-3">
            <SocialLink icon={<Facebook size={18} />} />
            <SocialLink icon={<Twitter size={18} />} />
            <SocialLink icon={<MessageSquare size={18} />} />
          </div>
        </div>

        {/* Colonne 2 : Navigation Marketplace */}
        <div>
          <h5 className="font-black text-sm uppercase tracking-widest mb-6 text-primary">Marketplace</h5>
          <ul className="space-y-4 text-muted-foreground text-sm">
            <FooterLink href="/products" label="🛒 Catalogue des récoltes" />
            <FooterLink href="/register" label="👨‍🌾 Espace Producteurs" />
            <FooterLink href="/about" label="📖 Notre Mission Sociale" />
            <FooterLink href="/faq" label="❓ Centre d'aide" />
          </ul>
        </div>

        {/* Colonne 3 : Accessibilité Rurale (Argument USSD) */}
        <div>
          <h5 className="font-black text-sm uppercase tracking-widest mb-6 text-primary">Accessibilité</h5>
          <ul className="space-y-4 text-muted-foreground text-sm">
            <li className="flex items-start gap-3">
              <MapPin size={18} className="text-primary shrink-0" />
              <span>Avenue Route Kasapa, Lubumbashi</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={18} className="text-primary shrink-0" />
              <span>+243 990 918 934</span>
            </li>
            <li className="flex items-center gap-3">
              <Globe size={18} className="text-primary shrink-0" />
              <div className="bg-primary/10 border border-primary/20 px-3 py-1 rounded-lg">
                <span className="text-xs font-mono font-bold text-primary tracking-widest">USSD: *123*2025#(A implementer)</span>
              </div>
            </li>
            <li className="flex items-center gap-3 italic">
              <WifiOff size={16} className="text-brand-orange" />
              <span className="text-xs">Compatible zones blanches</span>
            </li>
          </ul>
        </div>

        {/* Colonne 4 : Alertes Récoltes (Newsletter) */}
        <div>
          <h5 className="font-black text-sm uppercase tracking-widest mb-6 text-primary">Alertes Récoltes</h5>
          <p className="text-muted-foreground text-sm mb-4 italic">
            Recevez les arrivages frais des communes rurales en priorité.
          </p>
          <div className="space-y-2">
            <Input 
              type="email" 
              placeholder="Votre e-mail..." 
              className="bg-background border-border focus:ring-primary h-11"
            />
            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-black h-11 shadow-md">
              S'ABONNER
            </Button>
          </div>
        </div>
      </div>

      {/* FOOTER BAS : Mentions Académiques */}
      <div className="container mx-auto px-4 border-t border-border mt-16 pt-8 flex flex-col items-center">
        <p className="text-muted-foreground text-[11px] text-center max-w-2xl">
          &copy; {currentYear} <span className="font-bold text-foreground">Agri-Connect Marketplace</span>. 
          Développé à Lubumbashi pour la modernisation de l'agriculture locale.
        </p>
        <p className="text-[9px] uppercase tracking-[0.3em] text-primary font-bold mt-4 opacity-70">
          "Réduire la fracture numérique au service de la sécurité alimentaire"
        </p>
      </div>
    </footer>
  );
}

// --- Petits composants pour éviter la répétition (Performance) ---

function SocialLink({ icon }: { icon: React.ReactNode }) {
  return (
    <a href="#" className="p-2.5 bg-muted rounded-xl hover:bg-primary hover:text-white transition-all duration-300 shadow-sm">
      {icon}
    </a>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link href={href} className="hover:text-primary hover:translate-x-1 transition-all inline-block cursor-pointer">
        {label}
      </Link>
    </li>
  );
}