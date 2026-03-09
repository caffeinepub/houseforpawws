import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { getSecretParameter } from "../utils/urlParams";
import { useInternetIdentity } from "./useInternetIdentity";

const ACTOR_QUERY_KEY = "actor";
export function useActor() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  // Track the previous actor data reference so we only invalidate on genuine
  // actor changes, not on every render tick.
  const prevActorRef = useRef<backendInterface | null>(null);

  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      const isAuthenticated = !!identity;

      if (!isAuthenticated) {
        return await createActorWithConfig();
      }

      const actorOptions = {
        agentOptions: {
          identity,
        },
      };

      const actor = await createActorWithConfig(actorOptions);
      const adminToken = getSecretParameter("caffeineAdminToken") || "";
      await actor._initializeAccessControlWithSecret(adminToken);
      return actor;
    },
    staleTime: Number.POSITIVE_INFINITY,
    enabled: true,
  });

  // When the actor reference genuinely changes (identity switch or login),
  // mark dependent queries stale so they'll refetch lazily when next accessed.
  // We intentionally do NOT call refetchQueries here — forcing an immediate
  // concurrent refetch of every query causes a cascade where profile briefly
  // returns null and the admin check briefly returns false, which triggers
  // spurious UI flashes (ProfileSetupModal, "Access Denied" screen).
  useEffect(() => {
    const newActor = actorQuery.data ?? null;
    if (newActor && newActor !== prevActorRef.current) {
      prevActorRef.current = newActor;
      // Small delay lets the new actor settle into React state before queries
      // start re-running, avoiding a burst of simultaneous refetch requests.
      const t = setTimeout(() => {
        queryClient.invalidateQueries({
          predicate: (query) => {
            return !query.queryKey.includes(ACTOR_QUERY_KEY);
          },
        });
      }, 150);
      return () => clearTimeout(t);
    }
  }, [actorQuery.data, queryClient]);

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
  };
}
