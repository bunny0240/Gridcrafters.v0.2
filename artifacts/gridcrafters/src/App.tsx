import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuthContext } from "@/contexts/useAuthContext";
import { LevelUpOverlay } from "@/components/LevelUpOverlay";
import { AuthGuard } from "@/components/AuthGuard";
import NotFound from "@/pages/not-found";
import { Sidebar } from "@/components/Sidebar";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import ShortcutMasters from "@/pages/ShortcutMasters";
import FormattingKings from "@/pages/FormattingKings";
import Analyst from "@/pages/Analyst";
import Leaderboard from "@/pages/Leaderboard";
import Profile from "@/pages/Profile";
import AuthConfirm from "@/pages/AuthConfirm";

function AppShell() {
  const { user, loading } = useAuthContext();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!user && location !== "/") {
        setLocation("/");
      } else if (user && location === "/") {
        setLocation("/dashboard");
      }
    }
  }, [user, loading, location, setLocation]);

  if (loading) return null;

  if (!user) {
    return (
      <Switch>
        <Route path="/auth/confirm" component={AuthConfirm} />
        <Route path="/" component={Landing} />
        <Route component={Landing} />
      </Switch>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#0A0A0A] text-[#ECECEC] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <AuthGuard>
          <Switch>
            <Route path="/dashboard"  component={Dashboard} />
            <Route path="/shortcuts"  component={ShortcutMasters} />
            <Route path="/formatting" component={FormattingKings} />
            <Route path="/analyst"    component={Analyst} />
            <Route path="/leaderboard" component={Leaderboard} />
            <Route path="/profile"    component={Profile} />
            <Route path="/"           component={Dashboard} />
            <Route component={NotFound} />
          </Switch>
        </AuthGuard>
      </main>
      <LevelUpOverlay />
    </div>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <AuthProvider>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppShell />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;
