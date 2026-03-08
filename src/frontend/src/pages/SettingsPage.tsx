import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Camera,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Save,
  Settings,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetCallerUserProfile,
  useSaveCallerUserProfile,
} from "../hooks/useQueries";

export default function SettingsPage() {
  const { identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();
  const {
    data: profile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();
  const { mutateAsync: saveProfile, isPending: isSaving } =
    useSaveCallerUserProfile();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [photoBlob, setPhotoBlob] = useState<ExternalBlob | undefined>(
    undefined,
  );
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(
    undefined,
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isInitializing && !identity) {
      navigate({ to: "/login" });
    }
  }, [isInitializing, identity, navigate]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? "");
      setEmail(profile.email ?? "");
      setPhone(profile.phone ?? "");
      setBio(profile.bio ?? "");
      setLocation(profile.location ?? "");
      setPhotoBlob(profile.profilePhoto);
      setPhotoPreview(profile.profilePhoto?.getDirectURL?.());
    }
  }, [profile]);

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
    if (!displayName.trim()) {
      toast.error("Display name is required.");
      return;
    }
    try {
      await saveProfile({
        displayName: displayName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        location: location.trim(),
        profilePhoto: photoBlob,
      });
      setSaved(true);
      toast.success("Settings saved! ✅");
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error("Failed to save settings.");
    }
  };

  const initials = displayName?.slice(0, 2).toUpperCase() || "?";

  if (isInitializing || (profileLoading && !isFetched)) {
    return (
      <div
        className="container py-10 max-w-3xl"
        data-ocid="settings.loading_state"
      >
        <Skeleton className="h-10 w-40 mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center gap-3 mb-8"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>
      </motion.div>

      <Tabs defaultValue="account">
        <TabsList
          className="bg-muted/50 rounded-xl p-1 mb-6 border border-border w-full sm:w-auto"
          data-ocid="settings.tabs"
        >
          <TabsTrigger
            value="account"
            className="rounded-lg font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm flex items-center gap-1.5"
            data-ocid="settings.account.tab"
          >
            <User className="h-3.5 w-3.5" />
            Account
          </TabsTrigger>
          <TabsTrigger
            value="privacy"
            className="rounded-lg font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm flex items-center gap-1.5"
            data-ocid="settings.privacy.tab"
          >
            <Lock className="h-3.5 w-3.5" />
            Privacy
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="rounded-lg font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm flex items-center gap-1.5"
            data-ocid="settings.notifications.tab"
          >
            <Bell className="h-3.5 w-3.5" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* ── Account Tab ── */}
        <TabsContent value="account">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-6">
              {/* Profile photo */}
              <div>
                <h3 className="font-display text-base font-semibold text-foreground mb-4">
                  Profile Photo
                </h3>
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <Avatar className="h-20 w-20 border-4 border-card shadow-md">
                      {photoPreview ? (
                        <AvatarImage src={photoPreview} alt={displayName} />
                      ) : null}
                      <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <label
                      htmlFor="settings-photo"
                      className="absolute inset-0 flex items-center justify-center bg-foreground/40 rounded-full cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
                      data-ocid="settings.photo.upload_button"
                    >
                      <Camera className="h-6 w-6 text-white" />
                      <input
                        id="settings-photo"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => handlePhotoUpload(e.target.files)}
                      />
                    </label>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {displayName || "Your Name"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Click the photo to update it
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Public info */}
              <div>
                <h3 className="font-display text-base font-semibold text-foreground mb-1">
                  Public Information
                </h3>
                <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Visible to all users on HouseForPawws
                </p>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-displayName">Display Name *</Label>
                    <Input
                      id="settings-displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your display name"
                      required
                      data-ocid="settings.display_name.input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-bio">Bio</Label>
                    <Textarea
                      id="settings-bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell people about yourself and your love for animals..."
                      rows={3}
                      data-ocid="settings.bio.textarea"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-location">Location</Label>
                    <Input
                      id="settings-location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="City, State"
                      data-ocid="settings.location.input"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Private info */}
              <div>
                <h3 className="font-display text-base font-semibold text-foreground mb-1">
                  Private Information
                </h3>
                <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
                  <EyeOff className="h-3 w-3" />
                  Only visible to the admin — never shown to other users
                </p>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-email">Email Address</Label>
                    <Input
                      id="settings-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      data-ocid="settings.email.input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-phone">Phone Number</Label>
                    <Input
                      id="settings-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      data-ocid="settings.phone.input"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !displayName.trim()}
                  className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 min-w-[120px]"
                  data-ocid="settings.save.button"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : saved ? (
                    <>✅ Saved!</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* ── Privacy Tab ── */}
        <TabsContent value="privacy">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-foreground mb-1">
                    What everyone can see
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your <strong>display name</strong> is public and visible to
                    all users on HouseForPawws. It appears on your pet listings,
                    in conversations, and on your public profile.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <EyeOff className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-foreground mb-1">
                    What only the admin can see
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your <strong>email address</strong> and{" "}
                    <strong>phone number</strong> are private. They are never
                    displayed to other users and are only accessible by the
                    platform admin for account management and safety purposes.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-foreground mb-1">
                    Your account identity
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    HouseForPawws uses <strong>Internet Identity</strong> for
                    authentication — a secure, passwordless system. No passwords
                    are stored. Your cryptographic identity is yours alone.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* ── Notifications Tab ── */}
        <TabsContent value="notifications">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="bg-card rounded-2xl border border-border p-10 shadow-xs text-center"
              data-ocid="settings.notifications.panel"
            >
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Bell className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                Notification settings coming soon
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                We're working on push notifications and email digest options.
                Check back soon!
              </p>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
