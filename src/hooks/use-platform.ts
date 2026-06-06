import { create } from 'zustand';
import type { SectionId } from '@/lib/platform-data';

interface PlatformState {
  activeSection: SectionId;
  sidebarOpen: boolean;
  setActiveSection: (section: SectionId) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const usePlatformStore = create<PlatformState>((set) => ({
  activeSection: 'dashboard',
  sidebarOpen: true,
  setActiveSection: (section) => set({ activeSection: section }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
