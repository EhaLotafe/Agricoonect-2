// client/src/components/ui/BadgeFactory.tsx
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn, getFreshnessStatus, getCommuneColor } from '@/lib/utils';
import { Clock, ShieldCheck, User as UserIcon } from 'lucide-react';

/**
 * 🏷️ BadgeFactory : Centralisation de la signalétique visuelle.
 * Justification TFC : Garantir une sémantique visuelle cohérente pour faciliter 
 * la navigation des utilisateurs ruraux (HCI).
 */

// 1. Badge pour le type d'utilisateur (RBAC)
export const UserTypeBadge = ({ userType }: { userType: string }) => {
  const configs: Record<string, { label: string, className: string }> = {
    farmer: { label: "Producteur", className: "bg-primary text-white" },
    buyer: { label: "Acheteur", className: "bg-brand-orange text-white" },
    admin: { label: "Admin", className: "bg-slate-900 text-white" },
  };

  const config = configs[userType.toLowerCase()] || { label: userType, className: "bg-gray-500" };

  return (
    <Badge className={cn("gap-1 font-bold uppercase text-[10px]", config.className)}>
      <UserIcon size={10} /> {config.label}
    </Badge>
  );
};

// 2. Badge d'Approbation (Modération Admin)
export const ApprovalBadge = ({ isApproved }: { isApproved: boolean }) => {
  return (
    <Badge 
      variant={isApproved ? "default" : "outline"}
      className={cn(
        "gap-1 font-semibold",
        isApproved ? "bg-primary" : "text-brand-orange border-brand-orange"
      )}
    >
      {isApproved ? <ShieldCheck size={12} /> : null}
      {isApproved ? "Vérifié" : "En attente"}
    </Badge>
  );
};

// 3. Badge de Fraîcheur (Argument de Traçabilité du mémoire)
export const FreshnessBadge = ({ harvestDate }: { harvestDate?: string | Date }) => {
  const { label, color } = getFreshnessStatus(harvestDate);
  return (
    <Badge variant="secondary" className={cn("gap-1 py-1", color)}>
      <Clock size={12} /> {label}
    </Badge>
  );
};

// 4. Badge Commune (Ancrage Local Lubumbashi)
export const CommuneBadge = ({ commune }: { commune: string }) => {
  return (
    <Badge className={cn("border-none shadow-sm font-bold", getCommuneColor(commune))}>
      {commune}
    </Badge>
  );
};

// Export groupé pour une utilisation propre
export const BadgeFactory = {
  UserType: UserTypeBadge,
  Approval: ApprovalBadge,
  Freshness: FreshnessBadge,
  Commune: CommuneBadge
};