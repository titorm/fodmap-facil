import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReintroductionTest, TestPhase } from '../../core/domain/entities/ReintroductionTest';

/**
 * Estado global da aplicação
 */
interface AppState {
  // Estado atual
  currentTest: ReintroductionTest | null;
  currentPhase: TestPhase;
  isOnboarded: boolean;

  // Ações
  setCurrentTest: (test: ReintroductionTest | null) => void;
  setCurrentPhase: (phase: TestPhase) => void;
  completeOnboarding: () => void;
  reset: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Estado inicial
      currentTest: null,
      currentPhase: TestPhase.ELIMINATION,
      isOnboarded: false,

      // Ações
      setCurrentTest: (test) => set({ currentTest: test }),

      setCurrentPhase: (phase) => set({ currentPhase: phase }),

      completeOnboarding: () => set({ isOnboarded: true }),

      reset: () =>
        set({
          currentTest: null,
          currentPhase: TestPhase.ELIMINATION,
          isOnboarded: false,
        }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/**
 * Store de preferências do usuário
 */
interface UserPreferencesState {
  // Preferências
  language: string;
  notificationsEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
  reminderTime: string | null;

  // Ações
  setLanguage: (language: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setReminderTime: (time: string | null) => void;
}

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set) => ({
      // Estado inicial
      language: 'en',
      notificationsEnabled: true,
      theme: 'auto',
      reminderTime: null,

      // Ações
      setLanguage: (language) => set({ language }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setTheme: (theme) => set({ theme }),
      setReminderTime: (time) => set({ reminderTime: time }),
    }),
    {
      name: 'user-preferences-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/**
 * Store de sincronização offline
 */
interface SyncState {
  // Estado de sincronização
  isSyncing: boolean;
  lastSyncAt: Date | null;
  pendingChanges: number;

  // Ações
  startSync: () => void;
  completeSync: () => void;
  incrementPendingChanges: () => void;
  decrementPendingChanges: () => void;
  resetPendingChanges: () => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  // Estado inicial
  isSyncing: false,
  lastSyncAt: null,
  pendingChanges: 0,

  // Ações
  startSync: () => set({ isSyncing: true }),

  completeSync: () =>
    set({
      isSyncing: false,
      lastSyncAt: new Date(),
      pendingChanges: 0,
    }),

  incrementPendingChanges: () => set((state) => ({ pendingChanges: state.pendingChanges + 1 })),

  decrementPendingChanges: () =>
    set((state) => ({
      pendingChanges: Math.max(0, state.pendingChanges - 1),
    })),

  resetPendingChanges: () => set({ pendingChanges: 0 }),
}));

/**
 * Seletores úteis
 */
export const selectHasCurrentTest = (state: AppState) => state.currentTest !== null;
export const selectIsInReintroductionPhase = (state: AppState) =>
  state.currentPhase === TestPhase.REINTRODUCTION;
export const selectNeedsSyncing = (state: SyncState) => state.pendingChanges > 0;
