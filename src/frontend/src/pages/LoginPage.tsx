import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Lock, PawPrint } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import MathCaptcha from "../components/MathCaptcha";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoggingIn, isLoginError, isInitializing, identity } =
    useInternetIdentity();
  const [captchaPassed, setCaptchaPassed] = useState(false);
  // Use a ref so toggling it never causes a re-render that could disturb the
  // brief window when identity becomes available after the II popup closes.
  const hasAttemptedRef = useRef(false);
  const hasRedirected = useRef(false);
  const errorToastShown = useRef(false);

  // Single consolidated redirect effect.
  useEffect(() => {
    if (!identity || isInitializing || hasRedirected.current) return;

    hasRedirected.current = true;
    const t = setTimeout(() => {
      navigate({ to: "/" });
    }, 80);
    return () => clearTimeout(t);
  }, [identity, isInitializing, navigate]);

  // Show error toast only after the user explicitly attempted login.
  useEffect(() => {
    if (!hasAttemptedRef.current) return;
    if (isLoginError && !errorToastShown.current) {
      errorToastShown.current = true;
      setCaptchaPassed(false);
      toast.error("Login failed. Please try again.");
    }
    if (!isLoginError) {
      errorToastShown.current = false;
    }
  }, [isLoginError]);

  const handleLogin = () => {
    if (!captchaPassed) {
      toast.error("Please complete the security check first.");
      return;
    }
    hasAttemptedRef.current = true;
    login();
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="bg-card rounded-2xl border border-border p-8 shadow-paw">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <PawPrint className="h-7 w-7 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to HouseForPawws
            </p>
          </div>

          <div className="space-y-6">
            {/* CAPTCHA */}
            <MathCaptcha onValidChange={setCaptchaPassed} />

            {/* Internet Identity Button */}
            <Button
              onClick={handleLogin}
              disabled={isLoggingIn || !captchaPassed}
              className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-paw gap-2"
              data-ocid="login.submit_button"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Sign In with Internet Identity
                </>
              )}
            </Button>

            {isLoginError && hasAttemptedRef.current && (
              <p
                className="text-sm text-destructive text-center"
                data-ocid="login.error_state"
              >
                Login failed. Please try again.
              </p>
            )}

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                New here?{" "}
                <Link
                  to="/register"
                  className="text-primary font-medium hover:underline"
                  data-ocid="login.register.link"
                >
                  Create an account
                </Link>
              </p>
            </div>

            <div className="text-xs text-muted-foreground text-center bg-muted/50 rounded-xl p-3">
              <p>
                HouseForPawws uses <strong>Internet Identity</strong> for
                secure, passwordless authentication.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
