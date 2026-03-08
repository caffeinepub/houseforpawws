import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  MessageCircle,
  PawPrint,
} from "lucide-react";
import { toast } from "sonner";
import PetCard from "../components/PetCard";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetAllPets,
  useGetUserProfile,
  useStartOrGetConversation,
} from "../hooks/useQueries";

export default function PublicProfilePage() {
  const { principal } = useParams({ strict: false }) as { principal: string };
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: profile, isLoading } = useGetUserProfile(principal);
  const { data: allPets } = useGetAllPets();
  const { mutateAsync: startConversation, isPending } =
    useStartOrGetConversation();

  const theirPets =
    allPets?.filter((p) => p.ownerId.toString() === principal) ?? [];
  const isOwnProfile = identity?.getPrincipal().toString() === principal;
  const initials = profile?.displayName?.slice(0, 2).toUpperCase() ?? "?";

  const handleMessage = async () => {
    if (!identity) {
      navigate({ to: "/login" });
      return;
    }
    try {
      const convId = await startConversation(principal);
      navigate({
        to: "/inbox/$conversationId",
        params: { conversationId: convId },
      });
    } catch {
      toast.error("Failed to start conversation.");
    }
  };

  if (isLoading) {
    return (
      <div
        className="container py-10 max-w-3xl"
        data-ocid="public_profile.loading_state"
      >
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {["pp-sk1", "pp-sk2", "pp-sk3"].map((sk) => (
            <Skeleton key={sk} className="aspect-[3/4] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-3xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ to: "/" })}
        className="mb-6 -ml-2 text-muted-foreground"
        data-ocid="public_profile.back.button"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </Button>

      {/* Profile Card */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xs mb-8">
        <div className="h-20 bg-gradient-to-r from-lavender-soft to-pink-soft" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-8 mb-4">
            <Avatar className="h-16 w-16 border-4 border-card shadow-md">
              {profile?.profilePhoto && (
                <AvatarImage src={profile.profilePhoto.getDirectURL()} />
              )}
              <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!isOwnProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMessage}
                disabled={isPending}
                className="rounded-full gap-2"
                data-ocid="public_profile.message.button"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageCircle className="h-4 w-4" />
                )}
                Message
              </Button>
            )}
          </div>

          <h2 className="font-display text-2xl font-bold text-foreground">
            {profile?.displayName ?? "Anonymous User"}
          </h2>
          {profile?.location && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
              <MapPin className="h-3.5 w-3.5" />
              {profile.location}
            </div>
          )}
          {profile?.bio && (
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              {profile.bio}
            </p>
          )}

          {!profile && (
            <p className="text-muted-foreground italic text-sm mt-2">
              This user hasn't set up their profile yet.
            </p>
          )}
        </div>
      </div>

      {/* Their Listings */}
      <div>
        <h3 className="font-display text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
          <PawPrint className="h-5 w-5 text-primary" />
          {isOwnProfile ? "My" : `${profile?.displayName ?? "Their"}'s`} Pets
        </h3>

        {theirPets.length === 0 ? (
          <div
            className="text-center py-12 bg-card rounded-2xl border border-border"
            data-ocid="public_profile.pets.empty_state"
          >
            <div className="text-4xl mb-3">🐾</div>
            <p className="text-muted-foreground">No pets listed yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {theirPets.map((pet, i) => (
              <PetCard key={pet.id} pet={pet} index={i + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
