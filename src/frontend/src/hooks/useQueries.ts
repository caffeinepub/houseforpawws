import { Principal } from "@icp-sdk/core/principal";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  ConversationView,
  FullUserProfile,
  MessageView,
  Pet,
  PublicUserProfile,
  UserProfileResult,
} from "../backend";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Normalise a UserProfileResult to the public-safe shape */
function normaliseProfileResult(
  result: UserProfileResult | null,
): PublicUserProfile | null {
  if (!result) return null;
  if (result.__kind__ === "full") {
    const { bio, displayName, profilePhoto, location } = result.full;
    return { bio, displayName, profilePhoto, location };
  }
  return result.publicView;
}

// ── User Profile ────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { isInitializing, identity } = useInternetIdentity();

  // The auth hook's `finally` block unconditionally resets loginStatus to
  // "idle" after init -- even after a successful login.  That makes
  // `isInitializing` briefly flip true→false→true→false on every login,
  // which would disable this query for a tick and cause the profile to flash
  // null.  We therefore gate on the actor being present (actor is only created
  // once identity is stable) rather than on isInitializing.
  //
  // We still wait for the very first initialisation to complete (no actor yet)
  // so anonymous users don't see a spurious ProfileSetupModal.
  const actorReady = !!actor && !actorFetching;

  const query = useQuery<FullUserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: actorReady,
    retry: 2,
    retryDelay: 1000,
    // Hold the last known value during background refetches so callers never
    // see a spurious null that would re-open the ProfileSetupModal.
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    // Deduplicate rapid successive fetches triggered by the actor invalidation
    // sweep that fires on every identity change.
    refetchOnWindowFocus: false,
  });

  // isLoading = true only on the genuine first fetch (no data at all yet).
  // Background refetches are invisible to callers.
  const hasData = query.data !== undefined;
  const firstLoad =
    !hasData && (isInitializing || !actorReady || query.isLoading);

  return {
    ...query,
    isLoading: firstLoad,
    // isFetched: true once we have confirmed the actor ran at least one fetch.
    isFetched: actorReady && query.isFetched,
    // isRefetching lets callers distinguish first-load from background refresh.
    isRefetching: query.isFetching && query.isFetched,
    // Expose the stable identity reference so App.tsx can use it as a
    // session-change signal without depending on the flaky loginStatus.
    identity,
  };
}

/** Returns normalised public-safe profile (no email/phone) for any user */
export function useGetUserProfile(principal: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<PublicUserProfile | null>({
    queryKey: ["userProfile", principal],
    queryFn: async () => {
      if (!actor || !principal) return null;
      const result = await actor.getUserProfile(Principal.fromText(principal));
      return normaliseProfileResult(result);
    },
    enabled: !!actor && !actorFetching && !!principal,
    placeholderData: keepPreviousData,
  });
}

/** Returns full profile (with email/phone) for the current user's own views */
export function useGetFullUserProfile(principal: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<FullUserProfile | null>({
    queryKey: ["fullUserProfile", principal],
    queryFn: async () => {
      if (!actor || !principal) return null;
      const result = await actor.getUserProfile(Principal.fromText(principal));
      if (!result) return null;
      if (result.__kind__ === "full") return result.full;
      return null;
    },
    enabled: !!actor && !actorFetching && !!principal,
    placeholderData: keepPreviousData,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: FullUserProfile) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// ── Pets ────────────────────────────────────────────────────────────────────

export function useGetAllPets() {
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

export function useGetPet(petId: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<Pet | null>({
    queryKey: ["pet", petId],
    queryFn: async () => {
      if (!actor || !petId) return null;
      return actor.getPet(petId);
    },
    enabled: !!actor && !actorFetching && !!petId,
  });
}

export function useCreatePet() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pet: Pet) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.createPet(pet);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPets"] });
    },
  });
}

export function useUpdatePet() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ petId, pet }: { petId: string; pet: Pet }) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.updatePet(petId, pet);
    },
    onSuccess: (_data, { petId }) => {
      queryClient.invalidateQueries({ queryKey: ["allPets"] });
      queryClient.invalidateQueries({ queryKey: ["pet", petId] });
    },
  });
}

export function useDeletePet() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (petId: string) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.deletePet(petId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPets"] });
    },
  });
}

// ── Conversations & Messages ─────────────────────────────────────────────────

export function useGetMyConversations() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<ConversationView[]>({
    queryKey: ["myConversations"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyConversations();
    },
    enabled: !!actor && !actorFetching && !!identity,
    refetchInterval: 5000,
  });
}

export function useGetMessages(conversationId: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<MessageView[]>({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!actor || !conversationId) return [];
      return actor.getMessages(conversationId);
    },
    enabled: !!actor && !actorFetching && !!conversationId && !!identity,
    refetchInterval: 3000,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conversationId,
      text,
    }: { conversationId: string; text: string }) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.sendMessage(conversationId, text);
    },
    onSuccess: (_data, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["myConversations"] });
    },
  });
}

export function useStartOrGetConversation() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (otherUser: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.startOrGetConversation(Principal.fromText(otherUser));
    },
  });
}
