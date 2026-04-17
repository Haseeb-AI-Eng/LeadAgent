import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import CommandCenter from "./pages/CommandCenter";
import WorkflowMonitor from "./pages/WorkflowMonitor";
import ReportsDashboard from "./pages/ReportsDashboard";
import LeadsPage from "./pages/LeadsPage";
import OutboxPage from "./pages/OutboxPage";
import DashboardLayout from "./components/DashboardLayout";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard/*"}>
        {() => (
          <DashboardLayout>
            <Switch>
              <Route path={"/dashboard/command-center"} component={CommandCenter} />
              <Route path={"/dashboard/workflow-monitor"} component={WorkflowMonitor} />
              <Route path={"/dashboard/leads"} component={LeadsPage} />
              <Route path={"/dashboard/outbox"} component={OutboxPage} />
              <Route path={"/dashboard/reports-dashboard"} component={ReportsDashboard} />
              <Route component={NotFound} />
            </Switch>
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
