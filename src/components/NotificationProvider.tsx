"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from './SessionContextProvider';
import { showError, showSuccess } from '@/utils/toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner'; // Using sonner for toasts

interface Notification {
  id: string;
  recipient_user_id: string;
  type: string;
  message: string;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  isLoadingNotifications: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoading: isLoadingSession, isAdmin, isHeadmaster } = useSession();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user || (!isAdmin && !isHeadmaster)) {
      return [];
    }
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      showError(`Gagal memuat notifikasi: ${error.message}`);
      return [];
    }
    return data || [];
  }, [user, isAdmin, isHeadmaster]);

  const { data: fetchedNotifications, isLoading: isLoadingNotifications, refetch } = useQuery<Notification[], Error>({
    queryKey: ['userNotifications', user?.id],
    queryFn: fetchNotifications,
    enabled: !!user && (isAdmin || isHeadmaster) && !isLoadingSession,
    onSuccess: (data) => {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    },
  });

  useEffect(() => {
    if (!user || (!isAdmin && !isHeadmaster)) return;

    const channel = supabase
      .channel(`notifications_for_user_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
          toast.info(newNotification.message, {
            description: "Notifikasi baru!",
            duration: 5000,
            action: {
              label: "Lihat",
              onClick: () => {
                // Optionally navigate to the related request page
                // For now, just mark as read
                markAsRead(newNotification.id);
              },
            },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin, isHeadmaster, markAsRead]);

  const markAsRead = useCallback(async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('recipient_user_id', user?.id); // Ensure user can only mark their own

    if (error) {
      showError(`Gagal menandai notifikasi sebagai sudah dibaca: ${error.message}`);
    } else {
      queryClient.invalidateQueries({ queryKey: ['userNotifications', user?.id] });
    }
  }, [user, queryClient]);

  const markAllAsRead = useCallback(async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_user_id', user?.id)
      .eq('is_read', false);

    if (error) {
      showError(`Gagal menandai semua notifikasi sebagai sudah dibaca: ${error.message}`);
    } else {
      queryClient.invalidateQueries({ queryKey: ['userNotifications', user?.id] });
    }
  }, [user, queryClient]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, isLoadingNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};