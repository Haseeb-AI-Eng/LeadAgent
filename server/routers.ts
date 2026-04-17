import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { MasterAgent } from "./agents/masterAgent";
import { LeadGenerationAgent } from "./agents/leadGenerationAgent";
import { CommunicationAgent } from "./agents/communicationAgent";
import { DecisionAgent } from "./agents/decisionAgent";
import { ReportingAgent } from "./agents/reportingAgent";
import { EmailRoutingAgent } from "./agents/emailRoutingAgent";
import {
  getWorkflowsByUserId,
  getCampaignsByUserId,
  getLeadsByUserId,
  getMessagesByUserId,
  getEmailRoutingConfigByUserId,
  deleteAllLeadsByUserId,
  deleteAllMessagesByUserId,
  deleteAllCampaignsByUserId,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============ MASTER AGENT ROUTES ============
  masterAgent: router({
    decomposeCommand: protectedProcedure
      .input(z.object({ command: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const agent = new MasterAgent(ctx.user.id);
        const decomposed = await agent.decomposeCommand(input.command);
        return decomposed;
      }),

    createWorkflow: protectedProcedure
      .input(z.object({ command: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const agent = new MasterAgent(ctx.user.id);
        const workflowId = await agent.createWorkflowFromCommand(input.command);
        return { workflowId };
      }),

    createAndExecuteWorkflow: protectedProcedure
      .input(z.object({ command: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const agent = new MasterAgent(ctx.user.id);
        const workflowId = await agent.createWorkflowFromCommand(input.command);
        await agent.executeWorkflow(workflowId);
        return { workflowId, success: true };
      }),

    executeWorkflow: protectedProcedure
      .input(z.object({ workflowId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const agent = new MasterAgent(ctx.user.id);
        await agent.executeWorkflow(input.workflowId);
        return { success: true };
      }),

    monitorWorkflow: protectedProcedure
      .input(z.object({ workflowId: z.number() }))
      .query(async ({ input, ctx }) => {
        const agent = new MasterAgent(ctx.user.id);
        const status = await agent.monitorWorkflow(input.workflowId);
        return status;
      }),
  }),

  // ============ LEAD GENERATION ROUTES ============
  leadGeneration: router({
    generateLeads: protectedProcedure
      .input(
        z.object({
          industry: z.string().optional(),
          location: z.string().optional(),
          count: z.number().min(1).max(1000),
          campaignId: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const agent = new LeadGenerationAgent(ctx.user.id);
        const leads = await agent.executeLeadGeneration({
          industry: input.industry,
          location: input.location,
          count: input.count,
          campaignId: input.campaignId,
        });
        return { leads };
      }),
  }),

  // ============ COMMUNICATION ROUTES ============
  communication: router({
    sendEmails: protectedProcedure
      .input(
        z
          .object({
            leadIds: z.array(z.number()),
            campaignId: z.number().optional(),
            senderEmail: z.string().email().optional(),
            senderEmails: z.array(z.string().email()).optional(),
          })
          .refine(
            (data) =>
              (Array.isArray(data.senderEmails) && data.senderEmails.length > 0) ||
              typeof data.senderEmail === "string",
            {
              message: "Provide senderEmail or senderEmails",
            }
          )
      )
      .mutation(async ({ input, ctx }) => {
        const agent = new CommunicationAgent(ctx.user.id);
        await agent.executeCommunication({
          leadIds: input.leadIds,
          campaignId: input.campaignId,
          senderEmail: input.senderEmail,
          senderEmails: input.senderEmails,
        });
        return { success: true };
      }),
  }),

  // ============ DECISION ROUTES ============
  decision: router({
    filterTopProspects: protectedProcedure
      .input(z.object({ campaignId: z.number(), topCount: z.number().optional() }))
      .mutation(async ({ input, ctx }) => {
        const agent = new DecisionAgent(ctx.user.id);
        const prospects = await agent.executeDecision({
          campaignId: input.campaignId,
          topCount: input.topCount || 50,
        });
        return { prospects };
      }),
  }),

  // ============ REPORTING ROUTES ============
  reporting: router({
    generateReport: protectedProcedure
      .input(z.object({ campaignIds: z.array(z.number()) }))
      .query(async ({ input, ctx }) => {
        const agent = new ReportingAgent(ctx.user.id);
        const report = await agent.executeReporting({
          campaignIds: input.campaignIds,
        });
        return report;
      }),
  }),

  // ============ EMAIL ROUTING ROUTES ============
  emailRouting: router({
    classifyMessage: protectedProcedure
      .input(z.object({ content: z.string(), subject: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const agent = new EmailRoutingAgent(ctx.user.id);
        const classification = await agent.classifyMessage(input.content, input.subject);
        return classification;
      }),

    routeMessage: protectedProcedure
      .input(
        z.object({
          senderEmail: z.string().email(),
          subject: z.string(),
          content: z.string(),
          leadId: z.number().optional(),
          campaignId: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const agent = new EmailRoutingAgent(ctx.user.id);
        const result = await agent.routeMessage(
          input.senderEmail,
          input.subject,
          input.content,
          input.leadId,
          input.campaignId
        );
        return result;
      }),

    batchRouteMessages: protectedProcedure
      .input(
        z.object({
          messages: z.array(
            z.object({
              senderEmail: z.string().email(),
              subject: z.string(),
              content: z.string(),
              leadId: z.number().optional(),
              campaignId: z.number().optional(),
            })
          ),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const agent = new EmailRoutingAgent(ctx.user.id);
        const results = await agent.executeRouting({ messages: input.messages });
        return { results };
      }),

    getRoutingRules: protectedProcedure.query(async ({ ctx }) => {
      const agent = new EmailRoutingAgent(ctx.user.id);
      const rules = await agent.getRoutingRules();
      return { rules };
    }),
  }),

  // ============ DATA RETRIEVAL ROUTES ============
  data: router({
    getWorkflows: protectedProcedure.query(async ({ ctx }) => {
      const workflows = await getWorkflowsByUserId(ctx.user.id);
      return { workflows };
    }),

    getCampaigns: protectedProcedure.query(async ({ ctx }) => {
      const campaigns = await getCampaignsByUserId(ctx.user.id);
      return { campaigns };
    }),

    getLeads: protectedProcedure.query(async ({ ctx }) => {
      const leads = await getLeadsByUserId(ctx.user.id);
      return { leads };
    }),

    getMessages: protectedProcedure.query(async ({ ctx }) => {
      const messages = await getMessagesByUserId(ctx.user.id);
      return { messages };
    }),

    getEmailRoutingConfig: protectedProcedure.query(async ({ ctx }) => {
      const config = await getEmailRoutingConfigByUserId(ctx.user.id);
      return { config };
    }),

    clearAllData: protectedProcedure.mutation(async ({ ctx }) => {
      const leadsDeleted = await deleteAllLeadsByUserId(ctx.user.id);
      const messagesDeleted = await deleteAllMessagesByUserId(ctx.user.id);
      const campaignsDeleted = await deleteAllCampaignsByUserId(ctx.user.id);
      console.log(`[DataRouter] Cleared ${leadsDeleted} leads, ${messagesDeleted} messages, ${campaignsDeleted} campaigns for user ${ctx.user.id}`);
      return { success: true, leadsDeleted, messagesDeleted, campaignsDeleted };
    }),
  }),
});

export type AppRouter = typeof appRouter;
