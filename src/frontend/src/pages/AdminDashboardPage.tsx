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
  Loader2,
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
    // When the actor's mass-invalidation sweep marks this query stale, keep
    // the last confirmed value visible instead of briefly returning undefined.
    // This prevents the "Access Denied" flash that occurred when isAdmin
    // transiently reset to false mid-refetch.
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

function useAdminBanUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.adminBanUser(user);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminBannedUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminAllUsers"] });
      toast.success("User banned successfully.");
    },
    onError: () => toast.error("Failed to ban user."),
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
      queryClient.invalidateQueries({ queryKey: ["adminBannedUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminAllUsers"] });
      toast.success("User unbanned successfully.");
    },
    onError: () => toast.error("Failed to unban user."),
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
      queryClient.invalidateQueries({ queryKey: ["allPets"] });
      toast.success("Pet listing deleted.");
    },
    onError: () => toast.error("Failed to delete pet listing."),
  });
}

function useAdminGetAllPets() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<Pet[]>({
    queryKey: ["allPets"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPets();
    },
    enabled: !!actor && !actorFetching,
  });
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: bigint | undefined;
  icon: React.ReactNode;
  color: string;
  isLoading: boolean;
  index: number;
}

function StatCard({
  title,
  value,
  icon,
  color,
  isLoading,
  index,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
      data-ocid="admin.stats.card"
    >
      <Card className="border border-border shadow-sm hover:shadow-md transition-shadow bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}
          >
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton
              className="h-9 w-24"
              data-ocid="admin.stats.loading_state"
            />
          ) : (
            <p className="text-3xl font-display font-bold text-foreground">
              {value !== undefined ? Number(value).toLocaleString() : "—"}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab() {
  const { data: stats, isLoading } = useAdminStats();

  const cards = [
    {
      title: "Total Users",
      value: stats?.totalUsers,
      icon: <Users className="h-4 w-4 text-white" />,
      color: "bg-primary",
    },
    {
      title: "Total Pets Listed",
      value: stats?.totalPets,
      icon: <PawPrint className="h-4 w-4 text-white" />,
      color: "bg-[oklch(0.72_0.12_280)]",
    },
    {
      title: "Adopted Pets",
      value: stats?.adoptedPets,
      icon: <CheckCircle className="h-4 w-4 text-white" />,
      color: "bg-[oklch(0.65_0.14_150)]",
    },
    {
      title: "Active Conversations",
      value: stats?.totalConversations,
      icon: <MessageSquare className="h-4 w-4 text-white" />,
      color: "bg-[oklch(0.72_0.12_50)]",
    },
  ];

  const adoptionRate =
    stats && Number(stats.totalPets) > 0
      ? Math.round((Number(stats.adoptedPets) / Number(stats.totalPets)) * 100)
      : 0;

  return (
    <section data-ocid="admin.overview.section">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card, i) => (
          <StatCard
            key={card.title}
            {...card}
            isLoading={isLoading}
            index={i}
          />
        ))}
      </div>

      {/* Adoption rate bar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="font-display text-lg text-foreground">
              Adoption Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-6 w-full rounded-full" />
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{adoptionRate}% of listed pets adopted</span>
                  <span>
                    {stats
                      ? `${Number(stats.adoptedPets)} / ${Number(stats.totalPets)}`
                      : "—"}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${adoptionRate}%` }}
                    transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
}

// ── User Detail Modal ─────────────────────────────────────────────────────────

interface UserDetailModalProps {
  open: boolean;
  onClose: () => void;
  principal: Principal | null;
  profile: FullUserProfile | null;
  isBanned: boolean;
  onBan: () => void;
  onUnban: () => void;
  isBanning: boolean;
  isUnbanning: boolean;
}

function UserDetailModal({
  open,
  onClose,
  principal,
  profile,
  isBanned,
  onBan,
  onUnban,
  isBanning,
  isUnbanning,
}: UserDetailModalProps) {
  if (!principal || !profile) return null;

  const principalStr = principal.toString();
  const initials = profile.displayName?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-md bg-card border border-border rounded-2xl"
        data-ocid="admin.users.detail.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            User Details
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-border">
              {profile.profilePhoto && (
                <AvatarImage
                  src={profile.profilePhoto.getDirectURL()}
                  alt={profile.displayName}
                />
              )}
              <AvatarFallback className="bg-primary/20 text-primary text-lg font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-display font-semibold text-lg text-foreground">
                {profile.displayName || "Unnamed"}
              </p>
              <Badge
                variant={isBanned ? "destructive" : "secondary"}
                className="mt-1"
              >
                {isBanned ? "Banned" : "Active"}
              </Badge>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="bg-muted/50 rounded-xl p-3 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Email</span>
                <span className="text-foreground truncate max-w-[60%]">
                  {profile.email || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Phone</span>
                <span className="text-foreground">{profile.phone || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">
                  Location
                </span>
                <span className="text-foreground">
                  {profile.location || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Bio</span>
                <span className="text-foreground text-right max-w-[60%] line-clamp-3">
                  {profile.bio || "—"}
                </span>
              </div>
            </div>
            <div className="bg-muted/50 rounded-xl p-3">
              <p className="text-muted-foreground font-medium mb-1 text-xs">
                Principal ID
              </p>
              <p className="text-foreground font-mono text-xs break-all">
                {principalStr}
              </p>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 flex-row justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-full"
            data-ocid="admin.users.detail.close_button"
          >
            Close
          </Button>
          {isBanned ? (
            <Button
              onClick={onUnban}
              disabled={isUnbanning}
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <UserCheck className="h-4 w-4 mr-1.5" />
              {isUnbanning ? "Unbanning..." : "Unban User"}
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={onBan}
              disabled={isBanning}
              className="rounded-full"
            >
              <Ban className="h-4 w-4 mr-1.5" />
              {isBanning ? "Banning..." : "Ban User"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab() {
  const { data: users, isLoading: usersLoading } = useAdminAllUsers();
  const { data: bannedUsers } = useAdminBannedUsers();
  const banMutation = useAdminBanUser();
  const unbanMutation = useAdminUnbanUser();

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    principal: Principal;
    profile: FullUserProfile;
  } | null>(null);

  const bannedSet = new Set((bannedUsers ?? []).map((p) => p.toString()));

  const handleOpenDetail = (principal: Principal, profile: FullUserProfile) => {
    setSelectedUser({ principal, profile });
    setDetailOpen(true);
  };

  const handleBan = (principal: Principal) => {
    banMutation.mutate(principal, {
      onSuccess: () => setDetailOpen(false),
    });
  };

  const handleUnban = (principal: Principal) => {
    unbanMutation.mutate(principal, {
      onSuccess: () => setDetailOpen(false),
    });
  };

  if (usersLoading) {
    return (
      <div className="space-y-3" data-ocid="admin.users.loading_state">
        {["u1", "u2", "u3", "u4", "u5"].map((k) => (
          <Skeleton key={k} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-center"
        data-ocid="admin.users.empty_state"
      >
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
          <Users className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="font-display text-lg font-semibold text-foreground">
          No users yet
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Registered users will appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className="rounded-2xl border border-border overflow-hidden bg-card"
        data-ocid="admin.users.table"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-semibold text-foreground/80">
                User
              </TableHead>
              <TableHead className="font-semibold text-foreground/80 hidden lg:table-cell">
                Email
              </TableHead>
              <TableHead className="font-semibold text-foreground/80 hidden xl:table-cell">
                Phone
              </TableHead>
              <TableHead className="font-semibold text-foreground/80 hidden md:table-cell">
                Location
              </TableHead>
              <TableHead className="font-semibold text-foreground/80">
                Status
              </TableHead>
              <TableHead className="font-semibold text-foreground/80 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(([principal, profile], idx) => {
              const principalStr = principal.toString();
              const isBanned = bannedSet.has(principalStr);
              const initials =
                profile.displayName?.slice(0, 2).toUpperCase() ?? "??";
              const rowIndex = idx + 1;

              return (
                <TableRow
                  key={principalStr}
                  className="hover:bg-muted/20 transition-colors"
                  data-ocid={`admin.users.row.${rowIndex}`}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        {profile.profilePhoto && (
                          <AvatarImage
                            src={profile.profilePhoto.getDirectURL()}
                            alt={profile.displayName}
                          />
                        )}
                        <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {profile.displayName || "Unnamed"}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">
                          {principalStr.slice(0, 14)}…
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <p className="text-sm text-foreground truncate max-w-[180px]">
                      {profile.email || "—"}
                    </p>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <p className="text-sm text-foreground">
                      {profile.phone || "—"}
                    </p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p className="text-sm text-foreground">
                      {profile.location || "—"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={isBanned ? "destructive" : "secondary"}
                      className={
                        isBanned
                          ? ""
                          : "bg-[oklch(0.9_0.08_150)] text-[oklch(0.4_0.12_150)] border-[oklch(0.8_0.1_150)]"
                      }
                    >
                      {isBanned ? "Banned" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full text-xs hover:bg-primary/10 hover:text-primary"
                        onClick={() => handleOpenDetail(principal, profile)}
                        data-ocid={`admin.users.detail.open_modal_button.${rowIndex}`}
                      >
                        View Details
                      </Button>
                      {isBanned ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full text-xs"
                          onClick={() => handleUnban(principal)}
                          disabled={unbanMutation.isPending}
                          data-ocid={`admin.users.ban_button.${rowIndex}`}
                        >
                          <UserCheck className="h-3 w-3 mr-1" />
                          Unban
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => handleBan(principal)}
                          disabled={banMutation.isPending}
                          data-ocid={`admin.users.ban_button.${rowIndex}`}
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

      <UserDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        principal={selectedUser?.principal ?? null}
        profile={selectedUser?.profile ?? null}
        isBanned={
          selectedUser
            ? bannedSet.has(selectedUser.principal.toString())
            : false
        }
        onBan={() => selectedUser && handleBan(selectedUser.principal)}
        onUnban={() => selectedUser && handleUnban(selectedUser.principal)}
        isBanning={banMutation.isPending}
        isUnbanning={unbanMutation.isPending}
      />
    </>
  );
}

// ── Pets Tab ──────────────────────────────────────────────────────────────────

function PetsTab() {
  const { data: pets, isLoading } = useAdminGetAllPets();
  const deleteMutation = useAdminDeletePet();
  const [confirmPetId, setConfirmPetId] = useState<string | null>(null);

  const handleDeleteConfirm = () => {
    if (!confirmPetId) return;
    deleteMutation.mutate(confirmPetId, {
      onSuccess: () => setConfirmPetId(null),
      onError: () => setConfirmPetId(null),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3" data-ocid="admin.pets.loading_state">
        {["p1", "p2", "p3", "p4", "p5"].map((k) => (
          <Skeleton key={k} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!pets || pets.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-center"
        data-ocid="admin.pets.empty_state"
      >
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
          <PawPrint className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="font-display text-lg font-semibold text-foreground">
          No pet listings
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Pet listings will appear here once users post them.
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className="rounded-2xl border border-border overflow-hidden bg-card"
        data-ocid="admin.pets.table"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-semibold text-foreground/80">
                Pet
              </TableHead>
              <TableHead className="font-semibold text-foreground/80 hidden sm:table-cell">
                Species / Breed
              </TableHead>
              <TableHead className="font-semibold text-foreground/80 hidden md:table-cell">
                Location
              </TableHead>
              <TableHead className="font-semibold text-foreground/80">
                Status
              </TableHead>
              <TableHead className="font-semibold text-foreground/80 hidden lg:table-cell">
                Owner
              </TableHead>
              <TableHead className="font-semibold text-foreground/80 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pets.map((pet, idx) => {
              const rowIndex = idx + 1;
              const ownerStr = pet.ownerId.toString();

              return (
                <TableRow
                  key={pet.id}
                  className="hover:bg-muted/20 transition-colors"
                  data-ocid={`admin.pets.row.${rowIndex}`}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {pet.photoBlobs.length > 0 ? (
                        <img
                          src={pet.photoBlobs[0].getDirectURL()}
                          alt={pet.name}
                          className="h-10 w-10 rounded-xl object-cover shrink-0 border border-border"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                          <PawPrint className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {pet.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {pet.age}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <p className="text-sm text-foreground capitalize">
                      {pet.species}
                    </p>
                    <p className="text-xs text-muted-foreground">{pet.breed}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p className="text-sm text-foreground">
                      {pet.location || "—"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        pet.isAdopted
                          ? "bg-[oklch(0.9_0.08_150)] text-[oklch(0.4_0.12_150)] border-[oklch(0.8_0.1_150)]"
                          : "bg-primary/15 text-primary border-primary/30"
                      }
                    >
                      {pet.isAdopted ? "Adopted" : "Available"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <p className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">
                      {ownerStr.slice(0, 14)}…
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-xs text-destructive hover:bg-destructive/10"
                      onClick={() => setConfirmPetId(pet.id)}
                      data-ocid={`admin.pets.delete_button.${rowIndex}`}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Confirm delete dialog */}
      <Dialog
        open={!!confirmPetId}
        onOpenChange={(v) => !v && setConfirmPetId(null)}
      >
        <DialogContent
          className="sm:max-w-sm bg-card border border-border rounded-2xl"
          data-ocid="admin.pets.confirm.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Pet Listing?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently remove the pet listing. This action cannot be
            undone.
          </p>
          <DialogFooter className="gap-2 flex-row justify-end">
            <Button
              variant="outline"
              onClick={() => setConfirmPetId(null)}
              className="rounded-full"
              data-ocid="admin.pets.confirm.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="rounded-full"
              data-ocid="admin.pets.confirm.confirm_button"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Admin Dashboard Page ──────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();
  // wasAdminRef: once confirmed admin, stays true to prevent dashboard from hiding
  const wasAdminRef = useRef(false);

  const {
    data: isAdmin,
    isLoading: adminChecking,
    isFetched: adminFetched,
  } = useIsCallerAdmin();

  // Latch: once we have confirmed the user IS admin, lock wasAdminRef
  useEffect(() => {
    if (isAdmin === true) {
      wasAdminRef.current = true;
    }
  }, [isAdmin]);

  // Reset latch on logout (identity gone)
  useEffect(() => {
    if (!identity) {
      wasAdminRef.current = false;
    }
  }, [identity]);

  // Auto-claim admin if none exists yet: fires once when actor is ready,
  // identity is set, and we definitively know the caller is NOT admin.
  useEffect(() => {
    if (
      !actor ||
      !identity ||
      actorFetching ||
      isAdmin !== false ||
      !adminFetched
    )
      return;
    (actor as any)
      .forceClaimAdminIfNoneExists()
      .then((claimed) => {
        if (claimed) {
          queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
        }
      })
      .catch(() => {});
  }, [actor, identity, actorFetching, isAdmin, adminFetched, queryClient]);

  // Show loading only on the very first admin check (no data yet).
  // Do NOT show loading for background refetches once we know the answer.
  const showLoading = isInitializing || (adminChecking && !adminFetched);

  // Not logged in (and auth has finished initializing)
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

  // Loading spinner (initial check only, not background refetches)
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

  // Not admin (and we have a definitive answer) — show access denied with
  // a spinner while the auto-claim effect races to grant access.
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
            You don&apos;t have permission to access the admin dashboard.
          </p>
          <Link to="/">
            <Button
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              data-ocid="admin.back.button"
            >
              Back to Home
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-6xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage users, listings, and monitor platform activity
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-muted/50 rounded-xl p-1 mb-6 border border-border">
          <TabsTrigger
            value="overview"
            className="rounded-lg font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm"
            data-ocid="admin.overview.tab"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="rounded-lg font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm"
            data-ocid="admin.users.tab"
          >
            Users
          </TabsTrigger>
          <TabsTrigger
            value="pets"
            className="rounded-lg font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm"
            data-ocid="admin.pets.tab"
          >
            Pet Listings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="users">
          <UsersTab />
        </TabsContent>

        <TabsContent value="pets">
          <PetsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
