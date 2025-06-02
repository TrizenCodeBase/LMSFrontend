import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  LogOut,
  Menu,
  ChevronLeft,
  BarChart3,
  Receipt,
  MessageSquare,
  UserCheck,
  LifeBuoy
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import logo from '/logo.png';

interface AdminLayoutProps {
  children: React.ReactNode;
  pendingEnrollments?: number;
}

const AdminLayout = ({ children, pendingEnrollments = 0 }: AdminLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };  

  // Group the menu items by section
  const menuSections = [
    {
      title: "Main",
      items: [
        { icon: LayoutDashboard, name: 'Dashboard', path: '/admin/dashboard' },
      ]
    },
    {
      title: "Management",
      items: [
        { icon: Users, name: 'Users', path: '/admin/users' },
        { icon: BookOpen, name: 'Courses', path: '/admin/courses' },
        { icon: Receipt, name: 'Enrollment Requests', path: '/admin/enrollment-requests' },
        { icon: MessageSquare, name: 'Contact Requests', path: '/admin/contact-requests' },
      ]
    },
    {
      title: "Instructors",
      items: [
        { icon: Users, name: 'Instructor Management', path: '/admin/instructors' },
        { icon: UserCheck, name: 'Instructor Approvals', path: '/admin/instructor-approvals' },
      ]
    },
    {
      title: "Analytics",
      items: [
        { icon: BarChart3, name: 'Analytics', path: '/admin/analytics' },
      ]
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Top Navigation for Mobile */}
      <header className="sticky top-0 z-30 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden shadow-lg dark:shadow-gray-900/30">
        <div className="flex items-center justify-between px-4 h-full">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setMobileOpen(!mobileOpen)}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-semibold text-lg">Admin Panel</span>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside 
          className={cn(
            "fixed inset-y-0 left-0 z-40 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800",
            "shadow-xl dark:shadow-gray-900/50",
            collapsed ? "w-20" : "w-[260px]",
            "lg:translate-x-0 transform transition-all duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          {/* Logo & Collapse */}
          <div className={cn(
            "h-16 flex items-center px-6 border-b border-gray-100 dark:border-gray-800",
            collapsed ? "justify-center" : "justify-between"
          )}>
            <Link to="/admin/dashboard" className="flex items-center gap-3">
              <img 
                src={logo} 
                alt="Logo" 
                className="h-8 w-8"
              />
              {!collapsed && <span className="font-semibold text-lg">Admin Panel</span>}
            </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              className="hidden lg:flex hover:bg-gray-100 dark:hover:bg-gray-800" 
              onClick={() => setCollapsed(!collapsed)}
            >
              <div className={cn(
                "transform transition-transform duration-200",
                collapsed ? "rotate-180" : "rotate-0"
              )}>
                <ChevronLeft className="h-5 w-5" />
              </div>
            </Button>
          </div>

          {/* Menu Items - Scrollable Area */}
          <nav className="py-6 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
            {menuSections.map((section, sectionIndex) => (
              <div 
                key={sectionIndex}
                className="mb-4"
              >
                {!collapsed && (
                  <h3 className="px-6 mb-2 text-xs font-medium text-[#8E8E93] dark:text-gray-400 uppercase tracking-wider">
                    {section.title}
                  </h3>
                )}
                <ul className="space-y-1 px-3">
                  {section.items.map((item) => (
                    <li key={item.name}>
                      <Link 
                        to={item.path}
                        className={cn(
                          "flex items-center py-2 px-3 rounded-lg transition-all duration-200",
                          "hover:bg-[#F6F4FD] dark:hover:bg-gray-800",
                          "group relative cursor-pointer",
                          "hover:shadow-md dark:hover:shadow-gray-900/30",
                          isActive(item.path) && "bg-[#EFEBFA] dark:bg-gray-800 text-[#3E1E97] dark:text-white font-medium shadow-md dark:shadow-gray-900/30"
                        )}
                      >
                        <item.icon className={cn(
                          "h-5 w-5",
                          isActive(item.path) ? "text-[#3E1E97] dark:text-white" : "text-gray-500",
                          collapsed ? "mx-auto" : "mr-3"
                        )} />
                        {!collapsed && (
                          <span className="text-sm">{item.name}</span>
                        )}
                        {item.name === 'Enrollment Requests' && !collapsed && pendingEnrollments > 0 && (
                          <span className="ml-auto bg-[#EFEBFA] dark:bg-gray-700 text-[#3E1E97] dark:text-white text-xs px-2 py-0.5 rounded-full font-medium shadow-sm dark:shadow-gray-900/30">
                            New
                          </span>
                        )}
                        {collapsed && (
                          <div className="absolute left-16 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white rounded-md text-sm whitespace-nowrap z-50 shadow-xl dark:shadow-gray-900/50 opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.name}
                          </div>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
                {!collapsed && sectionIndex < menuSections.length - 1 && (
                  <div className="my-4 border-t border-gray-100 dark:border-gray-800" />
                )}
              </div>
            ))}
          </nav>

          {/* User Profile & Logout */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start gap-2",
                "text-red-500 border-red-200 dark:border-red-900",
                "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20",
                "rounded-lg transition-all duration-200",
                "shadow-sm hover:shadow-md dark:shadow-gray-900/30"
              )}
              onClick={handleLogout}
            >
              <LogOut className={cn("h-5 w-5", collapsed ? "mx-auto" : "mr-2")} />
              {!collapsed && <span>Sign Out</span>}
            </Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className={cn(
          "flex-1 transition-all duration-200",
          collapsed ? "lg:ml-20" : "lg:ml-[260px]"
        )}>
          <div className="p-6 space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg dark:shadow-gray-900/30">
              {children}
            </div>
          </div>
        </main>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden" 
            onClick={() => setMobileOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default AdminLayout;
