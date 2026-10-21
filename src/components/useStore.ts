import { useSyncExternalStore } from 'react';
import { createPlannerStore } from '../domain';
import type { AppData, PersistenceStatus, PlannerStore } from '../domain';

/** One store for the whole app. */
export const store: PlannerStore = createPlannerStore();

export function useStore(): {
  store: PlannerStore;
  data: AppData;
  persistence: PersistenceStatus;
} {
  const data = useSyncExternalStore(store.subscribe, store.getData, store.getData);
  const persistence = useSyncExternalStore(store.subscribe, store.getPersistence, store.getPersistence);
  return { store, data, persistence };
}
