import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, FileText, Calendar, 
  MessageSquare, GraduationCap, UserCircle, 
  Settings, LogOut, ChevronLeft, Menu
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

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
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

  return (
    <div className="min-h-screen flex bg-gray-50/50">
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b bg-background/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 h-full">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
            <Link to="/" className="ml-2">
              <img 
                src="/lovable-uploads/b66cad1a-9e89-49b0-a481-bbbb0a2bbded.png" 
                alt="Trizen Logo" 
                className="h-10" 
              />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <UserMenu user={user} onLogout={handleLogout} />
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside 
        className={`
          bg-white border-r shadow-sm
          fixed lg:fixed top-0 left-0 h-screen
          transition-all duration-300 z-40
          ${collapsed ? 'w-20' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className={`h-16 flex items-center px-4 border-b ${collapsed ? 'justify-center' : 'justify-between'}`}>
            {!collapsed && (
              <Link to="/" className="flex items-center">
                <img 
                  src="/lovable-uploads/b66cad1a-9e89-49b0-a481-bbbb0a2bbded.png" 
                  alt="Trizen Logo" 
                  className="h-10" 
                />
              </Link>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="hidden lg:flex" 
              onClick={() => setCollapsed(!collapsed)}
            >
              <ChevronLeft className={`h-5 w-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            </Button>
          </div>
          
          {/* Menu Items */}
          <nav className="flex-1 py-4">
            <ul className="space-y-1 px-2">
              {menuItems.map((item) => (
                <li key={item.name}>
                  <Link 
                    to={item.path}
                    className="flex items-center p-2 rounded-md hover:bg-gray-100 transition-colors group"
                  >
                    <item.icon className={`h-5 w-5 text-primary ${collapsed ? 'mx-auto' : 'mr-3'}`} />
                    {!collapsed && <span>{item.name}</span>}
                    {collapsed && (
                      <span className="absolute left-16 p-2 bg-primary text-white rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity text-sm whitespace-nowrap">
                        {item.name}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Sign Out Button */}
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className={`w-full flex items-center justify-${collapsed ? 'center' : 'start'} text-red-600 hover:text-red-700 hover:bg-red-50`}
              onClick={handleLogout}
            >
              <LogOut className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
              {!collapsed && <span>Sign Out</span>}
              {collapsed && (
                <span className="absolute left-16 p-2 bg-red-600 text-white rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity text-sm whitespace-nowrap">
                  Sign Out
                </span>
              )}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 min-h-screen ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {/* Desktop Header */}
        <div className="sticky top-0 z-10 h-16 border-b bg-white shadow hidden lg:flex items-center justify-end px-6">
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

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden" 
          onClick={() => setMobileOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
