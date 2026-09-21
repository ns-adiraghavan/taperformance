'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Snapshot, AppSettings, ReqComment, DEFAULT_SETTINGS } from './types';

interface AppStore {
  snapshots: Snapshot[];
  settings: AppSettings;
  comments: ReqComment[];
  activeSnapshotId: string | null;

  addSnapshot: (snapshot: Snapshot) => void;
  removeSnapshot: (id: string) => void;
  setActiveSnapshot: (id: string) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  addComment: (comment: ReqComment) => void;
  getComments: (requisitionId: string) => ReqComment[];
  clearAll: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      snapshots: [],
      settings: DEFAULT_SETTINGS,
      comments: [],
      activeSnapshotId: null,

      addSnapshot: (snapshot) =>
        set((state) => {
          const snapshots = [...state.snapshots, snapshot];
          return { snapshots, activeSnapshotId: snapshot.id };
        }),

      removeSnapshot: (id) =>
        set((state) => {
          const snapshots = state.snapshots.filter((s) => s.id !== id);
          const activeSnapshotId =
            state.activeSnapshotId === id
              ? snapshots[snapshots.length - 1]?.id ?? null
              : state.activeSnapshotId;
          return { snapshots, activeSnapshotId };
        }),

      setActiveSnapshot: (id) => set({ activeSnapshotId: id }),

      updateSettings: (patch) =>
        set((state) => ({ settings: { ...state.settings, ...patch } })),

      addComment: (comment) =>
        set((state) => ({ comments: [...state.comments, comment] })),

      getComments: (requisitionId) => get().comments.filter(c => c.requisitionId === requisitionId),

      clearAll: () =>
        set({ snapshots: [], comments: [], activeSnapshotId: null }),
    }),
    { name: 'ta-dashboard-v1' }
  )
);

// ─── Derived selectors ────────────────────────────────────────────────────────
export function useActiveSnapshot() {
  const { snapshots, activeSnapshotId } = useAppStore();
  if (!activeSnapshotId) return snapshots[snapshots.length - 1] ?? null;
  return snapshots.find((s) => s.id === activeSnapshotId) ?? null;
}
