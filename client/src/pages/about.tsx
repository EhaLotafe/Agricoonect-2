// client/src/pages/about.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sprout, ShieldCheck, Users, Globe, Zap, Database, Smartphone, BarChart3 } from "lucide-react";

/**
 * Page À Propos : Présentation de la vision et du cadre académique.
 * Justification TFC : Documente la mission sociale et les technologies de résilience.
 */
export default function About() {
  return (
    <div className="container mx-auto px-4 py-16 space-y-20 animate-in fade-in duration-700">
      
      {/* SECTION 1 : VISION & POSITIONNEMENT GÉOGRAPHIQUE */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <h1 className="text-5xl font-black text-slate-900 dark:text-white leading-tight">
          L'Agriculture connectée au <span className="text-primary italic">Haut-Katanga</span>.
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Agri-Connect est un Système d'Information de marketing numérique conçu pour briser l'asymétrie 
          d'information entre les zones de production rurale et la ville de Lubumbashi.
        </p>
      </div>

      {/* SECTION 2 : PILIERS MÉTHODOLOGIQUES ET TECHNIQUES */}
      <div className="grid md:grid-cols-3 gap-8">
        <PilierCard 
          icon={<BarChart3 className="text-primary" />}
          title="Analyse Quantitative"
          desc="Transformation des intentions d'achat recueillies par sondages en indicateurs de prix et de volumes pour les agriculteurs."
        />
        <PilierCard 
          icon={<Zap className="text-orange-500" />}
          title="Résilience Offline"
          desc="Architecture logicielle adaptée aux contraintes de connectivité (EDGE/3G) des communes de l'Annexe et Kipushi."
        />
        <PilierCard 
          icon={<ShieldCheck className="text-blue-600" />}
          title="Confiance & Traçabilité"
          desc="Valorisation de la production locale par la preuve de fraîcheur et la certification administrative des annonces."
        />
      </div>

      {/* SECTION 3 : CADRE ACADÉMIQUE (VITAL POUR LA SOUTENANCE) */}
      <Card className="bg-slate-950 text-white overflow-hidden border-none shadow-2xl rounded-[2.5rem]">
        <div className="md:flex">
          <div className="md:w-1/3 bg-primary p-12 flex flex-col justify-center items-center text-center space-y-4">
            <Globe size={64} className="text-white opacity-40 animate-pulse" />
            <h3 className="text-2xl font-black uppercase tracking-tighter">Travail de Fin de Cycle</h3>
            <p className="text-sm font-bold opacity-80 uppercase tracking-widest">Édition 2024-2025</p>
          </div>
          <div className="md:w-2/3 p-10 space-y-6 flex flex-col justify-center">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-primary">Auteurs & Institution</h2>
            <div className="space-y-4 text-slate-300">
              <p className="leading-relaxed">
                Ce projet a été réalisé par <span className="text-white font-black italic">LOTAFE EFOSO Manassé</span> et 
                <span className="text-white font-black italic"> KIKOMBE MUYUMBA Moïse</span> dans le cadre de l'obtention du diplôme de bachelier 
                en Sciences Informatiques à la Faculté des Sciences et Technologies (**UNILU**).
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4 pt-6 border-t border-slate-800">
              <TechBadge icon={<Database size={12}/>} label="PostgreSQL / Supabase" />
              <TechBadge icon={<Smartphone size={12}/>} label="React (TypeScript)" />
              <TechBadge icon={<Users size={12}/>} label="Méthodologie Agile Scrum" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
/**
 * Sous-composant de présentation des piliers du projet
 */
function PilierCard({ icon, title, desc }: any) {
  return (
    <Card className="border-none shadow-sm hover:shadow-lg transition-all duration-300 bg-slate-50 dark:bg-slate-900 p-2 rounded-3xl">
      <CardContent className="pt-8 space-y-4 text-center">
        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-md mx-auto transform -rotate-2">
          {icon}
        </div>
        <h3 className="text-xl font-black uppercase tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
  );
}
/**
 * Badge technique pour le rappel de la stack logicielle
 */
function TechBadge({ icon, label }: any) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-xl border border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-300 shadow-inner">
      {icon} {label}
    </div>
  );
}