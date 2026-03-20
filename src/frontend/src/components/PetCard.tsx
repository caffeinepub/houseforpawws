import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Heart, MapPin } from "lucide-react";
import { useState } from "react";
import type { Pet } from "../backend";

interface PetCardProps {
  pet: Pet;
  index?: number;
}

export default function PetCard({ pet, index = 1 }: PetCardProps) {
  const photoUrl = pet.photoBlobs?.[0]?.getDirectURL?.();
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);

  const handleClick = () => {
    setShowWarning(true);
  };

  const handleContinue = () => {
    setShowWarning(false);
    navigate({ to: "/pets/$id", params: { id: pet.id } });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        data-ocid={`pets.item.${index}`}
        className="cursor-pointer h-full w-full text-left"
      >
        <div className="group bg-card rounded-2xl overflow-hidden border border-border/60 pet-card-hover cursor-pointer h-full flex flex-col hover:border-primary/40 hover:shadow-paw transition-all duration-200">
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
            {/* Gradient overlay at bottom of photo */}
            <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
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
                <span className="text-xs opacity-40 mr-0.5">🐾</span>
                {pet.name}
              </h3>
              <span className="text-xs text-primary shrink-0 mt-0.5 bg-pink-soft rounded-full px-2 py-0.5 font-medium">
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
      </button>

      {/* Beware of Breeders warning dialog */}
      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent
          className="rounded-2xl max-w-sm"
          data-ocid="breeder_warning.dialog"
        >
          <DialogHeader>
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
                <AlertTriangle className="h-7 w-7 text-amber-500" />
              </div>
            </div>
            <DialogTitle className="font-display text-center text-xl">
              Beware of Breeders
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2 text-center px-1">
            <p>
              Please make sure you are adopting from a genuine rescue or
              individual owner —{" "}
              <strong className="text-foreground">
                not a breeder or pet shop
              </strong>
              .
            </p>
            <p>
              Legitimate adopters will never ask you to pay for a pet or
              pressure you into a quick decision. If something feels off, trust
              your instincts and report the listing.
            </p>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleContinue}
              data-ocid="breeder_warning.continue_button"
            >
              I Understand — View Listing
            </Button>
            <Button
              variant="ghost"
              className="w-full rounded-full text-muted-foreground"
              onClick={() => setShowWarning(false)}
              data-ocid="breeder_warning.cancel_button"
            >
              Go Back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
