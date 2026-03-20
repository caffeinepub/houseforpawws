import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Ban,
  BarChart2,
  Heart,
  Loader2,
  MessageSquare,
  MessagesSquare,
  PawPrint,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAdminBanUser,
  useAdminDeletePet,
  useAdminGetAllPets,
  useAdminGetAllUsers,
  useAdminGetBannedUsers,
  useAdminGetStats,
  useAdminUnbanUser,
} from "../hooks/useQueries";

const OWNER_PRINCIPAL =
  "p2fqy-qgzuc-uukdf-hkp5z-yxtnz-6gdx7-ogpj3-7hguy-4iaw3-kyogu-cae";

function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
  index,
}: {
  label: string;
  value: bigint | undefined;
  icon: React.ElementType;
  colorClass: string;
  index: number;
}) {
  return (
    <Card
      className={`border-0 shadow-sm ${colorClass}`}
      data-ocid={`admin.stats.card.${index}`}
    >
      <CardHeader className="pb-2 pt-5 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground/70">
            {label}
          </CardTitle>
          <div className="p-2 rounded-xl bg-white/40">
            <Icon className="h-4 w-4 text-foreground/60" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {value === undefined ? (
          <Skeleton className="h-8 w-20 bg-white/50" />
        ) : (
          <p className="text-3xl font-bold font-display text-foreground">
            {value.toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function PostsTab({ isAdmin }: { isAdmin: boolean }) {
  const { data: pets, isLoading: petsLoading } = useAdminGetAllPets({
    isAdmin,
  });
  const deletePet = useAdminDeletePet();
  const [confirmPetId, setConfirmPetId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleRemove = async () => {
    if (!confirmPetId) return;
    setDeletingId(confirmPetId);
    setConfirmPetId(null);
    try {
      await deletePet.mutateAsync(confirmPetId);
      toast.success("Post removed successfully.");
    } catch {
      toast.error("Failed to remove post.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <ScrollArea className="h-[480px]" data-ocid="admin.posts.table">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-16 font-semibold">Photo</TableHead>
              <TableHead className="font-semibold">Pet Name</TableHead>
              <TableHead className="font-semibold">Species</TableHead>
              <TableHead className="font-semibold">Owner</TableHead>
              <TableHead className="font-semibold">Location</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {petsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: skeleton cells
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : pets?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="admin.posts.empty_state"
                >
                  No pet listings yet.
                </TableCell>
              </TableRow>
            ) : (
              pets?.map((pet, i) => {
                const photoUrl = pet.photoBlobs?.[0]
                  ? pet.photoBlobs[0].getDirectURL()
                  : null;
                const ownerStr = pet.ownerId.toString();
                const ownerTrunc = `${ownerStr.slice(0, 8)}…${ownerStr.slice(-4)}`;
                const isDeleting = deletingId === pet.id;
                return (
                  <TableRow
                    key={pet.id}
                    className="hover:bg-muted/30"
                    data-ocid={`admin.posts.item.${i + 1}`}
                  >
                    <TableCell>
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={pet.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <PawPrint className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{pet.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm capitalize">
                      {pet.species}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs font-mono">
                      {ownerTrunc}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {pet.location || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          pet.isAdopted
                            ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300"
                            : "bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300"
                        }
                      >
                        {pet.isAdopted ? "Adopted" : "Available"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 px-3 text-xs rounded-lg"
                        disabled={isDeleting}
                        onClick={() => setConfirmPetId(pet.id)}
                        data-ocid="admin.post.remove_button"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </ScrollArea>
      <Dialog
        open={!!confirmPetId}
        onOpenChange={(open) => !open && setConfirmPetId(null)}
      >
        <DialogContent className="rounded-2xl" data-ocid="admin.post.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Remove Post?</DialogTitle>
            <DialogDescription>
              This will permanently remove the pet listing. This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmPetId(null)}
              data-ocid="admin.post.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              data-ocid="admin.post.confirm_button"
            >
              Remove Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function UsersTab({ isAdmin }: { isAdmin: boolean }) {
  const { data: users, isLoading: usersLoading } = useAdminGetAllUsers({
    isAdmin,
  });
  const { data: bannedUsers } = useAdminGetBannedUsers({ isAdmin });
  const banUser = useAdminBanUser();
  const unbanUser = useAdminUnbanUser();
  const bannedSet = new Set(
    (bannedUsers ?? []).map((p: Principal) => p.toString()),
  );

  const handleBan = async (principal: Principal) => {
    try {
      await banUser.mutateAsync(principal);
      toast.success("User banned.");
    } catch {
      toast.error("Failed to ban user.");
    }
  };
  const handleUnban = async (principal: Principal) => {
    try {
      await unbanUser.mutateAsync(principal);
      toast.success("User unbanned.");
    } catch {
      toast.error("Failed to unban user.");
    }
  };

  return (
    <ScrollArea className="h-[480px]" data-ocid="admin.users.table">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-12 text-center font-semibold">#</TableHead>
            <TableHead className="font-semibold">Display Name</TableHead>
            <TableHead className="font-semibold">Email</TableHead>
            <TableHead className="font-semibold">Phone</TableHead>
            <TableHead className="font-semibold">Location</TableHead>
            <TableHead className="font-semibold text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usersLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-6 mx-auto" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-44" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-16 ml-auto" />
                </TableCell>
              </TableRow>
            ))
          ) : users?.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center py-12 text-muted-foreground"
                data-ocid="admin.users.empty_state"
              >
                No registered users yet.
              </TableCell>
            </TableRow>
          ) : (
            users?.map(([principal, profile], i) => {
              const principalStr = principal.toString();
              const isBanned = bannedSet.has(principalStr);
              const isBanning =
                banUser.isPending &&
                banUser.variables?.toString() === principalStr;
              const isUnbanning =
                unbanUser.isPending &&
                unbanUser.variables?.toString() === principalStr;
              return (
                <TableRow
                  key={principalStr}
                  className="hover:bg-muted/30"
                  data-ocid="admin.users.row"
                >
                  <TableCell className="text-center text-muted-foreground text-sm">
                    {i + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {profile.displayName || "—"}
                      {isBanned && (
                        <Badge
                          variant="destructive"
                          className="text-xs px-1.5 py-0"
                        >
                          Banned
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {profile.email || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {profile.phone || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {profile.location || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {isBanned ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs rounded-lg border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950/30"
                        disabled={isUnbanning}
                        onClick={() => handleUnban(principal)}
                        data-ocid="admin.user.unban_button"
                      >
                        {isUnbanning ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Unban"
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10"
                        disabled={isBanning}
                        onClick={() => handleBan(principal)}
                        data-ocid="admin.user.ban_button"
                      >
                        {isBanning ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Ban className="h-3 w-3 mr-1" />
                            Ban
                          </>
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}

function StatisticsTab({ isAdmin }: { isAdmin: boolean }) {
  const { data: stats, isLoading: statsLoading } = useAdminGetStats({
    isAdmin,
  });
  const { data: pets, isLoading: petsLoading } = useAdminGetAllPets({
    isAdmin,
  });
  const { data: users, isLoading: usersLoading } = useAdminGetAllUsers({
    isAdmin,
  });
  const { data: bannedUsers } = useAdminGetBannedUsers({ isAdmin });

  const totalPets = stats ? Number(stats.totalPets) : 0;
  const adoptedPets = stats ? Number(stats.adoptedPets) : 0;
  const availablePets = totalPets - adoptedPets;
  const adoptionRate =
    totalPets > 0 ? Math.round((adoptedPets / totalPets) * 100) : 0;
  const totalUsers = stats ? Number(stats.totalUsers) : 0;
  const totalConversations = stats ? Number(stats.totalConversations) : 0;
  const totalMessages = stats ? Number(stats.totalMessages) : 0;
  const bannedCount = bannedUsers?.length ?? 0;
  const avgMessagesPerConv =
    totalConversations > 0
      ? (totalMessages / totalConversations).toFixed(1)
      : "0";

  // Species breakdown from pet data
  const speciesMap: Record<string, number> = {};
  if (pets) {
    for (const pet of pets) {
      const key = pet.species?.toLowerCase() || "unknown";
      speciesMap[key] = (speciesMap[key] ?? 0) + 1;
    }
  }
  const speciesList = Object.entries(speciesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Location breakdown from users
  const locationMap: Record<string, number> = {};
  if (users) {
    for (const [, profile] of users) {
      const loc = profile.location?.trim() || "Unknown";
      locationMap[loc] = (locationMap[loc] ?? 0) + 1;
    }
  }
  const locationList = Object.entries(locationMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const isLoading = statsLoading || petsLoading || usersLoading;

  return (
    <ScrollArea className="h-[560px]">
      <div className="p-6 space-y-6">
        {/* Key metrics grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            {
              label: "Total Users",
              value: totalUsers,
              icon: Users,
              color: "bg-purple-50 dark:bg-purple-950/30",
            },
            {
              label: "Total Pets Listed",
              value: totalPets,
              icon: PawPrint,
              color: "bg-pink-50 dark:bg-pink-950/30",
            },
            {
              label: "Pets Adopted",
              value: adoptedPets,
              icon: Heart,
              color: "bg-rose-50 dark:bg-rose-950/30",
            },
            {
              label: "Pets Available",
              value: availablePets,
              icon: PawPrint,
              color: "bg-green-50 dark:bg-green-950/30",
            },
            {
              label: "Conversations",
              value: totalConversations,
              icon: MessagesSquare,
              color: "bg-blue-50 dark:bg-blue-950/30",
            },
            {
              label: "Messages Sent",
              value: totalMessages,
              icon: MessageSquare,
              color: "bg-peach/30 dark:bg-orange-950/30",
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className={`border-0 shadow-sm ${color}`}>
              <CardContent className="pt-4 pb-4 px-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground font-medium">
                    {label}
                  </span>
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold font-display text-foreground">
                    {value.toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Adoption rate */}
        {!isLoading && (
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500" />
                Adoption Rate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {adoptedPets} of {totalPets} pets adopted
                </span>
                <span className="font-bold font-display text-lg text-rose-500">
                  {adoptionRate}%
                </span>
              </div>
              <Progress value={adoptionRate} className="h-3 rounded-full" />
              <div className="flex gap-4 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
                  Adopted: {adoptedPets}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-pink-300 inline-block" />
                  Available: {availablePets}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Engagement stats */}
        {!isLoading && totalConversations > 0 && (
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MessagesSquare className="h-4 w-4 text-blue-500" />
                Engagement
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/40 rounded-xl">
                <p className="text-2xl font-bold font-display">
                  {avgMessagesPerConv}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Avg messages / conversation
                </p>
              </div>
              <div className="text-center p-3 bg-muted/40 rounded-xl">
                <p className="text-2xl font-bold font-display">
                  {totalUsers > 0
                    ? (totalConversations / totalUsers).toFixed(1)
                    : "0"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Avg conversations / user
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Species breakdown */}
        {speciesList.length > 0 && (
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <PawPrint className="h-4 w-4 text-primary" />
                Pets by Species
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {speciesList.map(([species, count]) => (
                <div key={species} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize text-foreground font-medium">
                      {species}
                    </span>
                    <span className="text-muted-foreground">
                      {count} (
                      {totalPets > 0
                        ? Math.round((count / totalPets) * 100)
                        : 0}
                      %)
                    </span>
                  </div>
                  <Progress
                    value={totalPets > 0 ? (count / totalPets) * 100 : 0}
                    className="h-2 rounded-full"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* User locations */}
        {locationList.length > 0 && (
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                Top User Locations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {locationList.map(([location, count], i) => (
                <div key={location} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4">
                    {i + 1}
                  </span>
                  <span className="text-sm flex-1 truncate text-foreground">
                    {location}
                  </span>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {count} user{count !== 1 ? "s" : ""}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* User safety */}
        {!isLoading && (
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                User Safety
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-xl">
                <p className="text-2xl font-bold font-display text-green-600">
                  {totalUsers - bannedCount}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Active users
                </p>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-xl">
                <p className="text-2xl font-bold font-display text-red-500">
                  {bannedCount}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Banned users
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}

export default function AdminDashboardPage() {
  const { identity } = useInternetIdentity();
  const isOwner = identity?.getPrincipal().toString() === OWNER_PRINCIPAL;

  const { data: stats, isLoading: statsLoading } = useAdminGetStats({
    isAdmin: isOwner,
  });

  if (!isOwner) {
    return (
      <div
        className="min-h-[70vh] flex items-center justify-center"
        data-ocid="admin.error_state"
      >
        <div className="flex flex-col items-center gap-4 text-center max-w-sm px-6">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="h-7 w-7 text-destructive" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Access Denied
          </h2>
          <p className="text-muted-foreground text-sm">
            This page is only accessible to the site owner.
          </p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Pets Listed",
      value: stats?.totalPets,
      icon: PawPrint,
      colorClass: "bg-pink-50 dark:bg-pink-950/30",
    },
    {
      label: "Active Adoptions",
      value: stats?.adoptedPets,
      icon: Heart,
      colorClass: "bg-rose-50 dark:bg-rose-950/30",
    },
    {
      label: "Registered Users",
      value: stats?.totalUsers,
      icon: Users,
      colorClass: "bg-purple-50 dark:bg-purple-950/30",
    },
    {
      label: "Conversations",
      value: stats?.totalConversations,
      icon: MessagesSquare,
      colorClass: "bg-lavender/30 dark:bg-violet-950/30",
    },
    {
      label: "Messages Sent",
      value: stats?.totalMessages,
      icon: MessageSquare,
      colorClass: "bg-peach/30 dark:bg-orange-950/30",
    },
  ];

  return (
    <div
      className="container max-w-6xl py-8 px-4 md:px-8"
      data-ocid="admin.page"
    >
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">🛡️</span>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Moderation Panel
          </h1>
        </div>
        <p className="text-muted-foreground ml-12">
          Monitor posts, view statistics, and manage user accounts — visible
          only to you.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        {statCards.map((card, i) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={statsLoading ? undefined : card.value}
            icon={card.icon}
            colorClass={card.colorClass}
            index={i + 1}
          />
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <Tabs defaultValue="posts">
          <div className="px-6 pt-5 border-b border-border bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Moderation Tools
              </h2>
            </div>
            <TabsList className="bg-white/50 dark:bg-white/10 rounded-xl mb-0 -mb-px">
              <TabsTrigger
                value="posts"
                className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-white/20"
                data-ocid="admin.posts.tab"
              >
                <PawPrint className="h-4 w-4 mr-2" />
                Posts
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-white/20"
                data-ocid="admin.users.tab"
              >
                <Users className="h-4 w-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger
                value="statistics"
                className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-white/20"
                data-ocid="admin.statistics.tab"
              >
                <BarChart2 className="h-4 w-4 mr-2" />
                Statistics
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="posts" className="mt-0">
            <PostsTab isAdmin={isOwner} />
          </TabsContent>
          <TabsContent value="users" className="mt-0">
            <UsersTab isAdmin={isOwner} />
          </TabsContent>
          <TabsContent value="statistics" className="mt-0">
            <StatisticsTab isAdmin={isOwner} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
