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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Top Navigation for Mobile */}
      <header className="sticky top-0 z-30 h-16 border-b bg-background/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 h-full">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
            <span className="ml-2 font-bold">Admin Panel</span>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar for desktop */}
        <aside 
          className={`bg-white/90 border-r fixed inset-y-0 left-0 z-40 shadow-lg transition-all duration-300
            ${collapsed ? 'w-20' : 'w-72'}
            ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        >
          {/* Logo & Collapse */}
          <div className={`h-16 flex items-center px-4 border-b ${collapsed ? 'justify-center' : 'justify-between'}`}>
            <Link to="/admin/dashboard" className="flex items-center gap-2">
              <img src={logo} alt="Logo" className="h-8 w-8 rounded-full shadow" />
              {!collapsed && <span className="font-bold text-xl text-primary">Admin Panel</span>}
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

          {/* Menu Items - Scrollable Area */}
          <nav className="py-4 flex-1 overflow-y-auto custom-scrollbar">
            {menuSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="mb-4">
                {!collapsed && (
                  <h3 className="px-4 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {section.title}
                  </h3>
                )}
                <ul className="space-y-1 px-2">
                  {section.items.map((item) => (
                    <li key={item.name}>
                      <Link 
                        to={item.path}
                        className={`flex items-center p-2 rounded-lg hover:bg-blue-50 focus:bg-blue-100 transition-colors group relative ${
                          isActive(item.path) ? 'bg-blue-100 text-primary font-semibold shadow' : ''
                        }`}
                      >
                        <item.icon className={`h-5 w-5 text-primary ${collapsed ? 'mx-auto' : 'mr-3'}`} />
                        {!collapsed && <span>{item.name}</span>}
                        {/* Example badge for notifications */}
                        {item.name === 'Enrollment Requests' && !collapsed && pendingEnrollments > 0 && (
                          <span className="ml-auto bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-semibold">New</span>
                        )}
                        {collapsed && (
                          <span className="absolute left-16 p-2 bg-primary text-white rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity text-sm whitespace-nowrap z-50 shadow-lg">
                            {item.name}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
                {!collapsed && sectionIndex < menuSections.length - 1 && (
                  <div className="my-3 border-t border-gray-200" />
                )}
              </div>
            ))}
          </nav>

          {/* User Profile & Logout */}
          <div className="px-4 py-3 border-t flex flex-col gap-2">
            <Button 
              variant="destructive" 
              className={`w-full flex items-center justify-center gap-2 font-semibold text-base py-2 ${collapsed ? 'p-2 justify-center' : ''}`}
              onClick={handleLogout}
            >
              <LogOut className={`h-5 w-5 ${collapsed ? '' : 'mr-2'}`} />
              {!collapsed && <span>Sign Out</span>}
            </Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className={`flex-1 ${collapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
          <div className="p-6">
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
    </div>
  );
};

export default AdminLayout;
