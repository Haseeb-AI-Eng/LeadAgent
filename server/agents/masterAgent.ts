import { invokeLLM } from "../_core/llm";
import { ENV } from "../_core/env";
import { CommunicationAgent } from "./communicationAgent";
import { DecisionAgent } from "./decisionAgent";
import { LeadGenerationAgent } from "./leadGenerationAgent";
import { ReportingAgent } from "./reportingAgent";
import {
  createCampaign,
  createTask,
  createWorkflow,
  getLeadsByCampaignId,
  getWorkflowById,
  updateCampaign,
  updateTask,
  updateWorkflow,
} from "../db";

interface WorkflowStep {
  id: string;
  taskId?: number;
  name: string;
  agent: string;
  status: "pending" | "running" | "completed" | "failed";
  description: string;
  dependencies: string[];
  input?: Record<string, unknown>;
  output?: unknown;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

interface DecomposedCommand {
  goal: string;
  steps: WorkflowStep[];
  estimatedDuration: string;
}

interface ExecutionProfile {
  campaignId: number;
  command: string;
  leadCount: number;
  topCount: number;
  followUpDays: number;
  senderEmail: string;
  senderEmails: string[];
  industry?: string;
  location?: string;
  marketingEmail?: {
    subject: string;
    body: string;
  };
}

const AGENT_ALIASES: Record<string, WorkflowStep["agent"]> = {
  lead_generation: "lead_generation",
  communication: "communication",
  decision: "decision",
  reporting: "reporting",
  execution: "execution",
};

/**
 * Master Agent - Orchestrates all sub-agents and manages workflow execution
 * Responsibilities:
 * - Parse natural language commands
 * - Decompose commands into tasks
 * - Assign tasks to appropriate sub-agents
 * - Monitor execution
 * - Handle retries and failures
 */
export class MasterAgent {
  private userId: number;

  constructor(userId: number) {
    this.userId = userId;
  }

  /**
   * Parse and decompose a natural language command into a workflow
   */
  async decomposeCommand(command: string): Promise<DecomposedCommand> {
    console.log(`[MasterAgent] Processing command: "${command}"`);
    
    const systemPrompt = `You are an expert workflow orchestrator. Your job is to break down business automation commands into specific, executable steps.

Each step should be assigned to one of these agents:
- lead_generation: Finding and scoring potential leads
- communication: Sending emails and managing outreach
- decision: Ranking and filtering leads
- reporting: Generating analytics and reports
- execution: Performing actual business operations

Return a JSON response with this structure:
{
  "goal": "Clear statement of the overall objective",
  "steps": [
    {
      "id": "step_1",
      "name": "Step name",
      "agent": "agent_name",
      "description": "What this step does",
      "dependencies": ["step_id_if_any"]
    }
  ],
  "estimatedDuration": "Time estimate"
}`;

    try {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Command: ${command}` },
        ],
        response_format: {
          type: "json_object",
        },
        maxTokens: 1000, // Workflow decomposition needs up to 1000 tokens
      });

      const content = response.choices[0]?.message.content;
      if (!content) {
        throw new Error("Failed to decompose command");
      }

      const contentStr = typeof content === "string" ? content : JSON.stringify(content);
      return JSON.parse(contentStr);
    } catch (error) {
      console.warn("[MasterAgent] Falling back to deterministic planning:", error);
      return this.buildFallbackPlan(command);
    }
  }

  /**
   * Create a workflow from decomposed command
   */
  async createWorkflowFromCommand(command: string): Promise<number> {
    const decomposed = await this.decomposeCommand(command);
    const campaign = await createCampaign(this.userId, {
      name: decomposed.goal,
      description: `Campaign created from command: ${command}`,
      status: "draft",
      workflowId: null,
      metrics: null,
    });
    const profile = this.buildExecutionProfile(command, campaign.id);

    const taskDefinitions: WorkflowStep[] = [];
    const workflow = await createWorkflow(this.userId, {
      name: decomposed.goal,
      description: `Automated workflow: ${command}`,
      status: "pending" as const,
      totalSteps: decomposed.steps.length,
      completedSteps: 0,
      steps: decomposed.steps.map((step) => ({
        ...step,
        agent: this.normalizeAgent(step.agent),
        status: "pending",
        input: this.getStepInput(step.agent, profile),
      })),
      metadata: {
        command,
        campaignId: campaign.id,
        profile,
      },
    });
    const workflowId = workflow.id;

    await updateWorkflow(workflowId, this.userId, {
      metadata: {
        command,
        campaignId: campaign.id,
        profile,
        workflowId,
      },
    });

    await updateCampaign(campaign.id, this.userId, { workflowId }).catch(() => undefined);

    for (let index = 0; index < decomposed.steps.length; index += 1) {
      const step = decomposed.steps[index];
      const taskRecord = await createTask(this.userId, {
        command: step.description,
        workflowId,
        status: "pending" as const,
        assignedAgent: this.normalizeAgent(step.agent),
        priority: index,
        metadata: this.getStepInput(step.agent, profile),
      });

      taskDefinitions.push({
        ...step,
        agent: this.normalizeAgent(step.agent),
        taskId: taskRecord.id,
        status: "pending",
        input: this.getStepInput(step.agent, profile),
      });
    }

    await updateWorkflow(workflowId, this.userId, {
      steps: taskDefinitions as any,
    });

    return workflowId;
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowId: number): Promise<void> {
    const workflow = await getWorkflowById(workflowId, this.userId);
    if (!workflow) throw new Error("Workflow not found");

    try {
      await updateWorkflow(workflowId, this.userId, { status: "running" });

      const steps = (workflow.steps as WorkflowStep[] | null) ?? [];
      if (steps.length === 0) {
        throw new Error("Workflow has no executable steps");
      }

      const profile = this.getExecutionProfile(workflow);
      const mutableSteps = [...steps];
      let progressMade = true;

      while (progressMade && mutableSteps.some((step) => step.status === "pending")) {
        progressMade = false;

        for (const step of mutableSteps) {
          if (step.status !== "pending" || !this.areDependenciesSatisfied(step, mutableSteps)) {
            continue;
          }

          progressMade = true;
          const startedAt = new Date().toISOString();
          await this.updateStepState(workflowId, mutableSteps, step.id, {
            status: "running",
            startedAt,
          });

          if (step.taskId) {
            await updateTask(step.taskId, this.userId, {
              status: "running",
              metadata: {
                ...(step.input ?? {}),
                startedAt,
              },
            });
          }

          try {
            const output = await this.executeStep(step, profile);
            const completedAt = new Date().toISOString();

            await this.updateStepState(workflowId, mutableSteps, step.id, {
              status: "completed",
              output,
              completedAt,
            });

            if (step.taskId) {
              await updateTask(step.taskId, this.userId, {
                status: "completed",
                result: JSON.stringify(output),
                completedAt: new Date(completedAt),
                metadata: {
                  ...(step.input ?? {}),
                  output,
                },
              });
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[MasterAgent] Step ${step.name} failed:`, error);

            await this.updateStepState(workflowId, mutableSteps, step.id, {
              status: "failed",
              error: errorMessage,
            });

            if (step.taskId) {
              await updateTask(step.taskId, this.userId, {
                status: "failed",
                error: errorMessage,
              });
            }
          }
        }
      }

      if (mutableSteps.some((step) => step.status === "pending")) {
        const blockedStepIds = mutableSteps
          .filter((step) => step.status === "pending")
          .map((step) => step.id)
          .join(", ");
        throw new Error(`Workflow stalled because dependencies never resolved: ${blockedStepIds}`);
      }

      const completedSteps = mutableSteps.filter((step) => step.status === "completed").length;
      const status = completedSteps === mutableSteps.length ? "completed" : "failed";
      await updateWorkflow(workflowId, this.userId, {
        status: status as "completed" | "failed",
        completedSteps,
        steps: mutableSteps as any,
        completedAt: new Date(),
      });
    } catch (error) {
      console.error("[MasterAgent] Workflow execution failed:", error);
      await updateWorkflow(workflowId, this.userId, {
        status: "failed" as const,
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Monitor workflow execution status
   */
  async monitorWorkflow(workflowId: number) {
    const workflow = await getWorkflowById(workflowId, this.userId);
    if (!workflow) throw new Error("Workflow not found");

    return {
      id: workflow.id,
      name: workflow.name,
      status: workflow.status,
      progress: `${workflow.completedSteps}/${workflow.totalSteps}`,
      progressPercentage:
        workflow.totalSteps > 0
          ? Math.round((workflow.completedSteps / workflow.totalSteps) * 100)
          : 0,
      steps: workflow.steps,
      metadata: workflow.metadata ?? null,
      error: workflow.error ?? null,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
    };
  }

  private normalizeAgent(agentName: string): WorkflowStep["agent"] {
    return AGENT_ALIASES[agentName] ?? "execution";
  }

  private buildExecutionProfile(command: string, campaignId: number): ExecutionProfile {
    const leadCount = this.extractFirstNumber(command, /(find|generate|source)\s+(\d+)/i) ??
      this.extractFirstNumber(command, /(\d+)\s+(?:leads?|prospects?|restaurants?|dentists?|companies|businesses)/i) ??
      5; // Reduced from 50 to minimize token usage and improve quality
    const topCount =
      this.extractFirstNumber(command, /(top|best)\s+(\d+)/i) ??
      Math.min(Math.max(leadCount, 3), 10); // Cap between 3-10 leads
    const followUpDays =
      this.extractFirstNumber(command, /follow\s*up\s*after\s+(\d+)\s+days?/i) ?? 3;
    const senderEmails = Array.from(
      new Set(
        (command.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? []).map((email) =>
          email.toLowerCase()
        )
      )
    );
    const senderEmail = senderEmails[0] ?? ENV.defaultSenderEmail;

    const marketingEmail = this.extractMarketingEmail(command);

    return {
      campaignId,
      command,
      leadCount,
      topCount,
      followUpDays,
      senderEmail,
      senderEmails: senderEmails.length > 0 ? senderEmails : [ENV.defaultSenderEmail],
      industry: this.extractIndustry(command),
      location: this.extractLocation(command),
      marketingEmail,
    };
  }

  private getExecutionProfile(workflow: Awaited<ReturnType<typeof getWorkflowById>>): ExecutionProfile {
    const metadata = (workflow?.metadata as Record<string, unknown> | null) ?? {};
    const profile = metadata.profile as Partial<ExecutionProfile> | undefined;

    return {
      campaignId: Number(profile?.campaignId ?? metadata.campaignId ?? 0),
      command: String(profile?.command ?? metadata.command ?? workflow?.description ?? ""),
      leadCount: Number(profile?.leadCount ?? 5),
      topCount: Number(profile?.topCount ?? 5),
      followUpDays: Number(profile?.followUpDays ?? 3),
      senderEmail: String(profile?.senderEmail ?? ENV.defaultSenderEmail),
      senderEmails:
        Array.isArray(profile?.senderEmails) && profile.senderEmails.length > 0
          ? profile.senderEmails.map(String)
          : [String(profile?.senderEmail ?? ENV.defaultSenderEmail)],
      industry: typeof profile?.industry === "string" ? profile.industry : undefined,
      location: typeof profile?.location === "string" ? profile.location : undefined,
      marketingEmail:
        profile?.marketingEmail &&
        typeof profile.marketingEmail === "object" &&
        typeof (profile.marketingEmail as any).subject === "string" &&
        typeof (profile.marketingEmail as any).body === "string"
          ? {
              subject: (profile.marketingEmail as any).subject,
              body: (profile.marketingEmail as any).body,
            }
          : undefined,
    };
  }

  private getStepInput(agentName: string, profile: ExecutionProfile): Record<string, unknown> {
    const agent = this.normalizeAgent(agentName);
    if (agent === "lead_generation") {
      return {
        campaignId: profile.campaignId,
        count: profile.leadCount,
        industry: profile.industry,
        location: profile.location,
      };
    }

    if (agent === "decision") {
      return {
        campaignId: profile.campaignId,
        topCount: profile.topCount,
      };
    }

    if (agent === "communication") {
      return {
        campaignId: profile.campaignId,
        senderEmail: profile.senderEmail,
        senderEmails: profile.senderEmails,
        followUpDays: profile.followUpDays,
        marketingEmail: profile.marketingEmail ?? null,
      };
    }

    if (agent === "reporting") {
      return {
        campaignIds: [profile.campaignId],
      };
    }

    return {
      campaignId: profile.campaignId,
      command: profile.command,
    };
  }

  private areDependenciesSatisfied(step: WorkflowStep, steps: WorkflowStep[]) {
    return step.dependencies.every((dependencyId) =>
      steps.some((candidate) => candidate.id === dependencyId && candidate.status === "completed")
    );
  }

  private async updateStepState(
    workflowId: number,
    steps: WorkflowStep[],
    stepId: string,
    updates: Partial<WorkflowStep>
  ) {
    const nextSteps = steps.map((step) =>
      step.id === stepId
        ? {
            ...step,
            ...updates,
          }
        : step
    );

    steps.splice(0, steps.length, ...nextSteps);
    await updateWorkflow(workflowId, this.userId, {
      steps: nextSteps as any,
      completedSteps: nextSteps.filter((step) => step.status === "completed").length,
    });
  }

  private async executeStep(step: WorkflowStep, profile: ExecutionProfile) {
    switch (this.normalizeAgent(step.agent)) {
      case "lead_generation": {
        const agent = new LeadGenerationAgent(this.userId);
        const leads = await agent.executeLeadGeneration({
          industry: profile.industry,
          location: profile.location,
          count: profile.leadCount,
          campaignId: profile.campaignId,
        });

        return {
          leadCount: leads.length,
          leadIds: leads.map((lead) => lead.id),
        };
      }
      case "decision": {
        const agent = new DecisionAgent(this.userId);
        const prospects = await agent.executeDecision({
          campaignId: profile.campaignId,
          topCount: profile.topCount,
        });

        return {
          qualifiedLeadIds: prospects.map((lead) => lead.id),
          topProspects: prospects.slice(0, 5),
        };
      }
      case "communication": {
        const agent = new CommunicationAgent(this.userId);
        const leads = await getLeadsByCampaignId(profile.campaignId, this.userId);
        const leadIds = leads
          .filter((lead) => lead.status === "qualified" || lead.status === "new" || lead.status === "contacted")
          .slice(0, profile.topCount)
          .map((lead) => lead.id);

        await agent.executeCommunication({
          leadIds,
          campaignId: profile.campaignId,
          senderEmail: profile.senderEmail,
          senderEmails: profile.senderEmails,
          followUpDays: profile.followUpDays,
          marketingEmail: profile.marketingEmail ?? undefined,
        });

        return {
          attemptedLeadCount: leadIds.length,
        };
      }
      case "reporting": {
        const agent = new ReportingAgent(this.userId);
        return agent.executeReporting({
          campaignIds: [profile.campaignId],
        });
      }
      case "execution":
      default:
        return {
          campaignId: profile.campaignId,
          status: "no_op",
          message: `Execution step acknowledged for ${step.name}`,
        };
    }
  }

  private extractFirstNumber(command: string, pattern: RegExp) {
    const match = command.match(pattern);
    const value = match?.[2] ?? match?.[1];
    return value ? Number.parseInt(value, 10) : undefined;
  }

  private extractIndustry(command: string) {
    console.log(`[MasterAgent] Parsing industry from command: "${command}"`);
    
    // Try multiple patterns to extract industry
    const patterns = [
      /for\s+([a-z\s]+?)(?:\s+in\s+[a-z\s,]+|,|\.|$)/i,
      /target\s+([a-z\s]+?)(?:\s+in\s+[a-z\s,]+|,|\.|$)/i,
      /find\s+([a-z\s]+?)(?:\s+in\s+[a-z\s,]+|,|\.|$)/i,
      /search\s+for\s+([a-z\s]+?)(?:\s+in\s+[a-z\s,]+|,|\.|$)/i,
      /(?:companies|businesses|leads?)\s+in\s+(?:the\s+)?([a-z\s]+?)(?:\s+industry|,|\.|$)/i,
      /^\s*([a-z\s]+?)\s+(?:websites?|companies|businesses|services?)\s*$/i,  // Direct: "restaurant websites"
      /(?:^|\s)([a-z\s]+?)\s+(?:websites?|companies|businesses|sector|industry)/i,  // "[industry] websites"
    ];
    
    for (const pattern of patterns) {
      const match = command.match(pattern);
      if (match?.[1]) {
        const industry = match[1].trim();
        console.log(`[MasterAgent] ✓ Extracted industry: "${industry}"`);
        return industry;
      }
    }
    console.log(`[MasterAgent] ⚠ Could not extract industry, using default`);
    return undefined;
  }

  private extractLocation(command: string) {
    // Extract cleaner location: stop at common delimiters to avoid parsing too much text
    const match = command.match(/in\s+([A-Za-z\s]+?)(?:\s+(?:that|which|and|or|to|for|with)|,|\.|$)/i);
    const location = match?.[1]?.trim();
    // Return only if it's a short location name (not the entire rest of command)
    return location && location.length < 50 ? location : undefined;
  }

  private extractMarketingEmail(command: string): { subject: string; body: string } | undefined {
    // Supports commands that include a block like:
    // Subject
    // <subject line>
    // <body...>
    // Normalize both real newlines and escaped ones (e.g. "\\n" coming from JSON-encoded strings).
    const normalized = command
      .replace(/\\r\\n/g, "\n")
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\n")
      .replace(/\r\n/g, "\n");
    const lines = normalized.split("\n").map((l) => l.trimEnd());

    const subjectIdx = lines.findIndex((l) => l.trim().toLowerCase() === "subject");
    if (subjectIdx < 0) return undefined;

    let i = subjectIdx + 1;
    while (i < lines.length && lines[i].trim() === "") i += 1;
    if (i >= lines.length) return undefined;

    const subject = lines[i].trim();
    if (!subject) return undefined;

    const bodyLines = lines.slice(i + 1);
    const body = bodyLines.join("\n").trim();
    if (!body) return undefined;

    return { subject, body };
  }

  private buildFallbackPlan(command: string): DecomposedCommand {
    const steps: WorkflowStep[] = [];

    steps.push({
      id: "step_1",
      name: "Generate leads",
      agent: "lead_generation",
      status: "pending",
      description: "Find and score leads that match the requested audience.",
      dependencies: [],
    });

    if (/(rank|score|top|best|qualif)/i.test(command)) {
      steps.push({
        id: "step_2",
        name: "Prioritize prospects",
        agent: "decision",
        status: "pending",
        description: "Rank leads and identify the highest-priority prospects.",
        dependencies: ["step_1"],
      });
    }

    if (/(email|outreach|contact|follow up|follow-up|send)/i.test(command)) {
      steps.push({
        id: `step_${steps.length + 1}`,
        name: "Run outreach",
        agent: "communication",
        status: "pending",
        description: "Generate personalized outreach and send messages to selected leads.",
        dependencies: [steps[steps.length - 1]?.id ?? "step_1"],
      });
    }

    if (/(report|dashboard|analytics|summary)/i.test(command)) {
      steps.push({
        id: `step_${steps.length + 1}`,
        name: "Generate report",
        agent: "reporting",
        status: "pending",
        description: "Compile workflow outcomes into a performance report.",
        dependencies: [steps[steps.length - 1]?.id ?? "step_1"],
      });
    }

    return {
      goal: `Execute business workflow: ${command}`,
      steps,
      estimatedDuration: `${Math.max(steps.length * 2, 5)} minutes`,
    };
  }
}
