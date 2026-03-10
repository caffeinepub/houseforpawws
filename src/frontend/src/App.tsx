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

  const profileEverLoadedRef = useRef(false);
  const trackedPrincipalRef = useRef<string | undefined>(undefined);

  const currentPrincipal = identity?.getPrincipal().toString();

  useEffect(() => {
    if (currentPrincipal !== trackedPrincipalRef.current) {
      trackedPrincipalRef.current = currentPrincipal;
      profileEverLoadedRef.current = false;
    }
  }, [currentPrincipal]);

  if (profile != null && currentPrincipal === trackedPrincipalRef.current) {
    profileEverLoadedRef.current = true;
  }

  const isAuthenticated = !!identity;

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
