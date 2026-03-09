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
  const { isInitializing } = useInternetIdentity();
  const query = useQuery<FullUserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    // Don't fire until auth is fully initialized AND the actor is ready
    enabled: !isInitializing && !!actor && !actorFetching,
    // Retry a couple of times to handle transient actor-not-ready errors
    retry: 2,
    retryDelay: 1000,
    // Keep previously fetched profile data while re-fetching to avoid
    // "null flash" that incorrectly triggers the ProfileSetupModal.
    // keepPreviousData ensures that during a background refetch triggered by
    // the actor's query-invalidation sweep, the last confirmed value is still
    // returned instead of temporarily returning undefined/null.
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
  return {
    ...query,
    isLoading: isInitializing || actorFetching || query.isLoading,
    isFetched: !isInitializing && !!actor && query.isFetched,
    // isRefetching is exposed so callers can distinguish "first load" from
    // "background refresh triggered by actor change".
    isRefetching: query.isFetching && query.isFetched,
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
