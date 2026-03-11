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
  Stats,
  UserProfileResult,
} from "../backend";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

// ── Helpers ──────────────────────────────────────────────────────────────────

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

  const principal = identity?.getPrincipal().toString();
  const actorReady = !!actor && !actorFetching;

  const query = useQuery<FullUserProfile | null>({
    queryKey: ["currentUserProfile", principal ?? "anonymous"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: actorReady,
    retry: 2,
    retryDelay: 1000,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  const hasData = query.data !== undefined;
  const firstLoad =
    !hasData && (isInitializing || !actorReady || query.isLoading);

  return {
    ...query,
    isLoading: firstLoad,
    isFetched: actorReady && query.isFetched,
    isRefetching: query.isFetching && query.isFetched,
    identity,
  };
}

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
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

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
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const principal = identity?.getPrincipal().toString();
  return useMutation({
    mutationFn: async (profile: FullUserProfile) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["currentUserProfile", principal ?? "anonymous"],
      });
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
    staleTime: 60_000,
    refetchOnWindowFocus: false,
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
    staleTime: 60_000,
    refetchOnWindowFocus: false,
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
  const principal = identity?.getPrincipal().toString();
  return useQuery<ConversationView[]>({
    queryKey: ["myConversations", principal ?? "anonymous"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyConversations();
    },
    enabled: !!actor && !actorFetching && !!identity,
    // Only poll when tab is visible, at a slower rate
    refetchInterval: (_query) =>
      document.visibilityState === "visible" ? 15_000 : false,
    refetchIntervalInBackground: false,
    staleTime: 10_000,
  });
}

export function useGetMessages(conversationId: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();
  return useQuery<MessageView[]>({
    queryKey: ["messages", conversationId, principal ?? "anonymous"],
    queryFn: async () => {
      if (!actor || !conversationId) return [];
      return actor.getMessages(conversationId);
    },
    enabled: !!actor && !actorFetching && !!conversationId && !!identity,
    // Poll messages only when tab is visible
    refetchInterval: (_query) =>
      document.visibilityState === "visible" ? 5_000 : false,
    refetchIntervalInBackground: false,
    staleTime: 3_000,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const principal = identity?.getPrincipal().toString();
  return useMutation({
    mutationFn: async ({
      conversationId,
      text,
    }: { conversationId: string; text: string }) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.sendMessage(conversationId, text);
    },
    onSuccess: (_data, { conversationId }) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", conversationId, principal ?? "anonymous"],
      });
      queryClient.invalidateQueries({
        queryKey: ["myConversations", principal ?? "anonymous"],
      });
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

// ── Admin / Stats ────────────────────────────────────────────────────────────

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();
  return useQuery<boolean>({
    queryKey: ["isCallerAdmin", principal ?? "anonymous"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching && !!identity,
    placeholderData: keepPreviousData,
    staleTime: 120_000,
    refetchOnWindowFocus: false,
  });
}

export function useAdminGetStats() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();
  return useQuery<Stats>({
    queryKey: ["adminStats", principal ?? "anonymous"],
    queryFn: async () => {
      if (!actor) throw new Error("Not authenticated");
      return actor.adminGetStats();
    },
    enabled: !!actor && !actorFetching && !!identity,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useAdminGetAllUsers() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();
  return useQuery<
    Array<[import("@icp-sdk/core/principal").Principal, FullUserProfile]>
  >({
    queryKey: ["adminAllUsers", principal ?? "anonymous"],
    queryFn: async () => {
      if (!actor) throw new Error("Not authenticated");
      return actor.adminGetAllUsers();
    },
    enabled: !!actor && !actorFetching && !!identity,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
