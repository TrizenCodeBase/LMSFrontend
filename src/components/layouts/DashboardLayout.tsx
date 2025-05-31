import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, FileText, Calendar, 
  MessageSquare, GraduationCap, UserCircle, 
  Settings, LogOut, ChevronLeft, Menu, ArrowLeft,
  Users, ClipboardCheck, Video, MessageCircle, HelpCircle, Headphones
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
    { icon: LayoutDashboard, name: 'Dashboard', path: '/dashboard' },
    { icon: BookOpen, name: 'Explore Courses', path: '/explore-courses' },
    { icon: GraduationCap, name: 'My Courses', path: '/my-courses' },
    { icon: FileText, name: 'Assignments', path: '/assignments' },
    { icon: MessageCircle, name: 'Discussions', path: '/discussions' },
    { icon: Users, name: 'Contact Instructors', path: '/contact-instructors' },
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
            <Button variant="ghost" size="icon" onClick={handleMobileMenuClick}>
              {isCourseWeekView ? (
                <ArrowLeft className="h-5 w-5 text-white" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
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
            className={`fixed inset-y-0 left-0 z-50 bg-white shadow-[0_0_30px_rgba(45,31,143,0.07)] transition-all duration-500 ease-in-out ${
              collapsed ? 'w-20' : 'w-64'
            } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
          >
            {/* Sidebar content */}
            <div className="flex flex-col h-full">
              <div className="p-4 flex items-center justify-between border-b border-gray-100">
                {!collapsed && (
                  <Link to="/" className="flex items-center transform transition-transform duration-300 hover:scale-105">
                    <img 
                      src="/lovable-uploads/b66cad1a-9e89-49b0-a481-bbbb0a2bbded.png" 
                      alt="Logo" 
                      className="h-8 w-auto" 
                    />
                  </Link>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`hover:bg-[#2D1F8F]/5 rounded-full transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-95 ${collapsed ? 'ml-auto' : ''}`}
                  onClick={() => setCollapsed(!collapsed)}
                >
                  <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
                </Button>
              </div>
          
              <nav className="flex-1 overflow-y-auto p-3">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link 
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 mb-2 rounded-lg transition-all duration-300 ease-in-out group relative
                        transform hover:translate-x-1
                        ${isActive 
                          ? 'bg-[#2D1F8F]/5 text-[#2D1F8F] font-medium shadow-[0_2px_10px_rgba(45,31,143,0.1)] before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:rounded-r-full before:bg-[#2D1F8F] before:transition-all before:duration-300' 
                          : 'text-gray-600 hover:bg-gray-50/80 hover:shadow-md'}`}
                    >
                      <item.icon className={`h-5 w-5 transition-colors duration-300 ${
                        collapsed ? 'mx-auto' : ''
                      } ${isActive 
                          ? 'text-[#2D1F8F]' 
                          : 'text-gray-500 group-hover:text-[#2D1F8F]'}`} 
                      />
                      {!collapsed && (
                        <span className="text-sm whitespace-nowrap transition-all duration-300">
                          {item.name}
                        </span>
                      )}
                      {collapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-[#2D1F8F] text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 shadow-lg transform scale-95 group-hover:scale-100">
                          {item.name}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </nav>
          
              <div className="p-3 border-t border-gray-100">
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-300 ease-in-out transform hover:translate-x-1 hover:shadow-md ${collapsed ? 'px-0' : ''}`}
                  onClick={handleLogout}
                >
                  <LogOut className={`h-5 w-5 transition-transform duration-300 ${collapsed ? 'mx-auto' : 'mr-2'}`} />
                  {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
                </Button>
              </div>
            </div>
          </aside>

          {/* Mobile sidebar overlay */}
          {mobileOpen && (
            <div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300" 
              onClick={() => setMobileOpen(false)}
            />
          )}
        </>
      )}

      <main className={`flex-1 min-h-screen transition-all duration-500 ease-in-out ${!isCourseWeekView ? (collapsed ? 'lg:pl-20' : 'lg:pl-64') : ''}`}>
        {/* Desktop Header */}
        <div className="sticky top-0 z-10 h-16 border-b bg-white shadow-sm backdrop-blur-sm backdrop-saturate-150 bg-white/90 hidden lg:flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            {isCourseWeekView && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleBack} 
                className="mr-2 transition-transform duration-300 hover:scale-110 active:scale-95"
              >
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
        <div className="pt-16 lg:pt-0 transition-all duration-300">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
