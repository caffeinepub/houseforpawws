import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Heart,
  MessageSquare,
  MessagesSquare,
  PawPrint,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useActor } from "../hooks/useActor";
import {
  useAdminGetAllUsers,
  useAdminGetStats,
  useIsCallerAdmin,
} from "../hooks/useQueries";

// ── Stat Card ─────────────────────────────────────────────────────────────────

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

// ── Admin Dashboard Page ──────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { actor } = useActor();
  const {
    data: isAdmin,
    isLoading: adminLoading,
    refetch: refetchAdmin,
  } = useIsCallerAdmin();
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);

  const { data: stats, isLoading: statsLoading } = useAdminGetStats({
    isAdmin: isAdmin === true,
  });
  const { data: users, isLoading: usersLoading } = useAdminGetAllUsers({
    isAdmin: isAdmin === true,
  });

  async function handleClaimAdmin() {
    if (!actor) return;
    setClaiming(true);
    setClaimError(null);
    try {
      const ok = await actor.resetAdminToCaller();
      if (ok) {
        setClaimSuccess(true);
        // Poll until admin confirmed
        const poll = setInterval(async () => {
          const result = await refetchAdmin();
          if (result.data === true) {
            clearInterval(poll);
            setClaiming(false);
          }
        }, 800);
      } else {
        setClaimError(
          "Could not claim admin. Make sure you are logged in with the account that owns this app.",
        );
        setClaiming(false);
      }
    } catch (_e) {
      setClaimError("An error occurred. Please try again.");
      setClaiming(false);
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────
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

  // ── Access denied ──────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="container max-w-2xl py-20" data-ocid="admin.denied.panel">
        <div className="text-center bg-card rounded-3xl border border-border p-12 shadow-sm">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 mb-6">
            <ShieldAlert className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Access Denied
          </h1>
          <p className="text-muted-foreground mb-8">
            This page is only available to the app administrator.
          </p>

          {claimSuccess ? (
            <div
              className="flex items-center justify-center gap-2 text-green-600 font-medium"
              data-ocid="admin.claim.success_state"
            >
              <ShieldCheck className="h-5 w-5" />
              Admin granted! Loading dashboard...
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={handleClaimAdmin}
                disabled={claiming}
                className="w-full"
                data-ocid="admin.claim.primary_button"
              >
                {claiming ? "Claiming..." : "Claim Admin (App Owner Only)"}
              </Button>
              {claimError && (
                <p
                  className="text-sm text-destructive"
                  data-ocid="admin.claim.error_state"
                >
                  {claimError}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                This only works for the account that deployed this app.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Admin dashboard ────────────────────────────────────────────────────────
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
          <span className="text-3xl">🐾</span>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Admin Dashboard
          </h1>
        </div>
        <p className="text-muted-foreground ml-12">
          App-wide statistics and user details — visible only to you.
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

      {/* Users table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20">
          <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Registered Users
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {usersLoading ? "Loading..." : `${users?.length ?? 0} total users`}
          </p>
        </div>

        <ScrollArea className="h-[480px]" data-ocid="admin.users.table">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-12 text-center font-semibold">
                  #
                </TableHead>
                <TableHead className="font-semibold">Display Name</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Phone</TableHead>
                <TableHead className="font-semibold">Location</TableHead>
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
                  </TableRow>
                ))
              ) : users?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-12 text-muted-foreground"
                    data-ocid="admin.users.empty_state"
                  >
                    No registered users yet.
                  </TableCell>
                </TableRow>
              ) : (
                users?.map(([principal, profile], i) => (
                  <TableRow
                    key={principal.toString()}
                    className="hover:bg-muted/30"
                    data-ocid="admin.users.row"
                  >
                    <TableCell className="text-center text-muted-foreground text-sm">
                      {i + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {profile.displayName || "—"}
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
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  );
}
