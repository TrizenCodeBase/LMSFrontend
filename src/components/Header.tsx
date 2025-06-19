import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, X, ChevronDown, User, Search } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToCourses = () => {
    const coursesSection = document.getElementById('courses-section');
    if (coursesSection) {
      coursesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const mainNavItems = [
    { 
      name: "Research", 
      path: "/research",
      dropdown: [
        { name: "Research Papers", path: "https://www.trizenventures.com/research" },
        { name: "Case Studies", path: "https://www.trizenventures.com/research" },
        { name: "Publications", path: "https://www.trizenventures.com/research" }
      ]
    },
    { 
      name: "Consulting", 
      path: "/consulting",
      dropdown: [
        { name: "Enterprise Solutions", path: "https://www.trizenventures.com/consulting" },
        { name: "Digital Transformation", path: "https://www.trizenventures.com/consulting" },
        { name: "Technology Strategy", path: "https://www.trizenventures.com/consulting" }
      ]
    },
    { 
      name: "Training", 
      path: "/training",
      dropdown: [
        { name: "Corporate Training", path: "https://lms.trizenventures.com/" },
        { name: "Certification Programs", path: "https://lms.trizenventures.com/" },
        { name: "Skills Workshops", path: "https://lms.trizenventures.com/" }
      ]
    },
    { 
      name: "Insights", 
      path: "/insights",
      dropdown: [
        { name: "Blog", path: "https://www.trizenventures.com/insights" },
        { name: "Webinars", path: "https://www.trizenventures.com/insights" },
        { name: "Industry Reports", path: "https://www.trizenventures.com/insights" }
      ]
    },
    { 
      name: "Careers", 
      path: "/careers" 
    },
  ];

  const secondaryNavItems = [
    { name: "Home", path: "/" },
    { name: "My Courses", path: "/my-courses" },
    { 
      name: "Explore Courses", 
      path: "#courses-section",
      action: scrollToCourses
    },
    { name: "Pricing", path: "/pricing" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleNavItemClick = (item: any, e: React.MouseEvent) => {
    if (item.action) {
      e.preventDefault();
      item.action();
    }
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full bg-white transition-all duration-200",
      isScrolled ? "shadow-sm" : "border-b border-border/40"
    )}>
      {/* Top Navigation Bar with Logo and Main Nav Items */}
      <div className="container flex h-16 max-w-7xl items-center">
        {/* Logo */}
        <div className="flex items-center mr-8">
          <Link to="/" className="flex items-center">
            <img 
              src="/lovable-uploads/b66cad1a-9e89-49b0-a481-bbbb0a2bbded.png" 
              alt="Trizen Logo" 
              className="h-10" 
            />
          </Link>
        </div>

        {/* Main Navigation */}
        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList>
            {mainNavItems.map((item) => (
              item.dropdown ? (
                <NavigationMenuItem key={item.name}>
                  <NavigationMenuTrigger 
                    className={cn(
                      "text-sm font-medium px-3 py-2 transition-colors hover:text-primary",
                      isActive(item.path) ? "font-semibold text-primary" : "text-foreground"
                    )}
                  >
                    {item.name}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[400px] gap-3 p-4 lg:grid-cols-1">
                      {item.dropdown.map((subItem) => (
                        <NavigationMenuLink
                          key={subItem.name}
                          asChild
                        >
                          <Link
                            to={subItem.path}
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                          >
                            <div className="text-sm font-medium leading-none">{subItem.name}</div>
                          </Link>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ) : (
                <NavigationMenuItem key={item.name}>
                  <Link 
                    to={item.path}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium transition-colors hover:text-primary relative group",
                      isActive(item.path) ? "text-primary font-semibold" : "text-foreground"
                    )}
                  >
                    {item.name}
                    <span className="absolute left-0 bottom-0 h-[2px] w-0 bg-primary transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                </NavigationMenuItem>
              )
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Spacer and Auth Buttons aligned right */}
        <div className="flex-1 flex justify-end items-center gap-3">
          {!isMobile && (
            <Button 
              variant="ghost" 
              size="icon"
              className="mr-1"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </Button>
          )}
          
          {isAuthenticated ? (
            <div className="flex items-center">
              <Link to="/profile" className="flex items-center mr-4">
                <User className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium hidden sm:inline">{user?.name || user?.email}</span>
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="transition-all hover:bg-primary hover:text-primary-foreground"
              >
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button 
                variant={location.pathname === '/login' ? 'default' : 'outline'}
                size="sm" 
                onClick={() => navigate('/login')}
                className={cn(
                  "transition-all",
                  location.pathname === '/login' 
                    ? "bg-primary text-white hover:bg-primary/90" 
                    : "border-primary text-primary hover:bg-primary/10"
                )}
              >
                Login
              </Button>
              <Button 
                size="sm" 
                variant={location.pathname === '/signup' ? 'default' : 'outline'}
                onClick={() => navigate('/signup')}
                className={cn(
                  "transition-all",
                  location.pathname === '/signup'
                    ? "bg-primary text-white hover:bg-primary/90"
                    : "border-primary text-primary hover:bg-primary/10"
                )}
              >
                Signup
              </Button>
            </div>
          )}
        </div>
        
        {/* Mobile Menu Button */}
        <button 
          className="lg:hidden p-2 ml-3" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Secondary Navigation Bar */}
      <div className={cn(
        "border-t border-border/20 bg-background/95 backdrop-blur-sm",
        isScrolled ? "h-0 opacity-0 overflow-hidden" : "h-10 opacity-100"
      )}>
        <div className="container hidden lg:block max-w-7xl transition-all duration-300">
          <nav className="flex h-10 items-center">
            <div className="flex">
              {secondaryNavItems.map((item) => (
                <Link 
                  key={item.name} 
                  to={item.path}
                  onClick={(e) => handleNavItemClick(item, e)}
                  className={cn(
                    "text-sm font-medium mr-6 transition-colors hover:text-primary relative group",
                    isActive(item.path) ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.name}
                  <span className="absolute left-0 bottom-0 h-[2px] w-0 bg-primary transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden py-4 px-4 bg-white border-t border-gray-100 shadow-md overflow-auto max-h-[80vh]">
          {/* Search for mobile */}
          <div className="flex items-center border rounded-md p-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground mr-2" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full bg-transparent outline-none text-sm"
            />
          </div>

          {/* Main Nav Items for Mobile */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">Main Navigation</h4>
            <div className="space-y-1">
              {mainNavItems.map((item) => (
                <div key={item.name} className="mb-2">
                  <Link 
                    to={item.path} 
                    className={cn(
                      "block text-base font-medium py-2",
                      isActive(item.path) ? "text-primary" : "text-foreground"
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                  
                  {item.dropdown && (
                    <div className="pl-4 border-l border-gray-100 mt-1 space-y-1">
                      {item.dropdown.map((subItem) => (
                        <Link 
                          key={subItem.name}
                          to={subItem.path}
                          className="block text-sm py-2 text-muted-foreground hover:text-primary"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Secondary Links for Mobile */}
          <div className="mt-6 pt-4 border-t border-gray-100 space-y-4">
            <h4 className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">Quick Links</h4>
            <div className="space-y-1">
              {secondaryNavItems.map((item) => (
                <Link 
                  key={item.name} 
                  to={item.path} 
                  className={cn(
                    "block text-base font-medium py-2",
                    isActive(item.path) ? "text-primary" : "text-muted-foreground"
                  )}
                  onClick={(e) => {
                    handleNavItemClick(item, e);
                    setIsMenuOpen(false);
                  }}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Auth Actions for Mobile */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            {isAuthenticated ? (
              <div className="space-y-4">
                <div className="flex items-center py-2">
                  <User className="h-4 w-4 mr-2 text-primary" />
                  <span className="text-sm">{user?.name || user?.email}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    navigate('/login');
                    setIsMenuOpen(false);
                  }}
                >
                  Login
                </Button>
                <Button 
                  className="w-full"
                  onClick={() => {
                    navigate('/signup');
                    setIsMenuOpen(false);
                  }}
                >
                  Signup
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
