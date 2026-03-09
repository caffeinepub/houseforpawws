import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, PawPrint } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSaveCallerUserProfile } from "../hooks/useQueries";

interface ProfileSetupModalProps {
  open: boolean;
  onComplete: () => void;
}

export default function ProfileSetupModal({
  open,
  onComplete,
}: ProfileSetupModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [saved, setSaved] = useState(false);
  const { mutateAsync: saveProfile, isPending } = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !email.trim() || !phone.trim() || saved) return;
    try {
      // Mark as saved immediately so the modal doesn't re-open while
      // the query invalidation/refetch is in flight
      setSaved(true);
      await saveProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        location: location.trim(),
        email: email.trim(),
        phone: phone.trim(),
        profilePhoto: undefined,
      });
      toast.success("Welcome to HouseForPawws! 🐾");
      onComplete();
    } catch {
      setSaved(false);
      toast.error("Failed to save profile. Please try again.");
    }
  };

  // Don't render the modal if save was just completed -- prevents flicker
  // while the profile query is invalidating and refetching
  if (saved && !open) return null;

  return (
    <Dialog open={open} data-ocid="profile_setup.dialog">
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center justify-center mb-3">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
              <PawPrint className="h-7 w-7 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center font-display text-2xl">
            Welcome to HouseForPawws!
          </DialogTitle>
          <DialogDescription className="text-center">
            Tell us a bit about yourself so other users know who you are.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name *</Label>
            <Input
              id="displayName"
              placeholder="e.g. Emma & Whiskers"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              data-ocid="profile_setup.input"
            />
            <p className="text-xs text-muted-foreground">
              Visible to all users on the platform.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="setup-email">Email Address *</Label>
            <Input
              id="setup-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-ocid="profile_setup.email.input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="setup-phone">Phone Number *</Label>
            <Input
              id="setup-phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              data-ocid="profile_setup.phone.input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself and your love for animals..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              data-ocid="profile_setup.textarea"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g. San Francisco, CA"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              data-ocid="profile_setup.location.input"
            />
          </div>
          <Button
            type="submit"
            className="w-full rounded-full bg-primary text-primary-foreground"
            disabled={
              !displayName.trim() || !email.trim() || !phone.trim() || isPending
            }
            data-ocid="profile_setup.submit_button"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Get Started 🐾"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
