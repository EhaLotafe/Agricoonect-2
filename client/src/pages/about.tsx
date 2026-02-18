// client/src/pages/about.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sprout, ShieldCheck, Users, Globe, Zap, Database, Smartphone } from "lucide-react";

export default function About() {
  return (
    <div className="container mx-auto px-4 py-16 space-y-20 animate-in fade-in duration-700">
      
      {/* SECTION 1 : VISION GÉNÉRALE */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <Badge variant="outline" className="text-primary border-primary/30 px-4 py-1 uppercase tracking-tighter font-black">
          Innovation Numérique Rurale
        </Badge>
        <h1 className="text-5xl font-black text-slate-900 leading-tight">
          L'Agriculture, connectée à l'avenir du <span className="text-primary text-primary">Haut-Katanga</span>.
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Agri-Connect est une plateforme de marketing numérique conçue pour briser l'isolement des producteurs ruraux 
          et structurer l'approvisionnement alimentaire de la ville de Lubumbashi.
        </p>
      </div>

      {/* SECTION 2 : NOS PILIERS (Lien direct avec le Mémoire) */}
      <div className="grid md:grid-cols-3 gap-8">
        <PilierCard 
          icon={<Sprout className="text-primary" />}
          title="Mission Sociale"
          desc="Réduire la fracture numérique en offrant un canal de vente directe aux producteurs de la Commune Annexe, Kipushi et Ruashi."
        />
        <PilierCard 
          icon={<Zap className="text-brand-orange" />}
          title="Mode Hors-Ligne"
          desc="Une architecture résiliente permettant la publication de produits même sans couverture réseau 3G/4G immédiate."
        />
        <PilierCard 
          icon={<ShieldCheck className="text-blue-600" />}
          title="Traçabilité"
          desc="Un système de badges garantissant l'origine locale et la fraîcheur des produits pour rassurer le consommateur urbain."
        />
      </div>

      {/* SECTION 3 : CONTEXTE ACADÉMIQUE (VITAL POUR TA SOUTENANCE) */}
      <Card className="bg-slate-900 text-white overflow-hidden border-none shadow-2xl">
        <div className="md:flex">
          <div className="md:w-1/3 bg-primary p-12 flex flex-col justify-center items-center text-center space-y-4">
            <Globe size={64} className="opacity-50" />
            <h3 className="text-2xl font-bold">Travail de Fin de Cycle</h3>
            <p className="text-sm text-primary-foreground/80">Édition 2024-2025</p>
          </div>
          <div className="md:w-2/3 p-10 space-y-6">
            <h2 className="text-2xl font-bold">Cadre de Développement</h2>
            <p className="text-slate-400">
              Ce projet a été réalisé par <span className="text-white font-bold">LOTAFE EFOSO Manassé</span> et 
              <span className="text-white font-bold"> KIKOMBE MUYUMBA Moïse</span> dans le cadre de l'obtention du diplôme de bachelier 
              en Sciences Informatiques à l'École Supérieure d'Informatique (**ESI - UNILU**).
            </p>
            <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-800">
              <TechBadge icon={<Database size={12}/>} label="PostgreSQL / Supabase" />
              <TechBadge icon={<Smartphone size={12}/>} label="React.js (TypeScript)" />
              <TechBadge icon={<Users size={12}/>} label="Architecture 3-Tiers" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// --- SOUS-COMPOSANTS ---
function PilierCard({ icon, title, desc }: any) {
  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-slate-50 dark:bg-slate-900">
      <CardContent className="pt-8 space-y-4">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm">
          {icon}
        </div>
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
  );
}

function TechBadge({ icon, label }: any) {
  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700 text-[10px] font-bold uppercase tracking-widest text-slate-300">
      {icon} {label}
    </div>
  );
}