import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Heart, MapPin } from "lucide-react";
import type { Pet } from "../backend";

interface PetCardProps {
  pet: Pet;
  index?: number;
}

export default function PetCard({ pet, index = 1 }: PetCardProps) {
  const photoUrl = pet.photoBlobs?.[0]?.getDirectURL?.();

  return (
    <Link
      to="/pets/$id"
      params={{ id: pet.id }}
      data-ocid={`pets.item.${index}`}
    >
      <div className="group bg-card rounded-2xl overflow-hidden border border-border pet-card-hover cursor-pointer h-full flex flex-col">
        {/* Photo */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={pet.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-pink-soft">
              <span className="text-5xl select-none">🐾</span>
            </div>
          )}
          {/* Adopted badge overlay */}
          {pet.isAdopted && (
            <div className="absolute inset-0 bg-foreground/20 flex items-center justify-center">
              <Badge className="bg-foreground/80 text-background text-sm px-3 py-1 rounded-full font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Adopted
              </Badge>
            </div>
          )}
          {!pet.isAdopted && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-primary/90 text-primary-foreground text-xs px-2 py-0.5 rounded-full font-medium">
                <Heart className="h-3 w-3 mr-1" />
                Available
              </Badge>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col gap-2 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-semibold text-lg text-foreground leading-tight truncate">
              {pet.name}
            </h3>
            <span className="text-xs text-muted-foreground shrink-0 mt-0.5 bg-muted rounded-full px-2 py-0.5">
              {pet.species}
            </span>
          </div>

          {pet.breed && (
            <p className="text-sm text-muted-foreground truncate">
              {pet.breed}
            </p>
          )}

          {pet.location && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{pet.location}</span>
            </div>
          )}

          {pet.tags && pet.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-auto pt-1">
              {pet.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-lavender-soft text-secondary-foreground rounded-full px-2 py-0.5"
                >
                  {tag}
                </span>
              ))}
              {pet.tags.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{pet.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
