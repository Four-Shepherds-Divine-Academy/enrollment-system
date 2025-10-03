'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu as DropdownMenuNested,
  DropdownMenuContent as DropdownMenuContentNested,
  DropdownMenuItem,
  DropdownMenuTrigger as DropdownMenuTriggerNested,
} from '@/components/ui/dropdown-menu'
import { Bell, Check, Eye, EyeOff, X, UserPlus, Settings, AlertTriangle, Megaphone, MoreVertical } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useNotificationsStore } from '@/store/notifications-store'
import {
  useNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from '@/hooks/use-notifications'

type NotificationType = 'ENROLLMENT' | 'SYSTEM' | 'ALERT'

type Notification = {
  id: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  studentId: string | null
  enrollmentId: string | null
  createdAt: Date
  student?: {
    id: string
    fullName: string
    lrn: string | null
    gradeLevel: string
    enrollmentStatus: string
  }
}

export function NotificationCenter() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all')

  // React Query hooks - filter based on tab
  const readFilter = activeTab === 'unread' ? 'false' : activeTab === 'read' ? 'true' : undefined
  const { data: notifications = [], isLoading } = useNotifications({
    read: readFilter,
  })
  const { data: unreadCount = 0 } = useUnreadNotificationsCount()
  const toggleReadMutation = useMarkNotificationRead()
  const markAllReadMutation = useMarkAllNotificationsRead()
  const deleteNotificationMutation = useDeleteNotification()

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      toggleReadMutation.mutate(notification.id)
    }

    // Navigate to student page if student exists
    if (notification.studentId) {
      router.push(`/admin/dashboard/students/${notification.studentId}/edit`)
      setOpen(false)
    }
  }

  const handleToggleRead = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    toggleReadMutation.mutate(id)
  }

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate()
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    deleteNotificationMutation.mutate(id)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'all' | 'unread' | 'read')
  }

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'ENROLLMENT':
        return <UserPlus className="h-4 w-4 text-blue-600" />
      case 'SYSTEM':
        return <Settings className="h-4 w-4 text-gray-600" />
      case 'ALERT':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      default:
        return <Megaphone className="h-4 w-4 text-purple-600" />
    }
  }

  const getNotificationBadge = (notification: Notification) => {
    const { type, student } = notification

    if (type === 'ENROLLMENT' && student) {
      const status = student.enrollmentStatus

      if (status === 'PENDING') {
        return (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-yellow-50 text-yellow-700 border-yellow-300">
            Pending
          </Badge>
        )
      } else if (status === 'ENROLLED') {
        return (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-green-50 text-green-700 border-green-300">
            Enrolled
          </Badge>
        )
      } else if (status === 'DROPPED') {
        return (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-red-50 text-red-700 border-red-300">
            Dropped
          </Badge>
        )
      }
    }

    if (type === 'SYSTEM') {
      return (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-gray-50 text-gray-700 border-gray-300">
          System
        </Badge>
      )
    }

    if (type === 'ALERT') {
      return (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-orange-50 text-orange-700 border-orange-300">
          Alert
        </Badge>
      )
    }

    return null
  }

  const unreadNotifications = notifications.filter(n => !n.isRead)
  const readNotifications = notifications.filter(n => n.isRead)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markAllReadMutation.isPending}
            >
              <Check className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="all" className="flex-1">
              All
              {notifications.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">
                  {notifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">
              Unread
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="read" className="flex-1">
              Read
              {readNotifications.length > 0 && activeTab === 'read' && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">
                  {readNotifications.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="m-0">
            <div className="max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">Loading notifications...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-2.5 border-b hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.isRead ? 'bg-blue-50/50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="flex-shrink-0 mt-1">
                        <div className="p-1.5 rounded-full bg-blue-50">
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-medium text-sm text-gray-900">{notification.title}</h4>
                              {getNotificationBadge(notification)}
                              {!notification.isRead && (
                                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                              )}
                            </div>
                            {notification.student && (
                              <p className="text-sm text-gray-700 mt-1">
                                {notification.student.fullName} • {notification.student.gradeLevel}
                                {notification.student.lrn && ` • ${notification.student.lrn}`}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                          <DropdownMenuNested>
                            <DropdownMenuTriggerNested asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 -mt-1 text-gray-400 hover:text-gray-600"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTriggerNested>
                            <DropdownMenuContentNested align="end" className="w-40">
                              <DropdownMenuItem onClick={(e) => handleToggleRead(e, notification.id)}>
                                {notification.isRead ? (
                                  <>
                                    <EyeOff className="h-4 w-4 mr-2" />
                                    Mark as unread
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Mark as read
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => handleDelete(e, notification.id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContentNested>
                          </DropdownMenuNested>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
