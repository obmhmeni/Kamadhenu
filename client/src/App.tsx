import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Sidebar from "@/components/sidebar";
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import Orders from "@/pages/orders";
import Payments from "@/pages/payments";
import Users from "@/pages/users";
import Settings from "@/pages/settings";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";
import { getCurrentUser, hasRole } from "./lib/auth";
import { useState, useEffect } from "react";

function Router() {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = getCurrentUser();

  useEffect(() => {
    // Close sidebar on route change (mobile)
    setSidebarOpen(false);
  }, [location]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        user={user}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="bg-card shadow-sm border-b lg:hidden">
          <div className="flex items-center justify-between p-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="text-foreground"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-medium">KaamDhenu</h1>
            <div className="w-6"></div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            {(hasRole(user, 'admin') || hasRole(user, 'district_head') || hasRole(user, 'worker')) && (
              <Route path="/products" component={Products} />
            )}
            <Route path="/orders" component={Orders} />
            <Route path="/payments" component={Payments} />
            {hasRole(user, 'admin') && (
              <>
                <Route path="/users" component={Users} />
                <Route path="/transactions" component={Users} />
                <Route path="/settings" component={Settings} />
              </>
            )}
            <Route path="/profile" component={Profile} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
