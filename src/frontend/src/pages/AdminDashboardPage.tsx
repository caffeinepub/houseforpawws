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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Heart,
  Loader2,
  MessageSquare,
  MessagesSquare,
  PawPrint,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAdminBanUser,
  useAdminDeletePet,
  useAdminGetAllPets,
  useAdminGetAllUsers,
  useAdminGetBannedUsers,
  useAdminGetStats,
  useAdminUnbanUser,
  useIsCallerAdmin,
  useResetAdminToCaller,
} from "../hooks/useQueries";

const ADMIN_TOKEN = "cookiebiscuitoreochickupicku12345";

// ── Stat Card ───────────────────────────────────────────────────────────────

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

// ── Token Gate ───────────────────────────────────────────────────────────────

function AdminTokenGate() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const resetAdmin = useResetAdminToCaller();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (token !== ADMIN_TOKEN) {
      setError("Incorrect token. Please try again.");
      return;
    }

    try {
      await resetAdmin.mutateAsync();
      setSuccess(true);
    } catch {
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-3xl border border-border shadow-lg overflow-hidden">
          <div className="bg-gradient-to-br from-pink-100 via-lavender/40 to-peach/30 dark:from-pink-950/40 dark:via-purple-950/30 dark:to-orange-950/20 px-8 pt-10 pb-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/70 dark:bg-white/10 shadow-sm mb-4">
              <PawPrint className="h-10 w-10 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">
              Moderation Panel
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your admin token to access moderation tools
            </p>
          </div>

          <div className="px-8 py-8">
            {success ? (
              <div
                className="text-center py-4"
                data-ocid="admin.token.success_state"
              >
                <div className="text-3xl mb-3">🎉</div>
                <p className="text-sm font-medium text-primary">
                  Admin access granted! Loading panel...
                </p>
                <div className="flex justify-center gap-1.5 mt-3">
                  <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="admin-token"
                    className="text-sm font-medium text-foreground"
                  >
                    Admin Token
                  </Label>
                  <Input
                    id="admin-token"
                    type="password"
                    placeholder="Enter your secret token"
                    value={token}
                    onChange={(e) => {
                      setToken(e.target.value);
                      setError("");
                    }}
                    className="border-border/60 focus:border-primary/60 rounded-xl h-11"
                    data-ocid="admin.token.input"
                    autoComplete="off"
                  />
                </div>

                {error && (
                  <div
                    className="text-sm text-destructive bg-destructive/8 border border-destructive/20 rounded-xl px-4 py-3"
                    data-ocid="admin.token.error_state"
                  >
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl font-semibold bg-primary hover:bg-primary/90"
                  disabled={resetAdmin.isPending || !token}
                  data-ocid="admin.token.submit_button"
                >
                  {resetAdmin.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Claiming access...
                    </>
                  ) : (
                    "Claim Admin Access"
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Posts Tab ─────────────────────────────────────────────────────────────────

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

      {/* Confirm delete dialog */}
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

// ── Users Tab ─────────────────────────────────────────────────────────────────

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

// ── Moderation Panel Page ──────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();

  const { data: stats, isLoading: statsLoading } = useAdminGetStats({
    isAdmin: isAdmin === true,
  });

  // ── Loading state ────────────────────────────────────────────────────────────
  if (adminLoading) {
    return (
      <div
        className="container max-w-6xl py-12"
        data-ocid="admin.loading_state"
      >
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <div className="text-5xl animate-bounce">🐾</div>
          <p className="text-muted-foreground font-medium">
            Checking access...
          </p>
          <div className="flex gap-2">
            <Skeleton className="h-3 w-3 rounded-full bg-primary/30" />
            <Skeleton className="h-3 w-3 rounded-full bg-primary/30" />
            <Skeleton className="h-3 w-3 rounded-full bg-primary/30" />
          </div>
        </div>
      </div>
    );
  }

  // ── Access denied — show token gate ─────────────────────────────────────────
  if (!isAdmin) {
    return <AdminTokenGate />;
  }

  // ── Moderation Panel ────────────────────────────────────────────────────────
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
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">🛡️</span>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Moderation Panel
          </h1>
        </div>
        <p className="text-muted-foreground ml-12">
          Monitor posts, remove listings, and manage user accounts — visible
          only to you.
        </p>
      </div>

      {/* Stats cards */}
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

      {/* Tabs: Posts & Users */}
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
            </TabsList>
          </div>

          <TabsContent value="posts" className="mt-0">
            <PostsTab isAdmin={isAdmin === true} />
          </TabsContent>

          <TabsContent value="users" className="mt-0">
            <UsersTab isAdmin={isAdmin === true} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
