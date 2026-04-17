import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle, PlayCircle, Loader2, Mail, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { toast } from "sonner";
/**
 * Get webmail verification URL based on email provider
 */
function getWebmailVerificationUrl(email: string): string {
  const domain = email.split("@")[1]?.toLowerCase() || "";
  const searchQuery = "is:sent";

  if (domain.includes("gmail.com") || domain.includes("google.com")) {
    return `https://mail.google.com/mail/u/0/#search/${searchQuery}`;
  } else if (
    domain.includes("outlook.com") ||
    domain.includes("hotmail.com") ||
    domain.includes("office365.com")
  ) {
    return `https://outlook.live.com/mail/0/search?q=${searchQuery}`;
  } else if (domain.includes("yahoo.com")) {
    return `https://mail.yahoo.com/?search=${encodeURIComponent(searchQuery)}`;
  } else {
    return `https://${domain}/mail`;
  }
}
interface WorkflowStep {
  id: string;
  name: string;
  agent: string;
  status: "pending" | "running" | "completed" | "failed";
  description: string;
  dependencies: string[];
  output?: unknown;
  error?: string;
  input?: Record<string, unknown>;
  startedAt?: string;
  completedAt?: string;
}

type WorkflowMetadata = {
  campaignId?: number;
};

export default function WorkflowMonitor() {
  const [, navigate] = useLocation();
  const initialWorkflowId =
    typeof window !== "undefined"
      ? Number(new URLSearchParams(window.location.search).get("workflowId") || "")
      : NaN;
  const [selectedWorkflow, setSelectedWorkflow] = useState<number | null>(
    Number.isFinite(initialWorkflowId) ? initialWorkflowId : null
  );
  const [refreshInterval, setRefreshInterval] = useState(3000);

  const workflowsQuery = trpc.data.getWorkflows.useQuery();
  const monitorQuery = trpc.masterAgent.monitorWorkflow.useQuery(
    { workflowId: selectedWorkflow! },
    { enabled: !!selectedWorkflow, refetchInterval: refreshInterval }
  );

  const workflows = workflowsQuery.data?.workflows || [];
  const currentWorkflow = monitorQuery.data;
  const campaignId = useMemo(() => {
    const metadata = currentWorkflow?.metadata as any | undefined;
    return metadata?.campaignId;
  }, [currentWorkflow?.metadata]);

  const senderEmail = useMemo(() => {
    const metadata = currentWorkflow?.metadata as any | undefined;
    return metadata?.profile?.senderEmail || "";
  }, [currentWorkflow?.metadata]);

  useEffect(() => {
    if (workflows.length > 0 && !selectedWorkflow) {
      setSelectedWorkflow(workflows[0].id);
    }
  }, [workflows, selectedWorkflow]);

  useEffect(() => {
    if (currentWorkflow?.status === "completed" || currentWorkflow?.status === "failed") {
      setRefreshInterval(0);
    } else if (selectedWorkflow) {
      setRefreshInterval(3000);
    }
  }, [currentWorkflow?.status, selectedWorkflow]);

  // Show toast notification when workflow completes
  useEffect(() => {
    if (currentWorkflow?.status === "completed") {
      const steps = (currentWorkflow?.steps || []) as WorkflowStep[];
      const communicationStep = steps.find(s => s.agent === "communication");
      const output = communicationStep?.output as any;
      const emailCount = output?.attemptedLeadCount || 0;
      
      if (emailCount > 0) {
        const webmailUrl = senderEmail ? getWebmailVerificationUrl(senderEmail) : "";
        
        toast.success(
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => {
              if (webmailUrl) window.open(webmailUrl, "_blank");
            }}
          >
            <Mail className="w-4 h-4 flex-shrink-0" />
            <div>
              <p className="font-medium">✅ Success! {emailCount} emails sent</p>
              <p className="text-xs opacity-75">📧 Click to verify in webmail</p>
            </div>
            {webmailUrl && <ExternalLink className="w-4 h-4 flex-shrink-0 ml-2" />}
          </div>,
          {
            description: `Workflow "${currentWorkflow.name}" completed successfully`,
            duration: 6000,
            action: webmailUrl ? {
              label: "Open Webmail",
              onClick: () => {
                window.open(webmailUrl, "_blank");
              },
            } : undefined,
          }
        );
      } else {
        toast.success(`Workflow "${currentWorkflow.name}" completed`, {
          duration: 5000,
        });
      }
    } else if (currentWorkflow?.status === "failed") {
      toast.error(`Workflow failed: ${currentWorkflow?.error || "Unknown error"}`, {
        duration: 5000,
      });
    }
  }, [currentWorkflow?.status]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "running":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case "pending":
        return <Clock className="w-5 h-5 text-gray-500" />;
      case "failed":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="badge-success">Completed</Badge>;
      case "running":
        return <Badge className="badge-info">Running</Badge>;
      case "pending":
        return <Badge className="badge-warning">Pending</Badge>;
      case "failed":
        return <Badge className="badge-error">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gradient mb-2">Workflow Monitor</h1>
        <p className="text-muted-foreground">
          Real-time monitoring of agent execution and workflow progress
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Workflow List */}
        <div className="lg:col-span-1">
          <Card className="card-premium p-4">
            <h3 className="font-semibold mb-4">Active Workflows</h3>
            <div className="space-y-2">
              {workflows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No workflows yet</p>
              ) : (
                workflows.map((workflow: any) => (
                  <button
                    key={workflow.id}
                    onClick={() => setSelectedWorkflow(workflow.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedWorkflow === workflow.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <p className="text-sm font-medium truncate">{workflow.name}</p>
                    <p className="text-xs opacity-75 mt-1">{workflow.status}</p>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Workflow Details */}
        <div className="lg:col-span-3 space-y-4">
          {currentWorkflow ? (
            <>
              {/* Progress Card */}
              <Card className="card-premium p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">{currentWorkflow.name}</h2>
                  {getStatusBadge(currentWorkflow.status)}
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-sm font-medium">
                      {currentWorkflow.progressPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${currentWorkflow.progressPercentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {currentWorkflow.progress}
                  </p>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">
                      {new Date(currentWorkflow.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p className="font-medium">
                      {new Date(currentWorkflow.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate(
                        campaignId
                          ? `/dashboard/leads?campaignId=${campaignId}`
                          : "/dashboard/leads"
                      )
                    }
                  >
                    View Leads
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate(
                        campaignId
                          ? `/dashboard/outbox?campaignId=${campaignId}`
                          : "/dashboard/outbox"
                      )
                    }
                  >
                    View Sent Emails
                  </Button>
                </div>

                {currentWorkflow.error ? (
                  <p className="text-sm text-red-500 mt-4">{currentWorkflow.error}</p>
                ) : null}
              </Card>

              {/* Steps Timeline */}
              <Card className="card-premium p-6">
                <h3 className="font-semibold mb-4">Execution Steps</h3>
                <div className="space-y-4">
                  {Array.isArray(currentWorkflow.steps) && currentWorkflow.steps.map((step: WorkflowStep, idx: number) => (
                    <div key={idx} className="relative">
                      {/* Connector Line */}
                      {idx < (Array.isArray(currentWorkflow.steps) ? currentWorkflow.steps.length : 0) - 1 && (
                        <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-border" />
                      )}

                      {/* Step Card */}
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 pt-1">
                          {getStatusIcon(step.status)}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{step.name}</h4>
                            <span className="text-xs px-2 py-1 bg-accent/10 text-accent rounded">
                              {step.agent}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {step.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {getStatusBadge(step.status)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <Card className="card-premium p-12 text-center">
              <PlayCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                Select a workflow to monitor its progress
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
