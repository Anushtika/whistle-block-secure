import { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, LogOut, Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";

interface LayoutProps {
  children: ReactNode;
  title: string;
  icon: ReactNode;
  sidebarItems: {
    href: string;
    icon: ReactNode;
    label: string;
    count?: number;
    isCurrent: boolean;
  }[];
  userLabel: string;
  sidebarColor: string;
}

export default function Layout({ 
  children, 
  title, 
  icon, 
  sidebarItems, 
  userLabel,
  sidebarColor
}: LayoutProps) {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Get current user info
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/me']
  });
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className={`${sidebarColor} border-b border-opacity-20`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                {icon}
                <span className="ml-2 text-white font-semibold text-lg">{title}</span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex items-center ml-4 md:ml-6">
                <Button variant="ghost" size="icon" className="text-primary-200 hover:text-white">
                  <Bell className="h-6 w-6" />
                </Button>
                <div className="ml-3 relative">
                  <div>
                    <Avatar className="bg-primary-700">
                      <AvatarFallback className="bg-primary-100">
                        <span className="text-primary-700 font-medium">{userLabel}</span>
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-primary-200 hover:text-white ml-2" onClick={handleLogout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar items={sidebarItems} color={sidebarColor} />
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
