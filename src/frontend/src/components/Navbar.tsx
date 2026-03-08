import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Menu,
  MessageCircle,
  PawPrint,
  PlusCircle,
  Search,
  Settings,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "../hooks/useQueries";
import { useGetMyConversations } from "../hooks/useQueries";

export default function Navbar() {
  const { identity, clear } = useInternetIdentity();
  const { data: profile } = useGetCallerUserProfile();
  const { data: conversations } = useGetMyConversations();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { actor, isFetching: actorFetching } = useActor();
  const { data: isAdmin } = useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });

  const isAuthenticated = !!identity;
  const _unreadCount =
    conversations?.reduce(
      (acc, c) => acc + (c.messages.length > 0 ? 0 : 0),
      0,
    ) ?? 0;
  // Simple unread: just show total conversation count as a badge indicator
  const hasConversations = (conversations?.length ?? 0) > 0;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: "/" });
  };

  const initials = profile?.displayName
    ? profile.displayName.slice(0, 2).toUpperCase()
    : "?";

  const navLinks = (
    <>
      <Link
        to="/"
        className="flex items-center gap-1.5 text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
        data-ocid="nav.link"
      >
        <Search className="h-4 w-4" />
        Browse
      </Link>
      {isAuthenticated && (
        <Link
          to="/pets/new"
          className="flex items-center gap-1.5 text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
          data-ocid="nav.list_pet.link"
        >
          <PlusCircle className="h-4 w-4" />
          List a Pet
        </Link>
      )}
      {isAuthenticated && (
        <Link
          to="/settings"
          className="flex items-center gap-1.5 text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
          data-ocid="nav.settings.mobile.link"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      )}
      {isAdmin && (
        <Link
          to="/admin"
          className="flex items-center gap-1.5 text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
          data-ocid="nav.admin.link"
        >
          <Shield className="h-4 w-4" />
          Admin
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full bg-card/90 backdrop-blur-md border-b border-border shadow-xs">
      <div className="container flex h-16 items-center gap-4">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 shrink-0"
          data-ocid="nav.logo.link"
        >
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <PawPrint className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl text-foreground hidden sm:block">
            House<span className="text-primary">For</span>Pawws
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 ml-4">{navLinks}</nav>

        <div className="flex-1" />

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <Link to="/inbox" data-ocid="nav.inbox.link">
              <Button
                variant="ghost"
                size="icon"
                className="relative text-foreground/70 hover:text-primary"
              >
                <MessageCircle className="h-5 w-5" />
                {hasConversations && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-card" />
                )}
              </Button>
            </Link>
          )}

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="rounded-full flex items-center gap-2 px-2 hover:bg-primary/10"
                  data-ocid="nav.profile.toggle"
                >
                  {profile?.displayName && (
                    <span className="hidden sm:block text-sm font-medium text-foreground/80 max-w-[120px] truncate">
                      {profile.displayName}
                    </span>
                  )}
                  <Avatar className="h-8 w-8">
                    {profile?.profilePhoto && (
                      <AvatarImage
                        src={profile.profilePhoto.getDirectURL()}
                        alt={profile.displayName}
                      />
                    )}
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48"
                data-ocid="nav.profile.dropdown_menu"
              >
                <DropdownMenuItem asChild>
                  <Link
                    to="/profile"
                    className="cursor-pointer"
                    data-ocid="nav.profile.link"
                  >
                    My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    to="/inbox"
                    className="cursor-pointer"
                    data-ocid="nav.inbox.dropdown.link"
                  >
                    Inbox
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    to="/settings"
                    className="cursor-pointer"
                    data-ocid="nav.settings.link"
                  >
                    Settings
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link
                      to="/admin"
                      className="cursor-pointer"
                      data-ocid="nav.admin.link"
                    >
                      Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive cursor-pointer"
                  data-ocid="nav.logout.button"
                >
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                asChild
                data-ocid="nav.login.button"
              >
                <Link to="/login">Log In</Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
                data-ocid="nav.register.button"
              >
                <Link to="/register">Sign Up</Link>
              </Button>
            </div>
          )}

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                data-ocid="nav.mobile.toggle"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-64"
              data-ocid="nav.mobile.sheet"
            >
              <div className="flex flex-col gap-4 mt-8">{navLinks}</div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
