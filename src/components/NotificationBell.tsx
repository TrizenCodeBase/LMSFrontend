import React, { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, type Notification } from '@/services/notificationService';
import { useToast } from "@/hooks/use-toast";

export const NotificationBell = () => {
  const { data, isLoading } = useNotifications();
  const markAsRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark notification as read
      await markAsRead.mutateAsync(notification._id);

      // Navigate based on notification type
      switch (notification.type) {
        case 'course_update':
          navigate(`/course/${notification.courseId}/weeks`);
          break;
        case 'assignment':
          navigate(`/course/${notification.courseId}/assignments/${notification.assignmentId}`);
          break;
        case 'discussion':
          navigate(`/course/${notification.courseId}/discussions${notification.discussionId ? `/${notification.discussionId}` : ''}`);
          break;
        case 'new_day':
          navigate(`/course/${notification.courseId}`);
          break;
        default:
          // If a custom link is provided, use it
          if (notification.link) {
            navigate(notification.link);
          }
      }
    } catch (error) {
      console.error('Failed to handle notification:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead.mutateAsync();
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (notification: Notification) => {
    switch (notification.type) {
      case 'course_update':
        return '📚';
      case 'assignment':
        return '📝';
      case 'discussion':
        return '💬';
      case 'new_day':
        return '📅';
      case 'message':
        return '✉️';
      default:
        return '🔔';
    }
  };

  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5 animate-pulse" />
      </Button>
    );
  }

  const hasUnreadNotifications = data?.unreadCount && data.unreadCount > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasUnreadNotifications && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {data.unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="py-2">
          <div className="px-2 mb-2 flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            {hasUnreadNotifications && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={handleMarkAllRead}
                disabled={markAllRead.isPending}
              >
                <Check className="mr-1 h-3 w-3" />
                Mark all read
              </Button>
            )}
          </div>
          <ScrollArea className="h-[400px]">
            {!data?.notifications || data.notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No notifications
              </p>
            ) : (
              <div className="px-2 space-y-2">
                {data.notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification._id}
                    className={`cursor-pointer text-sm ${!notification.read ? 'bg-primary/5' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{getNotificationIcon(notification)}</span>
                      <div className="flex flex-col gap-1 flex-1">
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-primary mt-2" />
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}; 