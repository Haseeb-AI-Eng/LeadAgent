import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Zap, Workflow, BarChart3, Mail, Sparkles, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg">ABOA</span>
          </div>
          <Button
            onClick={() => setLocation("/dashboard/command-center")}
            className="gap-2"
          >
            Open Dashboard <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </nav>

      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gradient">
            Autonomous Business Operations
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Orchestrate intelligent sales workflows with AI-powered agents. From lead generation to reporting, automate your entire business process.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Working as {user?.name ?? "Guest"}. No sign-in required.
          </p>
          <Button
            size="lg"
            onClick={() => setLocation("/dashboard/command-center")}
            className="gap-2"
          >
            <Zap className="w-5 h-5" />
            Launch Command Center
          </Button>
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/30">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Powerful Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: "Command Center",
                description: "Natural language commands to orchestrate complex workflows",
              },
              {
                icon: Workflow,
                title: "Workflow Monitor",
                description: "Real-time monitoring of agent execution and progress",
              },
              {
                icon: BarChart3,
                title: "Analytics Dashboard",
                description: "Comprehensive reports with actionable insights",
              },
              {
                icon: Mail,
                title: "Smart Email Routing",
                description: "AI-powered message classification and routing",
              },
              {
                icon: Sparkles,
                title: "Lead Generation",
                description: "Automated lead discovery and scoring",
              },
              {
                icon: Workflow,
                title: "Multi-Agent System",
                description: "Coordinated AI agents for complex tasks",
              },
            ].map((feature, idx) => (
              <Card key={idx} className="card-premium p-6">
                <feature.icon className="w-10 h-10 text-primary mb-4" />
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Intelligent Agents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                name: "Master Agent",
                description: "Orchestrates all sub-agents and manages workflow execution",
              },
              {
                name: "Lead Generation Agent",
                description: "Finds and scores potential leads automatically",
              },
              {
                name: "Communication Agent",
                description: "Handles email generation, sending, and tracking",
              },
              {
                name: "Decision Agent",
                description: "Ranks leads and filters top prospects",
              },
              {
                name: "Reporting Agent",
                description: "Generates analytics and actionable insights",
              },
              {
                name: "Email Routing Agent",
                description: "Classifies and routes messages intelligently",
              },
            ].map((agent, idx) => (
              <Card key={idx} className="card-premium p-6 border-l-4 border-l-primary">
                <h3 className="font-semibold mb-2">{agent.name}</h3>
                <p className="text-sm text-muted-foreground">{agent.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-primary/5">
        <div className="container max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Automate?</h2>
          <p className="text-muted-foreground mb-8">
            Start orchestrating intelligent business workflows with natural language commands.
          </p>
          <Button
            size="lg"
            onClick={() => setLocation("/dashboard/command-center")}
            className="gap-2"
          >
            <Zap className="w-5 h-5" />
            Go to Command Center
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8 px-4">
        <div className="container text-center text-sm text-muted-foreground">
          <p>ABOA - Autonomous Business Operations Agent</p>
          <p className="mt-2">Powered by AI-driven multi-agent orchestration</p>
        </div>
      </footer>
    </div>
  );
}
