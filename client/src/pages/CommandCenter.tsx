import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Zap, Mail } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function CommandCenter() {
  const [command, setCommand] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [decomposed, setDecomposed] = useState<any>(null);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [, navigate] = useLocation();

  const decomposeCommand = trpc.masterAgent.decomposeCommand.useMutation();
  const createAndExecuteWorkflow = trpc.masterAgent.createAndExecuteWorkflow.useMutation();

  const handleDecompose = async () => {
    if (!command.trim()) {
      toast.error("Please enter a command");
      return;
    }

    setIsLoading(true);
    try {
      const result = await decomposeCommand.mutateAsync({ command });
      setDecomposed(result);
      setCommandHistory([command, ...commandHistory.slice(0, 4)]);
      toast.success("Command decomposed successfully!");
    } catch (error) {
      toast.error("Failed to decompose command");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!command.trim()) {
      toast.error("Please enter a command");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createAndExecuteWorkflow.mutateAsync({ command });
      toast.success(
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4" />
          <span>Workflow started! Watch real-time progress →</span>
        </div>,
        {
          duration: 5000,
        }
      );
      setCommandHistory([command, ...commandHistory.slice(0, 4)]);
      setCommand("");
      setDecomposed(null);
      navigate(`/dashboard/workflow-monitor?workflowId=${result.workflowId}`);
    } catch (error) {
      toast.error("Failed to execute workflow");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gradient mb-2">Command Center</h1>
        <p className="text-muted-foreground">
          Enter natural language commands to orchestrate automated business workflows
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Command Input */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="card-premium p-6">
            <label className="block text-sm font-medium mb-3">
              Business Command
            </label>
            <Textarea
              placeholder="Example: Find 100 restaurants in New York and send marketing emails"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              className="min-h-24 resize-none"
              disabled={isLoading}
            />
            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleDecompose}
                disabled={isLoading || !command.trim()}
                variant="outline"
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Decompose
                  </>
                )}
              </Button>
              <Button
                onClick={handleExecute}
                disabled={isLoading || !command.trim()}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Execute
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Decomposed Steps */}
          {decomposed && (
            <Card className="card-premium p-6">
              <h3 className="font-semibold mb-4">Workflow Steps</h3>
              <div className="space-y-3">
                {decomposed.steps?.map((step: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 bg-muted rounded-lg"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{step.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {step.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-block px-2 py-1 bg-accent/10 text-accent text-xs rounded font-medium">
                          {step.agent}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Estimated Duration: {decomposed.estimatedDuration}
              </p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Commands */}
          <Card className="card-premium p-6">
            <h3 className="font-semibold mb-4">Quick Commands</h3>
            <div className="space-y-2">
              {[
                "Find 50 tech leads in San Francisco",
                "Send emails to top 100 prospects",
                "Generate sales report for Q1",
                "Rank leads by conversion probability",
              ].map((quickCmd, idx) => (
                <button
                  key={idx}
                  onClick={() => setCommand(quickCmd)}
                  className="w-full text-left text-sm p-2 rounded hover:bg-muted transition-colors"
                >
                  {quickCmd}
                </button>
              ))}
            </div>
          </Card>

          {/* Command History */}
          {commandHistory.length > 0 && (
            <Card className="card-premium p-6">
              <h3 className="font-semibold mb-4">Recent Commands</h3>
              <div className="space-y-2">
                {commandHistory.map((cmd, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCommand(cmd)}
                    className="w-full text-left text-xs p-2 rounded hover:bg-muted transition-colors line-clamp-2"
                    title={cmd}
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Tips */}
          <Card className="card-premium p-6 bg-accent/5 border-accent/20">
            <h3 className="font-semibold mb-2 text-sm">Tips</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Be specific about your goals</li>
              <li>• Include target audience</li>
              <li>• Mention desired outcomes</li>
              <li>• System will optimize automatically</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
