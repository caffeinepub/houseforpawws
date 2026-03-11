import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  BarChart2,
  Heart,
  MessageCircle,
  PawPrint,
  ShieldAlert,
  Users,
} from "lucide-react";
import type { Variants } from "motion/react";
import { motion } from "motion/react";
import {
  useAdminGetAllUsers,
  useAdminGetStats,
  useIsCallerAdmin,
} from "../hooks/useQueries";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

const SKELETON_KEYS = ["sk-a", "sk-b", "sk-c", "sk-d"];

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  ocid,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent: string;
  ocid: string;
}) {
  return (
    <motion.div variants={itemVariants}>
      <Card
        className="relative overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-shadow"
        data-ocid={ocid}
      >
        <div className={`absolute inset-0 opacity-[0.06] ${accent}`} />
        <CardHeader className="pb-2 pt-5 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {label}
            </CardTitle>
            <div className={`p-2 rounded-xl ${accent} bg-opacity-15`}>
              <Icon className="h-4 w-4 text-foreground/70" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <p className="font-display text-4xl font-bold text-foreground tracking-tight">
            {value}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function StatsDashboardPage() {
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useAdminGetStats();
  const {
    data: users,
    isLoading: usersLoading,
    isError: usersError,
  } = useAdminGetAllUsers();

  if (adminLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-[60vh]"
        data-ocid="stats.loading_state"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
            <BarChart2 className="h-6 w-6 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm font-medium">
            Verifying access…
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        className="flex items-center justify-center min-h-[60vh]"
        data-ocid="stats.error_state"
      >
        <div className="flex flex-col items-center gap-4 text-center max-w-sm px-6">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="h-7 w-7 text-destructive" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Access Denied
          </h2>
          <p className="text-muted-foreground text-sm">
            This page is only accessible to the site administrator.
          </p>
        </div>
      </div>
    );
  }

  const totalPets = stats ? Number(stats.totalPets) : 0;
  const adoptedPets = stats ? Number(stats.adoptedPets) : 0;
  const adoptionRate =
    totalPets > 0 ? Math.round((adoptedPets / totalPets) * 100) : 0;

  return (
    <div className="min-h-screen bg-background" data-ocid="stats.page">
      {/* Hero header */}
      <div className="bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 border-b border-border/50">
        <div className="container py-10 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <BarChart2 className="h-5 w-5 text-primary" />
              </div>
              <Badge variant="secondary" className="text-xs font-medium">
                Admin Only
              </Badge>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Site Statistics
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Demographics and platform analytics — visible only to you.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container py-8 max-w-6xl space-y-8">
        {/* Stat cards */}
        {statsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {SKELETON_KEYS.map((k) => (
              <Card key={k} className="p-5">
                <Skeleton className="h-4 w-24 mb-4" />
                <Skeleton className="h-10 w-16" />
              </Card>
            ))}
          </div>
        ) : statsError ? (
          <div className="text-sm text-destructive bg-destructive/10 rounded-xl p-4">
            Failed to load statistics.
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <StatCard
              icon={Users}
              label="Total Users"
              value={stats ? stats.totalUsers.toString() : "0"}
              accent="bg-blue-400"
              ocid="stats.total_users.card"
            />
            <StatCard
              icon={PawPrint}
              label="Total Pets"
              value={stats ? stats.totalPets.toString() : "0"}
              accent="bg-pink-400"
              ocid="stats.total_pets.card"
            />
            <StatCard
              icon={Heart}
              label="Adopted Pets"
              value={stats ? stats.adoptedPets.toString() : "0"}
              accent="bg-rose-400"
              ocid="stats.adopted_pets.card"
            />
            <StatCard
              icon={MessageCircle}
              label="Conversations"
              value={stats ? stats.totalConversations.toString() : "0"}
              accent="bg-violet-400"
              ocid="stats.conversations.card"
            />
          </motion.div>
        )}

        {/* Adoption rate highlight */}
        {!statsLoading && !statsError && stats && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <Card className="border-border/60 bg-gradient-to-r from-rose-50/60 to-pink-50/60 dark:from-rose-950/20 dark:to-pink-950/20">
              <CardContent className="flex items-center gap-5 py-5 px-6">
                <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                  <Heart className="h-7 w-7 text-rose-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                    Adoption Rate
                  </p>
                  <p className="font-display text-3xl font-bold text-foreground">
                    {adoptionRate}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {adoptedPets} of {totalPets} pets have found forever homes
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Users table */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <Card className="border-border/60" data-ocid="stats.users.table">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base font-semibold">
                  Registered Users
                </CardTitle>
                {users && (
                  <Badge variant="secondary" className="text-xs ml-auto">
                    {users.length} total
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {usersLoading ? (
                <div className="p-6 space-y-3">
                  {SKELETON_KEYS.map((k) => (
                    <Skeleton key={k} className="h-10 w-full" />
                  ))}
                </div>
              ) : usersError ? (
                <div className="p-6 text-sm text-destructive">
                  Failed to load user data.
                </div>
              ) : !users || users.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground text-sm">
                  No registered users yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-border/50">
                        <TableHead className="text-xs font-semibold text-muted-foreground pl-6">
                          #
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">
                          Display Name
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">
                          Email
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">
                          Phone
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">
                          Location
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground pr-6">
                          Bio
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map(([principal, profile], index) => (
                        <TableRow
                          key={principal.toString()}
                          className="border-border/30 hover:bg-muted/30"
                          data-ocid="stats.users.row"
                        >
                          <TableCell className="text-muted-foreground text-xs pl-6">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-medium text-sm">
                            {profile.displayName || (
                              <span className="text-muted-foreground italic">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {profile.email || <span className="italic">—</span>}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {profile.phone || <span className="italic">—</span>}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {profile.location || (
                              <span className="italic">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] pr-6">
                            <span className="truncate block">
                              {profile.bio ? (
                                profile.bio.length > 60 ? (
                                  `${profile.bio.slice(0, 60)}…`
                                ) : (
                                  profile.bio
                                )
                              ) : (
                                <span className="italic">—</span>
                              )}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
