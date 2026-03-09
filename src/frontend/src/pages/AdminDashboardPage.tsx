import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Principal } from "@icp-sdk/core/principal";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Ban,
  CheckCircle,
  MessageSquare,
  PawPrint,
  Shield,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { FullUserProfile, Pet, Stats } from "../backend";

// forceClaimAdminIfNoneExists is present in backend.d.ts (canister) but not
// always emitted in the generated backend.ts interface. Extend locally.
interface ExtendedBackend {
  forceClaimAdminIfNoneExists(): Promise<boolean>;
}
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

// ── Admin Query Hooks ─────────────────────────────────────────────────────────

function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching && !!identity,
    staleTime: 30_000,
    gcTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

function useAdminStats() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<Stats>({
    queryKey: ["adminStats"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.adminGetStats();
    },
    enabled: !!actor && !actorFetching,
  });
}

function useAdminAllUsers() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<Array<[Principal, FullUserProfile]>>({
    queryKey: ["adminAllUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetAllUsers();
    },
    enabled: !!actor && !actorFetching,
  });
}

function useAdminAllPets() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<Pet[]>({
    queryKey: ["adminAllPets"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPets();
    },
    enabled: !!actor && !actorFetching,
  });
}

function useAdminBannedUsers() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<Principal[]>({
    queryKey: ["adminBannedUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.adminGetBannedUsers();
    },
    enabled: !!actor && !actorFetching,
  });
}

// ── Mutation Hooks ────────────────────────────────────────────────────────────

function useAdminBanUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.adminBanUser(user);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminBannedUsers"] });
      toast.success("User banned");
    },
    onError: () => toast.error("Failed to ban user"),
  });
}

function useAdminUnbanUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.adminUnbanUser(user);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminBannedUsers"] });
      toast.success("User unbanned");
    },
    onError: () => toast.error("Failed to unban user"),
  });
}

function useAdminDeletePet() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (petId: string) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.adminDeletePet(petId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllPets"] });
      queryClient.invalidateQueries({ queryKey: ["allPets"] });
      toast.success("Pet removed");
    },
    onError: () => toast.error("Failed to delete pet"),
  });
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
  color = "primary",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number | undefined;
  loading?: boolean;
  color?: string;
}) {
  return (
    <Card className="border-border shadow-paw">
      <CardContent className="p-5 flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-2xl bg-${color}/15 flex items-center justify-center flex-shrink-0`}
        >
          <Icon className={`h-6 w-6 text-${color}`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            {label}
          </p>
          {loading ? (
            <Skeleton className="h-7 w-16 mt-1" />
          ) : (
            <p className="text-2xl font-bold text-foreground">{value ?? "—"}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── User Detail Dialog ────────────────────────────────────────────────────────

function UserDetailDialog({
  open,
  onClose,
  principal,
  profile,
  isBanned,
  onBan,
  onUnban,
}: {
  open: boolean;
  onClose: () => void;
  principal: string;
  profile: FullUserProfile;
  isBanned: boolean;
  onBan: () => void;
  onUnban: () => void;
}) {
  const initials = profile.displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const photoURL = profile.profilePhoto
    ? profile.profilePhoto.getDirectURL()
    : undefined;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md" data-ocid="admin.user.dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            User Details
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              {photoURL && (
                <AvatarImage src={photoURL} alt={profile.displayName} />
              )}
              <AvatarFallback className="bg-primary/20 text-primary font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-foreground text-lg">
                {profile.displayName}
              </p>
              {isBanned && (
                <Badge variant="destructive" className="text-xs">
                  Banned
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="text-muted-foreground w-24 flex-shrink-0">
                Principal
              </span>
              <span className="font-mono text-xs break-all text-foreground">
                {principal}
              </span>
            </div>
            {profile.email && (
              <div className="flex gap-2">
                <span className="text-muted-foreground w-24 flex-shrink-0">
                  Email
                </span>
                <span className="text-foreground">{profile.email}</span>
              </div>
            )}
            {profile.phone && (
              <div className="flex gap-2">
                <span className="text-muted-foreground w-24 flex-shrink-0">
                  Phone
                </span>
                <span className="text-foreground">{profile.phone}</span>
              </div>
            )}
            {profile.location && (
              <div className="flex gap-2">
                <span className="text-muted-foreground w-24 flex-shrink-0">
                  Location
                </span>
                <span className="text-foreground">{profile.location}</span>
              </div>
            )}
            {profile.bio && (
              <div className="flex gap-2">
                <span className="text-muted-foreground w-24 flex-shrink-0">
                  Bio
                </span>
                <span className="text-foreground">{profile.bio}</span>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="admin.user.close_button"
          >
            Close
          </Button>
          {isBanned ? (
            <Button
              onClick={() => {
                onUnban();
                onClose();
              }}
              className="gap-2"
              data-ocid="admin.user.confirm_button"
            >
              <UserCheck className="h-4 w-4" />
              Unban User
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={() => {
                onBan();
                onClose();
              }}
              className="gap-2"
              data-ocid="admin.user.delete_button"
            >
              <Ban className="h-4 w-4" />
              Ban User
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Users Table ───────────────────────────────────────────────────────────────

function UsersTable() {
  const { data: users, isLoading } = useAdminAllUsers();
  const { data: bannedUsers } = useAdminBannedUsers();
  const { mutate: banUser } = useAdminBanUser();
  const { mutate: unbanUser } = useAdminUnbanUser();

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    principal: string;
    profile: FullUserProfile;
  } | null>(null);

  const bannedSet = new Set(
    (bannedUsers ?? []).map((p: Principal) => p.toString()),
  );

  if (isLoading) {
    return (
      <div className="space-y-2" data-ocid="admin.users.loading_state">
        {["a", "b", "c", "d", "e"].map((k) => (
          <Skeleton key={k} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div
        className="text-center py-12 text-muted-foreground"
        data-ocid="admin.users.empty_state"
      >
        <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>No users registered yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-border overflow-hidden">
        <Table data-ocid="admin.users.table">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>User</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">Phone</TableHead>
              <TableHead className="hidden lg:table-cell">Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(([principal, profile], idx) => {
              const principalStr = principal.toString();
              const isBanned = bannedSet.has(principalStr);
              const initials = profile.displayName
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              const photoURL = profile.profilePhoto
                ? profile.profilePhoto.getDirectURL()
                : undefined;

              return (
                <TableRow
                  key={principalStr}
                  data-ocid={`admin.users.item.${idx + 1}`}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        {photoURL && (
                          <AvatarImage
                            src={photoURL}
                            alt={profile.displayName}
                          />
                        )}
                        <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm text-foreground">
                          {profile.displayName}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">
                          {principalStr.slice(0, 12)}…
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {profile.email || "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {profile.phone || "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {profile.location || "—"}
                  </TableCell>
                  <TableCell>
                    {isBanned ? (
                      <Badge variant="destructive" className="text-xs">
                        Banned
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-xs text-success border-success/30"
                      >
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => {
                          setSelectedUser({ principal: principalStr, profile });
                          setDetailOpen(true);
                        }}
                        data-ocid={`admin.users.edit_button.${idx + 1}`}
                      >
                        View
                      </Button>
                      {isBanned ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-success"
                          onClick={() =>
                            unbanUser(principal as unknown as Principal)
                          }
                          data-ocid={`admin.users.confirm_button.${idx + 1}`}
                        >
                          <UserCheck className="h-3 w-3 mr-1" />
                          Unban
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-destructive hover:text-destructive"
                          onClick={() =>
                            banUser(principal as unknown as Principal)
                          }
                          data-ocid={`admin.users.delete_button.${idx + 1}`}
                        >
                          <Ban className="h-3 w-3 mr-1" />
                          Ban
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {selectedUser && (
        <UserDetailDialog
          open={detailOpen}
          onClose={() => {
            setDetailOpen(false);
            setSelectedUser(null);
          }}
          principal={selectedUser.principal}
          profile={selectedUser.profile}
          isBanned={bannedSet.has(selectedUser.principal)}
          onBan={() => banUser(selectedUser.principal as unknown as Principal)}
          onUnban={() =>
            unbanUser(selectedUser.principal as unknown as Principal)
          }
        />
      )}
    </>
  );
}

// ── Pets Table ────────────────────────────────────────────────────────────────

function PetsTable() {
  const { data: pets, isLoading } = useAdminAllPets();
  const { mutate: deletePet } = useAdminDeletePet();
  const [confirmPetId, setConfirmPetId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2" data-ocid="admin.pets.loading_state">
        {["a", "b", "c", "d", "e"].map((k) => (
          <Skeleton key={k} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!pets || pets.length === 0) {
    return (
      <div
        className="text-center py-12 text-muted-foreground"
        data-ocid="admin.pets.empty_state"
      >
        <PawPrint className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>No pets listed yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-border overflow-hidden">
        <Table data-ocid="admin.pets.table">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Pet</TableHead>
              <TableHead className="hidden md:table-cell">Species</TableHead>
              <TableHead className="hidden md:table-cell">Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pets.map((pet, idx) => (
              <TableRow key={pet.id} data-ocid={`admin.pets.item.${idx + 1}`}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {pet.photoBlobs && pet.photoBlobs.length > 0 ? (
                        <img
                          src={pet.photoBlobs[0].getDirectURL()}
                          alt={pet.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <PawPrint className="h-4 w-4 text-secondary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        {pet.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pet.breed}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground capitalize">
                  {pet.species}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {pet.location || "—"}
                </TableCell>
                <TableCell>
                  {pet.isAdopted ? (
                    <Badge
                      variant="outline"
                      className="text-xs text-success border-success/30"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Adopted
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Available
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link to="/pets/$id" params={{ id: pet.id }}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        data-ocid={`admin.pets.edit_button.${idx + 1}`}
                      >
                        View
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={() => setConfirmPetId(pet.id)}
                      data-ocid={`admin.pets.delete_button.${idx + 1}`}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!confirmPetId}
        onOpenChange={(o) => !o && setConfirmPetId(null)}
      >
        <DialogContent data-ocid="admin.pets.dialog">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Remove Pet Listing?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently remove the pet listing. This action cannot be
            undone.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmPetId(null)}
              data-ocid="admin.pets.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmPetId) {
                  deletePet(confirmPetId);
                  setConfirmPetId(null);
                }
              }}
              data-ocid="admin.pets.confirm_button"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();

  // wasAdminRef: once confirmed admin, stays true to prevent dashboard from
  // hiding during background refetches that briefly return isAdmin=undefined.
  const wasAdminRef = useRef(false);
  // Guard: auto-claim should only fire once per page visit.
  const hasAttemptedClaimRef = useRef(false);

  const {
    data: isAdmin,
    isLoading: adminChecking,
    isFetched: adminFetched,
  } = useIsCallerAdmin();

  // Latch: once we have confirmed the user IS admin, lock wasAdminRef.
  useEffect(() => {
    if (isAdmin === true) {
      wasAdminRef.current = true;
    }
  }, [isAdmin]);

  // Reset latch on logout.
  useEffect(() => {
    if (!identity) {
      wasAdminRef.current = false;
      hasAttemptedClaimRef.current = false;
    }
  }, [identity]);

  // Auto-claim admin if none exists yet.
  // Fires exactly once per session (guarded by hasAttemptedClaimRef) when:
  //   - actor is authenticated and ready
  //   - identity is present
  //   - we definitively know the caller is NOT yet admin
  useEffect(() => {
    if (
      !actor ||
      !identity ||
      actorFetching ||
      isAdmin !== false ||
      !adminFetched ||
      hasAttemptedClaimRef.current
    )
      return;

    hasAttemptedClaimRef.current = true;

    (actor as unknown as ExtendedBackend)
      .forceClaimAdminIfNoneExists()
      .then((claimed) => {
        if (claimed) {
          queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
        } else {
          // Admin is already assigned to someone else -- nothing to do.
        }
      })
      .catch(() => {
        // Function not available or call failed -- reset so a retry is possible
        // on manual refresh, but don't loop.
      });
  }, [actor, identity, actorFetching, isAdmin, adminFetched, queryClient]);

  const { data: stats, isLoading: statsLoading } = useAdminStats();

  // Show loading spinner only on the very first admin check (no data yet).
  const showLoading = isInitializing || (adminChecking && !adminFetched);

  // Not logged in
  if (!identity && !isInitializing && !adminChecking) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Shield className="h-7 w-7 text-muted-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Sign in Required
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            You must be logged in to access the admin panel.
          </p>
          <Link to="/login">
            <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Loading spinner (initial check only)
  if (showLoading) {
    return (
      <div
        className="min-h-[calc(100vh-8rem)] flex items-center justify-center"
        data-ocid="admin.loading_state"
      >
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">
            Checking admin access…
          </p>
        </div>
      </div>
    );
  }

  // Not admin (definitive answer, and auto-claim hasn't resolved yet or failed)
  if (!isAdmin && !wasAdminRef.current) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
          data-ocid="admin.error_state"
        >
          <div className="w-16 h-16 rounded-full bg-destructive/15 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Access Denied
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            {hasAttemptedClaimRef.current
              ? "Admin access is already assigned to another account."
              : "You do not have admin privileges."}
          </p>
          {hasAttemptedClaimRef.current && (
            <p className="text-xs text-muted-foreground">
              If you believe this is an error, please refresh the page.
            </p>
          )}
          <div className="mt-4">
            {!hasAttemptedClaimRef.current && (
              <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin mx-auto" />
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage users and moderate pet listings
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Users}
            label="Total Users"
            value={
              stats?.totalUsers !== undefined
                ? Number(stats.totalUsers)
                : undefined
            }
            loading={statsLoading}
            color="primary"
          />
          <StatCard
            icon={PawPrint}
            label="Total Pets"
            value={
              stats?.totalPets !== undefined
                ? Number(stats.totalPets)
                : undefined
            }
            loading={statsLoading}
            color="secondary"
          />
          <StatCard
            icon={CheckCircle}
            label="Adopted"
            value={
              stats?.adoptedPets !== undefined
                ? Number(stats.adoptedPets)
                : undefined
            }
            loading={statsLoading}
            color="success"
          />
          <StatCard
            icon={MessageSquare}
            label="Conversations"
            value={
              stats?.totalConversations !== undefined
                ? Number(stats.totalConversations)
                : undefined
            }
            loading={statsLoading}
            color="accent"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" data-ocid="admin.tab">
          <TabsList className="mb-6 bg-muted rounded-2xl p-1">
            <TabsTrigger
              value="users"
              className="rounded-xl gap-2"
              data-ocid="admin.users.tab"
            >
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger
              value="pets"
              className="rounded-xl gap-2"
              data-ocid="admin.pets.tab"
            >
              <PawPrint className="h-4 w-4" />
              Pets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="border-border shadow-paw">
              <CardHeader>
                <CardTitle className="font-display text-xl flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Registered Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UsersTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pets">
            <Card className="border-border shadow-paw">
              <CardHeader>
                <CardTitle className="font-display text-xl flex items-center gap-2">
                  <PawPrint className="h-5 w-5 text-secondary" />
                  Pet Listings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PetsTable />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Warnings */}
        {stats && Number(stats.adoptedPets) > Number(stats.totalPets) * 0.9 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex items-center gap-3 p-4 rounded-2xl bg-warning/10 border border-warning/20 text-warning"
            data-ocid="admin.success_state"
          >
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              Over 90% of pets have been adopted — great work!
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
