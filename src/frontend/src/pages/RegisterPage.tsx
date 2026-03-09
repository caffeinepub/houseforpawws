import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, PawPrint, UserPlus } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import MathCaptcha from "../components/MathCaptcha";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useSaveCallerUserProfile } from "../hooks/useQueries";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login, isLoggingIn, identity } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const { mutateAsync: saveProfile, isPending: isSavingProfile } =
    useSaveCallerUserProfile();

  const [captchaPassed, setCaptchaPassed] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"register" | "complete">("register");
  // Use a ref (not state) so that setting it never triggers a re-render that
  // could create a race with the brief identity-disappear / re-appear window
  // caused by the auth client re-initializing after the II popup closes.
  const hasAttemptedLoginRef = useRef(false);

  // Advance to the "complete" step as soon as identity is present AND the
  // user has actually clicked the register button in this session.
  // Using a ref for hasAttemptedLogin means this effect re-runs only when
  // identity changes -- the ref change itself doesn't schedule a re-render.
  useEffect(() => {
    if (identity && hasAttemptedLoginRef.current && step === "register") {
      setStep("complete");
    }
  }, [identity, step]);

  const handleRegister = () => {
    if (!captchaPassed) {
      toast.error("Please complete the security check first.");
      return;
    }
    if (!displayName.trim()) {
      toast.error("Please enter a display name.");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }
    if (!phone.trim()) {
      toast.error("Please enter your phone number.");
      return;
    }
    hasAttemptedLoginRef.current = true;
    login();
  };

  const handleCompleteProfile = async () => {
    if (!displayName.trim()) {
      toast.error("Display name is required.");
      return;
    }
    if (!email.trim()) {
      toast.error("Email is required.");
      return;
    }
    if (!phone.trim()) {
      toast.error("Phone number is required.");
      return;
    }

    // Wait up to 3s for the actor to be ready — it may still be initializing
    // right after the Internet Identity popup closes.
    let attempts = 0;
    while ((!actor || actorFetching) && attempts < 6) {
      await sleep(500);
      attempts++;
    }
    if (!actor) {
      toast.error("Still connecting — please wait a moment and try again.");
      return;
    }

    try {
      await saveProfile({
        displayName: displayName.trim(),
        bio: "",
        location: "",
        email: email.trim(),
        phone: phone.trim(),
        profilePhoto: undefined,
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
              disabled={isSavingProfile || actorFetching || !actor}
              className="w-full rounded-full bg-primary text-primary-foreground gap-2"
              data-ocid="register.complete.submit_button"
            >
              {isSavingProfile || actorFetching || !actor ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isSavingProfile ? "Saving..." : "Connecting..."}
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
        className="w-full max-w-md"
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

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-ocid="register.email.input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                data-ocid="register.phone.input"
              />
            </div>

            <MathCaptcha onValidChange={setCaptchaPassed} />

            <Button
              onClick={handleRegister}
              disabled={
                isLoggingIn ||
                !captchaPassed ||
                !displayName.trim() ||
                !email.trim() ||
                !phone.trim()
              }
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
