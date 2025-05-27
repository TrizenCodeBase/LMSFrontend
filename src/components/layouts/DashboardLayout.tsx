import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, FileText, Calendar, 
  MessageSquare, GraduationCap, UserCircle, 
  Settings, LogOut, ChevronLeft, Menu, ArrowLeft
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from '@/components/NotificationBell';

interface DashboardLayoutProps {
  children: React.ReactNode;
  courseTitle?: string;
}

// User Menu Component
const UserMenu = ({ user, onLogout }: { user: any; onLogout: () => void }) => {
  const navigate = useNavigate();
  
  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      ?.map(word => word?.[0])
      ?.join('')
      ?.toUpperCase() || 'U';
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border-2 border-black">
            <AvatarFallback>
              {user?.name ? getInitials(user.name) : 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            {user?.name && (
              <p className="font-medium">{user.name}</p>
            )}
            {user?.email && (
              <p className="w-[200px] truncate text-sm text-muted-foreground">
                {user.email}
              </p>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <UserCircle className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/my-courses')}>
          <BookOpen className="mr-2 h-4 w-4" />
          <span>My Courses</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-red-600 focus:text-red-600" 
          onClick={onLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const DashboardLayout = ({ children, courseTitle }: DashboardLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleMobileMenuClick = () => {
    if (isCourseWeekView) {
      handleBack();
    } else {
      setMobileOpen(!mobileOpen);
    }
  };

  const menuItems = [
    { icon: BookOpen, name: 'Explore Courses', path: '/explore-courses' },
    { icon: BookOpen, name: 'My Courses', path: '/my-courses' },
    { icon: LayoutDashboard, name: 'Dashboard', path: '/dashboard' },
    { icon: FileText, name: 'Assignments', path: '/assignments' },
    { icon: MessageSquare, name: 'Discussions', path: '/discussions' },
    { icon: MessageSquare, name: 'Contact Instructors', path: '/contact-instructors' },
    { icon: Calendar, name: 'Calendar', path: '/calendar' },
  ];

  // Check if we're in a course week view
  const isCourseWeekView = location.pathname.includes('/course/') && location.pathname.includes('/weeks');

  return (
    <div className="min-h-screen flex bg-gray-50/50">
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b bg-background/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 h-full">
          <div className="flex items-center">
            <div className="relative">
              <Button variant="ghost" size="icon" onClick={handleMobileMenuClick}>
                {isCourseWeekView ? (
                  <ArrowLeft className="h-5 w-5 text-white" />
                ) : (
              <Menu className="h-5 w-5" />
                )}
            </Button>
            </div>
            <Link to="/" className="ml-2 flex items-center gap-4">
              <img 
                src="/lovable-uploads/b66cad1a-9e89-49b0-a481-bbbb0a2bbded.png" 
                alt="Trizen Logo" 
                className="h-10" 
              />
              {location.pathname.includes('/course/') && courseTitle && (
                <div className="hidden sm:block font-bold text-lg truncate max-w-[200px]">
                  {courseTitle}
                </div>
              )}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <UserMenu user={user} onLogout={handleLogout} />
          </div>
        </div>
      </header>

      {/* Sidebar - Only show if not in course week view */}
      {!isCourseWeekView && (
        <>
      <aside 
            className={`fixed inset-y-0 left-0 z-50 bg-card border-r transition-all duration-300 ${
              collapsed ? 'w-20' : 'w-64'
            } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
            {/* Sidebar content */}
        <div className="flex flex-col h-full">
              <div className="p-4 flex items-center justify-between border-b">
                <Link to="/" className={`flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
                <img 
                  src="/lovable-uploads/b66cad1a-9e89-49b0-a481-bbbb0a2bbded.png" 
                  alt="Trizen Logo" 
                    className="h-8" 
                />
                  {!collapsed && <span className="font-bold text-xl">Trizen</span>}
              </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              className="hidden lg:flex" 
              onClick={() => setCollapsed(!collapsed)}
            >
              <ChevronLeft className={`h-5 w-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            </Button>
          </div>
          
              <nav className="flex-1 overflow-y-auto p-4">
              {menuItems.map((item) => (
                  <Link 
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md mb-1 hover:bg-accent transition-colors ${
                      location.pathname === item.path ? 'bg-accent' : ''
                    }`}
                  >
                    <item.icon className={`h-5 w-5 ${collapsed ? 'mx-auto' : ''}`} />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
              ))}
          </nav>
          
          <div className="p-4 border-t">
            <Button
              variant="ghost"
                  className={`w-full justify-start ${collapsed ? 'px-0' : ''}`}
              onClick={handleLogout}
            >
                  <LogOut className={`h-5 w-5 ${collapsed ? 'mx-auto' : 'mr-2'}`} />
                  {!collapsed && <span>Logout</span>}
            </Button>
          </div>
        </div>
      </aside>

          {/* Mobile sidebar overlay */}
          {mobileOpen && (
            <div 
              className="fixed inset-0 bg-black/20 z-30 lg:hidden" 
              onClick={() => setMobileOpen(false)}
            />
          )}
        </>
      )}

      <main className={`flex-1 min-h-screen ${!isCourseWeekView ? (collapsed ? 'lg:pl-20' : 'lg:pl-64') : ''}`}>
        {/* Desktop Header */}
        <div className="sticky top-0 z-10 h-16 border-b bg-white shadow hidden lg:flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            {isCourseWeekView && (
              <Button variant="ghost" size="icon" onClick={handleBack} className="mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            {location.pathname.includes('/course/') && courseTitle && (
              <div className="font-bold text-xl">
                {courseTitle}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <UserMenu user={user} onLogout={handleLogout} />
          </div>
        </div>

        {/* Page Content */}
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
