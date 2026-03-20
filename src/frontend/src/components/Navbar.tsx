import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Menu,
  MessageCircle,
  PawPrint,
  PlusCircle,
  Search,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetCallerUserProfile,
  useGetMyConversations,
} from "../hooks/useQueries";

const OWNER_PRINCIPAL =
  "p2fqy-qgzuc-uukdf-hkp5z-yxtnz-6gdx7-ogpj3-7hguy-4iaw3-kyogu-cae";

export default function Navbar() {
  const { identity, clear } = useInternetIdentity();
  const { data: profile } = useGetCallerUserProfile();
  const { data: conversations } = useGetMyConversations();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthenticated = !!identity;
  const hasConversations = (conversations?.length ?? 0) > 0;
  const isOwner = identity?.getPrincipal().toString() === OWNER_PRINCIPAL;

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
      {isOwner && (
        <Link
          to="/admin"
          className="flex items-center gap-1.5 text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
          data-ocid="nav.admin.link"
        >
          <ShieldCheck className="h-4 w-4" />
          Moderation
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
    </>
  );

  return (
    <header
      className="sticky top-0 z-50 w-full backdrop-blur-md border-b border-primary/10 shadow-xs"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.94 0.06 350 / 0.92) 0%, oklch(0.93 0.055 290 / 0.92) 100%)",
      }}
    >
      <div className="container flex h-16 items-center gap-4">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 shrink-0"
          data-ocid="nav.logo.link"
        >
          <div className="w-8 h-8 rounded-full gradient-paw flex items-center justify-center">
            <PawPrint className="h-4 w-4 text-foreground" />
          </div>
          <span className="font-display font-bold text-xl text-foreground hidden sm:block drop-shadow-sm">
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
                {isOwner && (
                  <DropdownMenuItem asChild>
                    <Link
                      to="/admin"
                      className="cursor-pointer"
                      data-ocid="nav.admin.dropdown.link"
                    >
                      Moderation
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
                className="rounded-full text-white hover:opacity-90"
                style={{
                  background:
                    "linear-gradient(to right, oklch(var(--primary)), oklch(0.72 0.1 290))",
                }}
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
