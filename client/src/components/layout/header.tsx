import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Search, 
  Bell, 
  Menu, 
  X, 
  LogOut,
  User,
  Settings,
  ShoppingCart,
  Truck,
  MessageSquare,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Get initials for avatar
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getNavLinks = () => {
    const links = [
      { name: "Dashboard", path: "/", icon: <Home className="h-5 w-5 md:mr-2" /> },
      { name: "Marketplace", path: "/products", icon: <ShoppingCart className="h-5 w-5 md:mr-2" /> },
      { name: "Bids", path: "/bids", icon: <ShoppingCart className="h-5 w-5 md:mr-2" /> },
      { name: "Transport", path: "/transport", icon: <Truck className="h-5 w-5 md:mr-2" /> },
      { name: "Messages", path: "/messages", icon: <MessageSquare className="h-5 w-5 md:mr-2" /> },
    ];

    return links;
  };

  return (
    <header className="bg-primary shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
              <Link href="/">
                <span className="ml-2 text-white text-xl font-bold font-nunito cursor-pointer">AgriBridge</span>
              </Link>
            </div>
            <nav className="hidden md:ml-6 md:flex md:space-x-8">
              {getNavLinks().map((link) => (
                <Link key={link.path} href={link.path}>
                  <a className={`text-white hover:text-secondary px-3 py-2 text-sm font-medium flex items-center ${location === link.path ? 'border-b-2 border-secondary' : ''}`}>
                    {link.icon}
                    <span>{link.name}</span>
                  </a>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0 hidden md:block">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input 
                  type="text" 
                  placeholder="Search products..." 
                  className="px-10 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary w-60" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <Button variant="ghost" size="icon" className="text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-white">
                <span className="sr-only">View notifications</span>
                <Bell className="h-6 w-6" />
              </Button>
              <div className="ml-3 relative">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative rounded-full bg-primary text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-white p-0">
                      <span className="sr-only">Open user menu</span>
                      <Avatar className="h-8 w-8 rounded-full bg-secondary text-white">
                        <AvatarFallback>
                          {user ? getInitials(user.fullName) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="font-normal">
                        <div className="font-medium">{user?.fullName}</div>
                        <div className="text-xs text-muted-foreground">
                          {user?.email}
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="-mr-2 flex md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="text-white inline-flex items-center justify-center p-2 rounded-md hover:text-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-primary-foreground border-t border-primary-foreground/10">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {getNavLinks().map((link) => (
              <Link key={link.path} href={link.path}>
                <a 
                  className={`${
                    location === link.path 
                      ? 'bg-primary text-white' 
                      : 'text-gray-200 hover:bg-primary-foreground/20 hover:text-white'
                  } block px-3 py-2 rounded-md text-base font-medium flex items-center`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.icon}
                  <span className="ml-2">{link.name}</span>
                </a>
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-primary-foreground/10">
            <div className="px-2 space-y-1">
              <form onSubmit={handleSearch} className="mb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input 
                    type="text" 
                    placeholder="Search products..." 
                    className="px-10 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary w-full" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </form>
              <Button 
                variant="ghost" 
                className="flex items-center w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:bg-primary-foreground/20 hover:text-white"
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.location.href = "/profile";
                }}
              >
                <User className="mr-3 h-5 w-5" />
                Profile
              </Button>
              <Button 
                variant="ghost" 
                className="flex items-center w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:bg-primary-foreground/20 hover:text-white"
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.location.href = "/settings";
                }}
              >
                <Settings className="mr-3 h-5 w-5" />
                Settings
              </Button>
              <Button 
                variant="ghost" 
                className="flex items-center w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:bg-primary-foreground/20 hover:text-white"
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
