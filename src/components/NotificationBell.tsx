"use client";

import React from 'react';
import { Bell, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from './NotificationProvider';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoadingNotifications } = useNotifications();

  const getNotificationLink = (type: string, relatedId: string | null) => {
    if (!relatedId) return '#';
    switch (type) {
      case 'new_borrow_request':
        return `/admin/borrow-requests?requestId=${relatedId}`; // Add query param for highlighting
      case 'new_consumable_request':
        return `/admin/consumable-requests?requestId=${relatedId}`;
      case 'new_return_request':
        return `/admin/return-requests?requestId=${relatedId}`;
      default:
        return '#';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">Lihat notifikasi</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="flex items-center justify-between p-4">
          <h4 className="font-medium">Notifikasi ({unreadCount})</h4>
          {unreadCount > 0 && (
            <Button variant="link" size="sm" onClick={markAllAsRead} disabled={isLoadingNotifications}>
              Tandai semua dibaca
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[300px]">
          {isLoadingNotifications ? (
            <div className="p-4 text-center text-sm text-gray-500">Memuat notifikasi...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">Tidak ada notifikasi baru.</div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <Link
                  key={notification.id}
                  to={getNotificationLink(notification.type, notification.related_id)}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                  className={cn(
                    "flex flex-col gap-1 p-4 border-b hover:bg-gray-50 dark:hover:bg-gray-800",
                    !notification.is_read ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                  )}
                >
                  <p className={cn("text-sm", !notification.is_read ? "font-semibold" : "text-gray-700 dark:text-gray-300")}>
                    {notification.message}
                  </p>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: id })}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;