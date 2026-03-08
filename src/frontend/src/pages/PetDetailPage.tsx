import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit,
  Heart,
  Loader2,
  MapPin,
  Scale,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useDeletePet,
  useGetPet,
  useGetUserProfile,
  useStartOrGetConversation,
} from "../hooks/useQueries";
import { useSendMessage } from "../hooks/useQueries";

export default function PetDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: pet, isLoading } = useGetPet(id);
  const { data: ownerProfile } = useGetUserProfile(pet?.ownerId?.toString());
  const { mutateAsync: deletePet, isPending: isDeleting } = useDeletePet();
  const { mutateAsync: startConversation, isPending: isStartingConv } =
    useStartOrGetConversation();
  const { mutateAsync: sendMessage, isPending: isSendingMsg } =
    useSendMessage();
  const queryClient = useQueryClient();

  const [photoIndex, setPhotoIndex] = useState(0);

  const isOwner =
    identity &&
    pet &&
    identity.getPrincipal().toString() === pet.ownerId.toString();
  const isApplying = isStartingConv || isSendingMsg;

  const handleDelete = async () => {
    try {
      await deletePet(id);
      toast.success("Pet listing deleted.");
      navigate({ to: "/" });
    } catch {
      toast.error("Failed to delete listing.");
    }
  };

  const handleApplyToAdopt = async () => {
    if (!identity || !pet) return;
    try {
      const convId = await startConversation(pet.ownerId.toString());
      await sendMessage({
        conversationId: convId,
        text: `Hi! I'd like to apply to adopt ${pet.name}. Is ${pet.name} still available?`,
      });
      queryClient.invalidateQueries({ queryKey: ["myConversations"] });
      toast.success("Message sent! Check your inbox.");
      navigate({
        to: "/inbox/$conversationId",
        params: { conversationId: convId },
      });
    } catch {
      toast.error("Failed to send adoption request.");
    }
  };

  const photos = pet?.photoBlobs ?? [];
  const currentPhotoUrl = photos[photoIndex]?.getDirectURL?.();

  if (isLoading) {
    return (
      <div
        className="container py-10 max-w-5xl"
        data-ocid="pet_detail.loading_state"
      >
        <Skeleton className="h-8 w-32 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div
        className="container py-20 text-center"
        data-ocid="pet_detail.error_state"
      >
        <div className="text-5xl mb-4">🐾</div>
        <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
          Pet not found
        </h2>
        <p className="text-muted-foreground mb-6">
          This listing may have been removed.
        </p>
        <Link to="/">
          <Button className="rounded-full" data-ocid="pet_detail.back.button">
            Back to Browse
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-5xl">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ to: "/" })}
        className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
        data-ocid="pet_detail.back.button"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Browse
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Photo Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
            {currentPhotoUrl ? (
              <img
                src={currentPhotoUrl}
                alt={pet.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-pink-soft">
                <span className="text-8xl">🐾</span>
              </div>
            )}
            {pet.isAdopted && (
              <div className="absolute inset-0 bg-foreground/20 flex items-center justify-center">
                <Badge className="bg-foreground/80 text-background text-lg px-4 py-1.5 rounded-full font-semibold">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Adopted
                </Badge>
              </div>
            )}
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setPhotoIndex((i) => Math.max(0, i - 1))}
                  disabled={photoIndex === 0}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-card/80 flex items-center justify-center shadow-md disabled:opacity-30"
                  data-ocid="pet_detail.photo.prev.button"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPhotoIndex((i) => Math.min(photos.length - 1, i + 1))
                  }
                  disabled={photoIndex === photos.length - 1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-card/80 flex items-center justify-center shadow-md disabled:opacity-30"
                  data-ocid="pet_detail.photo.next.button"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {photos.map((blob, i) => (
                <button
                  type="button"
                  key={`thumb-photo-${blob.getDirectURL?.() ?? i}`}
                  onClick={() => setPhotoIndex(i)}
                  className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${i === photoIndex ? "border-primary" : "border-transparent"}`}
                  data-ocid={`pet_detail.photo.thumbnail.${i + 1}`}
                >
                  <img
                    src={blob.getDirectURL?.()}
                    alt={`View angle ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge
                className={
                  pet.isAdopted
                    ? "bg-muted text-muted-foreground rounded-full"
                    : "bg-primary/15 text-primary border-0 rounded-full"
                }
              >
                {pet.isAdopted ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Adopted
                  </>
                ) : (
                  <>
                    <Heart className="h-3 w-3 mr-1" />
                    Available
                  </>
                )}
              </Badge>
              <Badge variant="outline" className="rounded-full text-xs">
                {pet.species}
              </Badge>
            </div>
            <h1 className="font-display text-4xl font-bold text-foreground">
              {pet.name}
            </h1>
            {pet.breed && (
              <p className="text-lg text-muted-foreground mt-1">{pet.breed}</p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            {pet.age && (
              <div className="bg-pink-soft rounded-xl p-3 text-center">
                <Calendar className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Age</p>
                <p className="text-sm font-semibold text-foreground">
                  {pet.age}
                </p>
              </div>
            )}
            {pet.size && (
              <div className="bg-lavender-soft rounded-xl p-3 text-center">
                <Scale className="h-4 w-4 text-secondary-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Size</p>
                <p className="text-sm font-semibold text-foreground">
                  {pet.size}
                </p>
              </div>
            )}
            {pet.healthStatus && (
              <div className="bg-peach-soft rounded-xl p-3 text-center">
                <Activity className="h-4 w-4 text-accent-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Health</p>
                <p className="text-sm font-semibold text-foreground truncate">
                  {pet.healthStatus}
                </p>
              </div>
            )}
          </div>

          {pet.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              {pet.location}
            </div>
          )}

          {pet.description && (
            <div>
              <h3 className="font-semibold text-sm text-foreground mb-2">
                About {pet.name}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {pet.description}
              </p>
            </div>
          )}

          {pet.tags && pet.tags.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-foreground mb-2">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {pet.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="rounded-full text-xs bg-lavender-soft text-secondary-foreground border-0"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Owner */}
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">
              Listed by
            </p>
            <Link
              to="/users/$principal"
              params={{ principal: pet.ownerId.toString() }}
            >
              <div
                className="flex items-center gap-3 hover:bg-muted/50 rounded-xl p-2 -m-2 transition-colors"
                data-ocid="pet_detail.owner.link"
              >
                <Avatar className="h-10 w-10">
                  {ownerProfile?.profilePhoto && (
                    <AvatarImage
                      src={ownerProfile.profilePhoto.getDirectURL()}
                    />
                  )}
                  <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                    {ownerProfile?.displayName?.slice(0, 2).toUpperCase() ??
                      "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    {ownerProfile?.displayName ?? "Anonymous"}
                  </p>
                  {ownerProfile?.location && (
                    <p className="text-xs text-muted-foreground">
                      {ownerProfile.location}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {isOwner ? (
              <>
                <Link
                  to="/pets/$id/edit"
                  params={{ id: pet.id }}
                  className="flex-1"
                >
                  <Button
                    variant="outline"
                    className="w-full rounded-full gap-2"
                    data-ocid="pet_detail.edit.button"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Listing
                  </Button>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full border-destructive/40 text-destructive hover:bg-destructive/10"
                      data-ocid="pet_detail.delete.open_modal_button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent data-ocid="pet_detail.delete.dialog">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove {pet.name}'s listing. This
                        cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-ocid="pet_detail.delete.cancel_button">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        data-ocid="pet_detail.delete.confirm_button"
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          "Delete"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : identity && !pet.isAdopted ? (
              <Button
                className="flex-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-paw gap-2"
                onClick={handleApplyToAdopt}
                disabled={isApplying}
                data-ocid="pet_detail.adopt.primary_button"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending request...
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4" />
                    Apply to Adopt
                  </>
                )}
              </Button>
            ) : !identity ? (
              <Button
                className="flex-1 rounded-full bg-primary text-primary-foreground"
                onClick={() => navigate({ to: "/login" })}
                data-ocid="pet_detail.login_to_adopt.button"
              >
                Log in to Adopt
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
