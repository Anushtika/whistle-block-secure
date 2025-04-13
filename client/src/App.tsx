import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import LoginPage from "@/components/LoginPage";
import WhistleblowerLayout from "@/components/WhistleblowerLayout";
import InvestigatorLayout from "@/components/InvestigatorLayout";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

// User type definition to match backend response
interface User {
  id: number;
  username: string;
  role: string;
}

function App() {
  const [location, setLocation] = useLocation();
  
  // Check authentication status
  const { data: user, isLoading, isError } = useQuery<User | null>({
    queryKey: ['/api/auth/me'],
    retry: false,
    refetchOnWindowFocus: false
  });

  // Redirect based on authentication status
  useEffect(() => {
    if (isLoading) return;
    
    // If not authenticated and not on login page, redirect to login
    if (isError && location !== "/") {
      setLocation("/");
    }
    
    // If authenticated and on login page, redirect to appropriate dashboard
    if (user && location === "/") {
      if (user.role === "whistleblower") {
        setLocation("/whistleblower/dashboard");
      } else if (user.role === "investigator") {
        setLocation("/investigator/dashboard");
      }
    }
  }, [user, isLoading, isError, location, setLocation]);

  return (
    <>
      <Switch>
        {/* Login page */}
        <Route path="/" component={LoginPage} />
        
        {/* Whistleblower routes */}
        <Route path="/whistleblower/:rest*">
          {(params) => <WhistleblowerLayout params={{ rest: params["rest*"] || "" }} />}
        </Route>
        
        {/* Investigator routes */}
        <Route path="/investigator/:rest*">
          {(params) => <InvestigatorLayout params={{ rest: params["rest*"] || "" }} />}
        </Route>
        
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </>
  );
}

export default App;
