import { Toaster } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import ProfileSetupModal from "./components/ProfileSetupModal";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import HomePage from "./pages/HomePage";
import InboxPage from "./pages/InboxPage";
import LoginPage from "./pages/LoginPage";
import PetDetailPage from "./pages/PetDetailPage";
import PetFormPage from "./pages/PetFormPage";
import ProfilePage from "./pages/ProfilePage";
import PublicProfilePage from "./pages/PublicProfilePage";
import RegisterPage from "./pages/RegisterPage";
import SettingsPage from "./pages/SettingsPage";

// ── Layout ────────────────────────────────────────────────────────────────────

function RootLayout() {
  const { identity, isInitializing, isLoggingIn } = useInternetIdentity();
  const {
    data: profile,
    isLoading: profileLoading,
    isFetched,
    isRefetching: profileRefetching,
  } = useGetCallerUserProfile();
  const queryClient = useQueryClient();

  // Once the profile has been confirmed as non-null for this identity session,
  // we never want to show the setup modal again (even during the brief re-init
  // window where `profile` may temporarily appear stale/null).
  const profileEverLoadedRef = useRef(false);
  // Track which identity principal the ref belongs to so it resets on logout.
  const trackedPrincipalRef = useRef<string | undefined>(undefined);

  const currentPrincipal = identity?.getPrincipal().toString();

  // Reset the "ever loaded" guard when the identity changes (logout / switch).
  useEffect(() => {
    if (currentPrincipal !== trackedPrincipalRef.current) {
      trackedPrincipalRef.current = currentPrincipal;
      profileEverLoadedRef.current = false;
    }
  }, [currentPrincipal]);

  // Mark that we've confirmed a real profile exists for this session.
  if (profile != null && currentPrincipal === trackedPrincipalRef.current) {
    profileEverLoadedRef.current = true;
  }

  const isAuthenticated = !!identity;

  // Only show profile setup when ALL conditions are met:
  // 1. Auth fully initialized, user authenticated, not actively logging in
  // 2. Profile query completed (isFetched) and not in any loading/refetching state
  // 3. Profile is explicitly null (not undefined -- undefined means "not yet fetched")
  // 4. We have NEVER confirmed a non-null profile for this session
  //
  // Using `profile === null` (not `!profile`) is intentional:
  //   - undefined  → query hasn't run yet, don't show modal
  //   - null       → backend confirmed no profile exists, show modal
  //
  // !profileRefetching prevents the modal from flashing during the
  // actor-triggered background invalidation sweep that happens on login.
  const showProfileSetup =
    !isInitializing &&
    !isLoggingIn &&
    isAuthenticated &&
    !profileLoading &&
    !profileRefetching &&
    isFetched &&
    profile === null &&
    !profileEverLoadedRef.current;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Toaster
        position="bottom-right"
        toastOptions={{
          className:
            "rounded-xl border border-border bg-card text-foreground shadow-paw",
        }}
      />
      <ProfileSetupModal
        open={showProfileSetup}
        onComplete={() =>
          queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] })
        }
      />
    </div>
  );
}

// ── Routes ────────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterPage,
});

const petNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pets/new",
  component: () => <PetFormPage mode="create" />,
});

const petDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pets/$id",
  component: PetDetailPage,
});

const petEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pets/$id/edit",
  component: () => <PetFormPage mode="edit" />,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

const publicProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/users/$principal",
  component: PublicProfilePage,
});

const inboxRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/inbox",
  component: () => <InboxPage />,
});

const inboxConvRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/inbox/$conversationId",
  component: () => <InboxPage />,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminDashboardPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  petNewRoute,
  petDetailRoute,
  petEditRoute,
  profileRoute,
  publicProfileRoute,
  inboxRoute,
  inboxConvRoute,
  adminRoute,
  settingsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
