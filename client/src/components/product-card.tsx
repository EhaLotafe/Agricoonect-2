import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Clock, ShieldCheck, ArrowUpRight, Package } from "lucide-react";
import { Link } from "wouter";
import { ProductWithFarmer } from "@/lib/types";
import { formatCurrency, getFreshnessStatus, getCommuneColor, cn } from "@/lib/utils";

interface ProductCardProps {
  product: ProductWithFarmer;
}

export default function ProductCard({ product }: ProductCardProps) {
  // 🌿 Calcul de la fraîcheur (Point clé du mémoire)
  const freshness = getFreshnessStatus(product.harvestDate);

  // 🖼️ Gestion de l'URL de l'image
  // On vérifie si images est un tableau et s'il contient au moins un élément
  const imageUrl = Array.isArray(product.images) && product.images.length > 0 
    ? product.images[0] 
    : null;

  return (
    <Card className="group overflow-hidden border-border bg-card hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
      <CardContent className="p-0 relative">
        
        {/* 1. INDICATEUR DE FRAÎCHEUR (En haut à gauche) */}
        <div className="absolute top-3 left-3 z-20">
          <Badge className={cn(
            "shadow-lg flex gap-1.5 items-center backdrop-blur-md border-none px-3 py-1 text-[10px] font-black uppercase tracking-wider", 
            freshness.color.includes('primary') || freshness.color.includes('green') 
              ? "bg-green-600 text-white" 
              : "bg-white/90 text-slate-800"
          )}>
            <Clock size={12} className={cn(freshness.label.includes('aujourd') && "animate-pulse")} />
            {freshness.label}
          </Badge>
        </div>

        {/* 2. ZONE IMAGE AVEC DESIGN PREMIUM */}
        <div className="relative h-56 w-full overflow-hidden bg-muted">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/40 bg-slate-100 dark:bg-slate-800">
              <Package size={48} strokeWidth={1} />
              <span className="text-[10px] mt-2 font-bold uppercase tracking-widest text-center px-4">
                Image en attente
              </span>
            </div>
          )}
          
          {/* Overlay dégradé pour la lisibilité du prix */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
          
          {/* Prix affiché directement sur l'image (Style E-commerce moderne) */}
          <div className="absolute bottom-3 left-3 text-white">
            <p className="text-2xl font-black tracking-tighter">
              {formatCurrency(product.price)}
              <span className="text-xs font-normal opacity-80 ml-1">/ {product.unit}</span>
            </p>
          </div>
        </div>

        {/* 3. INFORMATIONS DU PRODUIT */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <Badge className={cn("text-[10px] font-black uppercase px-2 py-0 border-none shadow-sm", getCommuneColor(product.commune))}>
              {product.commune}
            </Badge>
            {product.isApproved && (
              <div className="flex items-center gap-1 text-primary" title="Vérifié par l'administration">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-bold uppercase tracking-tighter">Vérifié</span>
              </div>
            )}
          </div>

          <div>
            <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors truncate">
              {product.name}
            </h4>
            <div className="flex items-center text-muted-foreground text-[11px] mt-1 italic">
              <MapPin size={12} className="mr-1 text-primary" />
              <span className="truncate">{product.location}</span>
            </div>
          </div>

          {/* 4. NOTATION & ACTION FINALE */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="flex flex-col">
              <div className="flex items-center gap-0.5 text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={12} 
                    fill={i < Math.floor(product.averageRating || 0) ? "currentColor" : "none"}
                    className={cn(i >= Math.floor(product.averageRating || 0) && "text-muted-foreground/30")}
                  />
                ))}
              </div>
              <span className="text-[9px] font-bold text-muted-foreground mt-1 uppercase tracking-tighter">
                {product.reviewCount || 0} avis clients
              </span>
            </div>

            <Link href={`/products/${product.id}`}>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white rounded-xl px-4 shadow-md transition-all active:scale-95 flex gap-2 font-bold text-xs uppercase">
                Détails <ArrowUpRight size={14} />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}