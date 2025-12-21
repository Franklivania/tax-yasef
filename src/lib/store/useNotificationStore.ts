import { create } from "zustand";

export type NotificationType = "info" | "success" | "error" | "warning";

export type Notification = {
  id: string;
  type: NotificationType;
  message: string;
  dismissible: boolean;
  timestamp: number;
};

type NotificationStore = {
  notifications: Notification[];
  addNotification: (
    type: NotificationType,
    message: string,
    dismissible?: boolean
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  getNotifications: () => Notification[];
};

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],

  addNotification: (type, message, dismissible = true) => {
    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type,
      message,
      dismissible: dismissible ?? true,
      timestamp: Date.now(),
    };
    set((state) => ({
      notifications: [...state.notifications, notification],
    }));
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },

  getNotifications: () => {
    return get().notifications;
  },
}));
