import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserCog, Users } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">4S</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {process.env.APP_NAME || '4SDA'} Enrollment System
          </h1>
          <p className="text-lg text-gray-600">
            Please select your login type to continue
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Admin Login Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserCog className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-2xl">Admin Login</CardTitle>
              <CardDescription>
                Access the administrative dashboard to manage students, enrollments, and academic years
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" size="lg">
                <Link href="/admin/login">
                  Login as Admin
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* User Login Card */}
          <Card className="hover:shadow-lg transition-shadow opacity-60">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-gray-600" />
                </div>
              </div>
              <CardTitle className="text-2xl">User Login</CardTitle>
              <CardDescription>
                Access your enrollment portal and view student information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
