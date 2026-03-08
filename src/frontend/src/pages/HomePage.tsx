import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Link } from "@tanstack/react-router";
import { Filter, PawPrint, Search, SlidersHorizontal } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import PetCard from "../components/PetCard";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetAllPets } from "../hooks/useQueries";

const SPECIES_OPTIONS = ["All", "Dog", "Cat", "Bird", "Rabbit", "Other"];

export default function HomePage() {
  const { data: pets, isLoading } = useGetAllPets();
  const { identity } = useInternetIdentity();
  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [tagFilter, setTagFilter] = useState("");

  const filtered = useMemo(() => {
    if (!pets) return [];
    return pets.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.breed.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      const matchSpecies =
        speciesFilter === "All" || p.species === speciesFilter;
      const matchLocation =
        !locationFilter ||
        p.location.toLowerCase().includes(locationFilter.toLowerCase());
      const matchAvailable = !showAvailableOnly || !p.isAdopted;
      const matchTag =
        !tagFilter ||
        p.tags.some((t) => t.toLowerCase().includes(tagFilter.toLowerCase()));
      return (
        matchSearch &&
        matchSpecies &&
        matchLocation &&
        matchAvailable &&
        matchTag
      );
    });
  }, [
    pets,
    search,
    speciesFilter,
    locationFilter,
    showAvailableOnly,
    tagFilter,
  ]);

  const hasActiveFilters =
    speciesFilter !== "All" || locationFilter || showAvailableOnly || tagFilter;

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-pink-soft via-background to-lavender-soft py-16 md:py-24 noise-bg">
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <Badge className="mb-4 bg-primary/15 text-primary border-0 rounded-full px-3 py-1 text-sm">
              🐾 Find your forever friend
            </Badge>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground leading-tight mb-4">
              Every pet deserves a{" "}
              <span className="text-primary">loving home.</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg">
              Connect with pets waiting for adoption in your area. Browse,
              message owners, and open your heart.
            </p>
            <div className="flex flex-wrap gap-3">
              {!identity ? (
                <>
                  <Link to="/register">
                    <Button
                      size="lg"
                      className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-paw"
                      data-ocid="home.register.button"
                    >
                      Get Started
                    </Button>
                  </Link>
                  <a href="#browse">
                    <Button
                      size="lg"
                      variant="outline"
                      className="rounded-full"
                      data-ocid="home.browse.button"
                    >
                      Browse Pets
                    </Button>
                  </a>
                </>
              ) : (
                <Link to="/pets/new">
                  <Button
                    size="lg"
                    className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-paw"
                    data-ocid="home.list_pet.button"
                  >
                    + List a Pet
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        </div>
        {/* Decorative paw prints */}
        <div className="absolute right-8 top-8 text-primary/10 text-8xl select-none pointer-events-none hidden lg:block">
          🐾
        </div>
        <div className="absolute right-32 bottom-8 text-primary/8 text-5xl select-none pointer-events-none hidden lg:block">
          🐾
        </div>
      </section>

      {/* Browse Section */}
      <section id="browse" className="container py-10">
        {/* Search + Filter Bar */}
        <div className="space-y-4 mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, breed, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-full border-border"
                data-ocid="home.search_input"
              />
            </div>
            <Button
              variant={showFilters || hasActiveFilters ? "default" : "outline"}
              onClick={() => setShowFilters((v) => !v)}
              className={`rounded-full gap-2 ${showFilters || hasActiveFilters ? "bg-primary text-primary-foreground" : ""}`}
              data-ocid="home.filter.toggle"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge className="bg-primary-foreground text-primary h-4 w-4 p-0 flex items-center justify-center text-xs rounded-full ml-0.5">
                  !
                </Badge>
              )}
            </Button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl border border-border p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
              data-ocid="home.filter.panel"
            >
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-medium">
                  Species
                </Label>
                <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
                  <SelectTrigger
                    className="rounded-lg"
                    data-ocid="home.species.select"
                  >
                    <SelectValue placeholder="All species" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIES_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-medium">
                  Location
                </Label>
                <Input
                  placeholder="Filter by city..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="rounded-lg"
                  data-ocid="home.location.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-medium">
                  Tag
                </Label>
                <Input
                  placeholder="e.g. playful, calm..."
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="rounded-lg"
                  data-ocid="home.tag.input"
                />
              </div>
              <div className="flex items-end gap-3 pb-0.5">
                <Switch
                  id="available-only"
                  checked={showAvailableOnly}
                  onCheckedChange={setShowAvailableOnly}
                  data-ocid="home.available_only.switch"
                />
                <Label
                  htmlFor="available-only"
                  className="text-sm cursor-pointer"
                >
                  Available only
                </Label>
              </div>
            </motion.div>
          )}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading..."
              : `${filtered.length} pet${filtered.length !== 1 ? "s" : ""} found`}
          </p>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSpeciesFilter("All");
                setLocationFilter("");
                setShowAvailableOnly(false);
                setTagFilter("");
              }}
              className="text-xs text-muted-foreground hover:text-primary"
              data-ocid="home.clear_filters.button"
            >
              Clear filters
            </Button>
          )}
        </div>

        {/* Pet Grid */}
        {isLoading ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            data-ocid="pets.loading_state"
          >
            {["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"].map((sk) => (
              <div
                key={sk}
                className="bg-card rounded-2xl overflow-hidden border border-border"
              >
                <Skeleton className="aspect-[4/3] w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20" data-ocid="pets.empty_state">
            <div className="text-6xl mb-4 animate-paw-bounce">🐾</div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              No pets found
            </h3>
            <p className="text-muted-foreground mb-6">
              {search || hasActiveFilters
                ? "Try adjusting your search or filters."
                : "Be the first to list a pet for adoption!"}
            </p>
            {identity && (
              <Link to="/pets/new">
                <Button
                  className="rounded-full bg-primary text-primary-foreground"
                  data-ocid="home.list_first_pet.button"
                >
                  List a Pet
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.05 } },
            }}
          >
            {filtered.map((pet, i) => (
              <motion.div
                key={pet.id}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.3 }}
              >
                <PetCard pet={pet} index={i + 1} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
}
