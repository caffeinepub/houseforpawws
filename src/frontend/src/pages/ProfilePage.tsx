import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  Camera,
  Edit2,
  Loader2,
  MapPin,
  PawPrint,
  Save,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import PetCard from "../components/PetCard";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetAllPets,
  useGetCallerUserProfile,
  useSaveCallerUserProfile,
} from "../hooks/useQueries";

export default function ProfilePage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const {
    data: profile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();
  const { data: allPets } = useGetAllPets();
  const { mutateAsync: saveProfile, isPending: isSaving } =
    useSaveCallerUserProfile();

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [photoBlob, setPhotoBlob] = useState<ExternalBlob | undefined>(
    undefined,
  );
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!identity) navigate({ to: "/login" });
  }, [identity, navigate]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? "");
      setBio(profile.bio ?? "");
      setLocation(profile.location ?? "");
      setPhotoBlob(profile.profilePhoto);
      setPhotoPreview(profile.profilePhoto?.getDirectURL?.());
    }
  }, [profile]);

  const myPets =
    allPets?.filter(
      (p) => p.ownerId.toString() === identity?.getPrincipal().toString(),
    ) ?? [];

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const blob = ExternalBlob.fromBytes(bytes);
    setPhotoBlob(blob);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    try {
      await saveProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        location: location.trim(),
        profilePhoto: photoBlob,
      });
      toast.success("Profile updated!");
      setEditing(false);
    } catch {
      toast.error("Failed to update profile.");
    }
  };

  const handleCancel = () => {
    if (profile) {
      setDisplayName(profile.displayName ?? "");
      setBio(profile.bio ?? "");
      setLocation(profile.location ?? "");
      setPhotoBlob(profile.profilePhoto);
      setPhotoPreview(profile.profilePhoto?.getDirectURL?.());
    }
    setEditing(false);
  };

  const initials = displayName?.slice(0, 2).toUpperCase() || "?";

  if (profileLoading && !isFetched) {
    return (
      <div
        className="container py-10 max-w-3xl"
        data-ocid="profile.loading_state"
      >
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-3xl">
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xs">
        {/* Cover / Header */}
        <div className="h-24 bg-gradient-to-r from-pink-soft to-lavender-soft relative" />

        <div className="px-6 pb-6">
          {/* Avatar + Name row */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-card shadow-md">
                {photoPreview ? (
                  <AvatarImage src={photoPreview} alt={displayName} />
                ) : null}
                <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {editing && (
                <label
                  htmlFor="profile-photo"
                  className="absolute inset-0 flex items-center justify-center bg-foreground/40 rounded-full cursor-pointer"
                  data-ocid="profile.photo.upload_button"
                >
                  <Camera className="h-6 w-6 text-white" />
                  <input
                    id="profile-photo"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => handlePhotoUpload(e.target.files)}
                  />
                </label>
              )}
            </div>

            <div className="flex gap-2">
              {editing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    className="rounded-full"
                    data-ocid="profile.cancel.button"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="rounded-full bg-primary text-primary-foreground"
                    data-ocid="profile.save.button"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    Save
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(true)}
                  className="rounded-full"
                  data-ocid="profile.edit.button"
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* Profile fields */}
          {editing ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                  data-ocid="profile.display_name.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  data-ocid="profile.bio.textarea"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, State"
                  data-ocid="profile.location.input"
                />
              </div>
            </div>
          ) : (
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                {profile?.displayName || "Anonymous User"}
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
              {!profile?.displayName && !profile?.bio && !profile?.location && (
                <p className="text-sm text-muted-foreground mt-2 italic">
                  Your profile is empty. Click Edit to add your info!
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* My Listings */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
            <PawPrint className="h-5 w-5 text-primary" />
            My Pet Listings
          </h3>
          <span className="text-sm text-muted-foreground">
            {myPets.length} pet{myPets.length !== 1 ? "s" : ""}
          </span>
        </div>

        {myPets.length === 0 ? (
          <div
            className="text-center py-12 bg-card rounded-2xl border border-border"
            data-ocid="profile.pets.empty_state"
          >
            <div className="text-4xl mb-3">🐾</div>
            <p className="text-muted-foreground">
              You haven't listed any pets yet.
            </p>
            <Button
              className="mt-4 rounded-full bg-primary text-primary-foreground"
              onClick={() => navigate({ to: "/pets/new" })}
              data-ocid="profile.list_pet.button"
            >
              List Your First Pet
            </Button>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5"
            data-ocid="profile.pets.list"
          >
            {myPets.map((pet, i) => (
              <PetCard key={pet.id} pet={pet} index={i + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
