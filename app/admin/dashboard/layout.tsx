import { auth, signOut } from '@/auth'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Toaster } from 'sonner'
import { prisma } from '@/lib/prisma'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Image from 'next/image'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  User,
  LogOut,
  Settings,
  FileText,
  Home,
  Calendar,
  Users,
  UserPlus,
  ChevronDown,
  LayoutGrid,
  DollarSign,
  Receipt,
  MessageSquare,
  Trash2,
  Archive
} from 'lucide-react'
import { NotificationCenter } from '@/components/notification-center'
import { ActiveYearBadge } from '@/components/active-year-badge'
import { MissingFeeTemplatesAlert } from '@/components/missing-fee-templates-alert'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/admin/login')
  }

  // Get user initials for avatar
  const userInitials = session.user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AD'

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-8">
              <Link href="/admin/dashboard" className="flex items-center space-x-2">
                <Image
                  src="/logo.jpg"
                  alt="4SDA Logo"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <h1 className="text-xl font-bold text-gray-900">
                  {process.env.APP_NAME || '4SDA'} Admin
                </h1>
              </Link>

            </div>

            {/* Right Side - Active Year, Notifications & User Menu */}
            <div className="flex items-center space-x-4">
              {/* Active Year Badge */}
              <ActiveYearBadge />

              {/* Notification Center */}
              <NotificationCenter />

              {/* User Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 hover:bg-gray-100">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-sm font-medium text-gray-900">
                        {session.user?.name}
                      </span>
                      <span className="text-xs text-gray-500">{session.user?.role}</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{session.user?.name}</p>
                      <p className="text-xs text-gray-500">{session.user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Dashboard Section */}
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Overview
                    </p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/dashboard" className="flex items-center cursor-pointer">
                      <Home className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Academic Management Section */}
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Academic Management
                    </p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/dashboard/academic-years" className="flex items-center cursor-pointer">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>Academic Years</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/dashboard/students" className="flex items-center cursor-pointer">
                      <Users className="mr-2 h-4 w-4" />
                      <span>Students</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/dashboard/students/archive" className="flex items-center cursor-pointer">
                      <Archive className="mr-2 h-4 w-4" />
                      <span>Student Archive</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/dashboard/enroll" className="flex items-center cursor-pointer">
                      <UserPlus className="mr-2 h-4 w-4" />
                      <span>Enroll Student</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/dashboard/sections" className="flex items-center cursor-pointer">
                      <LayoutGrid className="mr-2 h-4 w-4" />
                      <span>Manage Sections</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/dashboard/custom-remarks" className="flex items-center cursor-pointer">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      <span>Manage Remarks</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Financial Management Section */}
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Financial Management
                    </p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/dashboard/fees" className="flex items-center cursor-pointer">
                      <Receipt className="mr-2 h-4 w-4" />
                      <span>Fee Management</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/dashboard/payment-history" className="flex items-center cursor-pointer">
                      <DollarSign className="mr-2 h-4 w-4" />
                      <span>Payment History</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Reports & Analytics Section */}
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Reports & Analytics
                    </p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/dashboard/reports" className="flex items-center cursor-pointer">
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Reports</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* System Configuration Section */}
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      System
                    </p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/dashboard/recycle-bin" className="flex items-center cursor-pointer">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Recycle Bin</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Sign Out */}
                  <DropdownMenuItem asChild>
                    <form
                      action={async () => {
                        'use server'
                        await signOut({ redirectTo: '/admin/login' })
                      }}
                      className="w-full"
                    >
                      <button type="submit" className="flex items-center w-full text-red-600">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8">
        {/* Global Alert for Missing Fee Templates */}
        <div className="mb-6">
          <MissingFeeTemplatesAlert />
        </div>

        {children}
      </main>
    </div>
  )
}
