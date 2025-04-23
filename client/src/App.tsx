import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Landing from "@/pages/landing";
import Navbar from "@/components/navbar";
import ColumnConfig from "@/pages/column-config";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(user => {
        if (!user) {
          setLocation('/login');
        }
      });
  }, [setLocation]);

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login}/>
      <Route path="/register" component={Register}/>
      <Route path="/dashboard">
        <ProtectedRoute component={Home} />
      </Route>
      <Route path="/columns">
        <ProtectedRoute component={ColumnConfig} />
      </Route>
      <Route path="/" component={Landing}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <Navbar />
          <main className="flex-1">
            <Router />
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
