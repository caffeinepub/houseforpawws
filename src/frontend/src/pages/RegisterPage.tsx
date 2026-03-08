import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, PawPrint, UserPlus } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import MathCaptcha from "../components/MathCaptcha";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useSaveCallerUserProfile } from "../hooks/useQueries";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login, isLoggingIn, isLoginSuccess, identity } =
    useInternetIdentity();
  const { mutateAsync: saveProfile, isPending: isSavingProfile } =
    useSaveCallerUserProfile();

  const [captchaPassed, setCaptchaPassed] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [step, setStep] = useState<"register" | "complete">("register");

  // After login succeeds, go to complete step
  useEffect(() => {
    if (isLoginSuccess && identity && step === "register") {
      setStep("complete");
    }
  }, [isLoginSuccess, identity, step]);

  const handleRegister = () => {
    if (!captchaPassed) {
      toast.error("Please complete the security check first.");
      return;
    }
    if (!displayName.trim()) {
      toast.error("Please enter a display name.");
      return;
    }
    login();
  };

  const handleCompleteProfile = async () => {
    if (!displayName.trim()) {
      toast.error("Display name is required.");
      return;
    }
    try {
      await saveProfile({
        displayName: displayName.trim(),
        bio: "",
        location: "",
      });
      toast.success("Account created! Welcome to HouseForPawws 🐾");
      navigate({ to: "/profile" });
    } catch {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  if (step === "complete") {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm"
        >
          <div className="bg-card rounded-2xl border border-border p-8 shadow-paw text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              You're in!
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              You're signed in as <strong>{displayName}</strong>. Let's save
              your profile.
            </p>
            <Button
              onClick={handleCompleteProfile}
              disabled={isSavingProfile}
              className="w-full rounded-full bg-primary text-primary-foreground gap-2"
              data-ocid="register.complete.submit_button"
            >
              {isSavingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Complete Profile 🐾"
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="bg-card rounded-2xl border border-border p-8 shadow-paw">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <PawPrint className="h-7 w-7 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Join HouseForPawws
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Find or help a pet find their forever home.
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                placeholder="e.g. Emma & Whiskers"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                data-ocid="register.display_name.input"
              />
              <p className="text-xs text-muted-foreground">
                This is how other users will see you.
              </p>
            </div>

            <MathCaptcha onValidChange={setCaptchaPassed} />

            <Button
              onClick={handleRegister}
              disabled={isLoggingIn || !captchaPassed || !displayName.trim()}
              className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-paw gap-2"
              data-ocid="register.submit_button"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create Account
                </>
              )}
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-primary font-medium hover:underline"
                  data-ocid="register.login.link"
                >
                  Sign in
                </Link>
              </p>
            </div>

            <div className="text-xs text-muted-foreground text-center bg-muted/50 rounded-xl p-3">
              <p>
                We use <strong>Internet Identity</strong> — no passwords needed.
                Secure and private.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
