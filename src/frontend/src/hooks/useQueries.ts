import { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ConversationView,
  MessageView,
  Pet,
  UserProfile,
} from "../backend";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

// ── User Profile ────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetUserProfile(principal: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile", principal],
    queryFn: async () => {
      if (!actor || !principal) return null;
      return actor.getUserProfile(Principal.fromText(principal));
    },
    enabled: !!actor && !actorFetching && !!principal,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
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
