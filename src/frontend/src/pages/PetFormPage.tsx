import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Principal } from "@icp-sdk/core/principal";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Loader2, PawPrint, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import type { Pet } from "../backend";
import TOSModal from "../components/TOSModal";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCreatePet, useGetPet, useUpdatePet } from "../hooks/useQueries";

const SPECIES = ["Dog", "Cat", "Bird", "Rabbit", "Other"];
const SIZES = ["Small", "Medium", "Large"];

interface PetFormData {
  name: string;
  species: string;
  breed: string;
  age: string;
  size: string;
  description: string;
  healthStatus: string;
  tags: string;
  location: string;
  isAdopted: boolean;
}

const DEFAULT_FORM: PetFormData = {
  name: "",
  species: "Dog",
  breed: "",
  age: "",
  size: "Medium",
  description: "",
  healthStatus: "",
  tags: "",
  location: "",
  isAdopted: false,
};

interface Props {
  mode: "create" | "edit";
}

export default function PetFormPage({ mode }: Props) {
  const navigate = useNavigate();
  const { id } = useParams({ strict: false }) as { id?: string };
  const { identity } = useInternetIdentity();

  const { data: existingPet, isLoading: loadingPet } = useGetPet(
    mode === "edit" ? id : undefined,
  );
  const { mutateAsync: createPet, isPending: isCreating } = useCreatePet();
  const { mutateAsync: updatePet, isPending: isUpdating } = useUpdatePet();

  const [form, setForm] = useState<PetFormData>(DEFAULT_FORM);
  const [photos, setPhotos] = useState<ExternalBlob[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const [tosAccepted, setTosAccepted] = useState(false);

  const isPending = isCreating || isUpdating;

  // Redirect if not authenticated
  useEffect(() => {
    if (!identity) navigate({ to: "/login" });
  }, [identity, navigate]);

  // Populate form for edit mode
  useEffect(() => {
    if (mode === "edit" && existingPet) {
      setForm({
        name: existingPet.name,
        species: existingPet.species,
        breed: existingPet.breed,
        age: existingPet.age,
        size: existingPet.size,
        description: existingPet.description,
        healthStatus: existingPet.healthStatus,
        tags: existingPet.tags.join(", "),
        location: existingPet.location,
        isAdopted: existingPet.isAdopted,
      });
      setPhotos(existingPet.photoBlobs ?? []);
      setPhotoUrls(
        (existingPet.photoBlobs ?? []).map((b) => b.getDirectURL?.() ?? ""),
      );
    }
  }, [existingPet, mode]);

  const set = (key: keyof PetFormData) => (val: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    const newProgress = Array(files.length).fill(0);
    setUploadProgress(newProgress);

    const newBlobs: ExternalBlob[] = [];
    const newUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
        setUploadProgress((prev) => {
          const updated = [...prev];
          updated[i] = pct;
          return updated;
        });
      });
      newBlobs.push(blob);
      newUrls.push(URL.createObjectURL(file));
    }

    setPhotos((prev) => [...prev, ...newBlobs]);
    setPhotoUrls((prev) => [...prev, ...newUrls]);
    setIsUploading(false);
    setUploadProgress([]);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity) return;
    if (!form.name.trim()) {
      toast.error("Pet name is required.");
      return;
    }
    if (mode === "create" && !tosAccepted) {
      toast.error("Please agree to the Terms of Service.");
      return;
    }

    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const petData: Pet = {
      id: mode === "edit" ? (id ?? "") : "",
      name: form.name.trim(),
      species: form.species,
      breed: form.breed.trim(),
      age: form.age.trim(),
      size: form.size,
      description: form.description.trim(),
      healthStatus: form.healthStatus.trim(),
      tags,
      location: form.location.trim(),
      isAdopted: form.isAdopted,
      photoBlobs: photos,
      ownerId: identity.getPrincipal() as unknown as Principal,
    };

    try {
      if (mode === "create") {
        const newId = await createPet(petData);
        toast.success("Pet listed successfully! 🐾");
        navigate({ to: "/pets/$id", params: { id: newId } });
      } else {
        await updatePet({ petId: id!, pet: petData });
        toast.success("Pet listing updated!");
        navigate({ to: "/pets/$id", params: { id: id! } });
      }
    } catch {
      toast.error(
        mode === "create"
          ? "Failed to create listing."
          : "Failed to update listing.",
      );
    }
  };

  if (mode === "edit" && loadingPet) {
    return (
      <div
        className="container py-10 max-w-2xl"
        data-ocid="pet_form.loading_state"
      >
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="space-y-4">
          {["sk1", "sk2", "sk3", "sk4", "sk5", "sk6"].map((sk) => (
            <Skeleton key={sk} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-2xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          navigate({ to: mode === "edit" && id ? `/pets/${id}` : "/" })
        }
        className="mb-6 -ml-2 text-muted-foreground"
        data-ocid="pet_form.back.button"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </Button>

      <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-xs">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <PawPrint className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              {mode === "create" ? "List a Pet for Adoption" : "Edit Listing"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "create"
                ? "Help a pet find their forever home."
                : "Update your pet's information."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Upload */}
          <div className="space-y-3">
            <Label className="font-medium">Photos</Label>
            <label
              htmlFor="photo-upload"
              className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer relative flex flex-col items-center"
              data-ocid="pet_form.dropzone"
            >
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => handlePhotoUpload(e.target.files)}
                data-ocid="pet_form.upload_button"
              />
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Click to upload photos
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                PNG, JPG up to 5MB each
              </p>
            </label>

            {isUploading && (
              <p
                className="text-sm text-primary flex items-center gap-2"
                data-ocid="pet_form.upload.loading_state"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading {uploadProgress.length} photo
                {uploadProgress.length !== 1 ? "s" : ""}...
              </p>
            )}

            {photoUrls.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {photoUrls.map((url, i) => (
                  <div
                    key={url.startsWith("blob:") ? `blob-photo-${i}` : url}
                    className="relative w-20 h-20 rounded-xl overflow-hidden border border-border group"
                  >
                    <img
                      src={url}
                      alt={`Upload ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePhoto(i);
                      }}
                      className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      data-ocid={`pet_form.remove_photo.${i + 1}`}
                    >
                      <X className="h-5 w-5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Pet Name *</Label>
              <Input
                id="name"
                placeholder="e.g. Biscuit"
                value={form.name}
                onChange={(e) => set("name")(e.target.value)}
                required
                data-ocid="pet_form.name.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Species *</Label>
              <Select value={form.species} onValueChange={set("species")}>
                <SelectTrigger data-ocid="pet_form.species.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPECIES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="breed">Breed</Label>
              <Input
                id="breed"
                placeholder="e.g. Golden Retriever"
                value={form.breed}
                onChange={(e) => set("breed")(e.target.value)}
                data-ocid="pet_form.breed.input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                placeholder="e.g. 2 years"
                value={form.age}
                onChange={(e) => set("age")(e.target.value)}
                data-ocid="pet_form.age.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Size</Label>
              <Select value={form.size} onValueChange={set("size")}>
                <SelectTrigger data-ocid="pet_form.size.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIZES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g. Brooklyn, NY"
                value={form.location}
                onChange={(e) => set("location")(e.target.value)}
                data-ocid="pet_form.location.input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Tell people about this pet's personality, habits, and what makes them special..."
              value={form.description}
              onChange={(e) => set("description")(e.target.value)}
              rows={4}
              data-ocid="pet_form.description.textarea"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="healthStatus">Health Status</Label>
            <Input
              id="healthStatus"
              placeholder="e.g. Vaccinated, neutered, healthy"
              value={form.healthStatus}
              onChange={(e) => set("healthStatus")(e.target.value)}
              data-ocid="pet_form.health.input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="e.g. playful, child-friendly, house-trained"
              value={form.tags}
              onChange={(e) => set("tags")(e.target.value)}
              data-ocid="pet_form.tags.input"
            />
          </div>

          {mode === "edit" && (
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
              <Switch
                id="isAdopted"
                checked={form.isAdopted}
                onCheckedChange={(v) => set("isAdopted")(v)}
                data-ocid="pet_form.adopted.switch"
              />
              <div>
                <Label
                  htmlFor="isAdopted"
                  className="font-medium cursor-pointer"
                >
                  Mark as Adopted
                </Label>
                <p className="text-xs text-muted-foreground">
                  Toggle when this pet has found their home
                </p>
              </div>
            </div>
          )}

          {/* TOS Checkbox — create mode only */}
          {mode === "create" && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border">
              <Checkbox
                id="pet-tos"
                checked={tosAccepted}
                onCheckedChange={(checked) => setTosAccepted(checked === true)}
                className="mt-0.5"
                data-ocid="pet_form.tos.checkbox"
              />
              <label
                htmlFor="pet-tos"
                className="text-sm text-muted-foreground leading-snug cursor-pointer select-none"
              >
                I agree to the{" "}
                <TOSModal>
                  <button
                    type="button"
                    className="text-primary font-medium hover:underline focus:outline-none focus-visible:underline"
                  >
                    Terms of Service
                  </button>
                </TOSModal>{" "}
                before listing this pet
              </label>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => navigate({ to: "/" })}
              data-ocid="pet_form.cancel.button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-paw"
              disabled={
                isPending || isUploading || (mode === "create" && !tosAccepted)
              }
              data-ocid="pet_form.submit_button"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {mode === "create" ? "Listing..." : "Saving..."}
                </>
              ) : mode === "create" ? (
                "List Pet 🐾"
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
