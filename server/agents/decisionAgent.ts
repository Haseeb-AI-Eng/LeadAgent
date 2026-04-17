import { invokeLLM } from "../_core/llm";
import { getLeadsByCampaignId, updateLead } from "../db";

interface RankedLead {
  id: number;
  companyName: string;
  email: string;
  score: number;
  conversionProbability: number;
  recommendation: string;
}

/**
 * Decision Agent - Makes intelligent business decisions
 * Responsibilities:
 * - Rank leads by conversion probability
 * - Filter high-value prospects
 * - Optimize outreach strategy
 * - Recommend next actions
 */
export class DecisionAgent {
  private userId: number;

  constructor(userId: number) {
    this.userId = userId;
  }

  /**
   * Analyze lead and predict conversion probability
   */
  async analyzeLeadConversionProbability(lead: {
    companyName: string;
    email: string;
    industry: string;
    location: string;
    score: number;
  }): Promise<{
    probability: number;
    factors: string[];
    recommendation: string;
  }> {
    const systemPrompt = `You are a sales intelligence expert. Analyze a lead and predict conversion probability.
    
Consider:
- Industry trends
- Company size indicators
- Email domain quality
- Geographic location
- Lead score

Return a JSON object with "probability" (0-1), "factors" (array of reasons), and "recommendation" (action to take).`;

    const userPrompt = `Analyze this lead:
Company: ${lead.companyName}
Email: ${lead.email}
Industry: ${lead.industry}
Location: ${lead.location}
Current Score: ${lead.score}`;

    try {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_object",
        },
      });

      const content = response.choices[0]?.message.content;
      if (!content) throw new Error("Failed to analyze lead");

      const contentStr = typeof content === "string" ? content : JSON.stringify(content);
      return JSON.parse(contentStr);
    } catch (error) {
      console.warn("[DecisionAgent] Falling back to heuristic lead analysis:", error);
      const probability = Math.max(0, Math.min(1, Number((lead.score * 0.7 + 0.2).toFixed(2))));
      return {
        probability,
        factors: [
          `Existing lead score is ${lead.score.toFixed(2)}`,
          `Industry: ${lead.industry}`,
          `Location: ${lead.location}`,
        ],
        recommendation:
          probability >= 0.75 ? "Prioritize for immediate outreach." : "Keep in nurture sequence.",
      };
    }
  }

  /**
   * Rank leads by conversion probability
   */
  async rankLeads(leads: any[]): Promise<RankedLead[]> {
    const rankedLeads: RankedLead[] = [];

    for (const lead of leads) {
      const analysis = await this.analyzeLeadConversionProbability({
        companyName: lead.companyName,
        email: lead.email,
        industry: lead.industry || "Unknown",
        location: lead.location || "Unknown",
        score: parseFloat(lead.score) || 0,
      });

      rankedLeads.push({
        id: lead.id,
        companyName: lead.companyName,
        email: lead.email,
        score: parseFloat(lead.score) || 0,
        conversionProbability: analysis.probability,
        recommendation: analysis.recommendation,
      });
    }

    // Sort by conversion probability
    rankedLeads.sort((a, b) => b.conversionProbability - a.conversionProbability);

    return rankedLeads;
  }

  /**
   * Filter top prospects from a pool
   */
  async filterTopProspects(
    campaignId: number,
    topCount: number = 50
  ): Promise<RankedLead[]> {
    console.log(
      `[DecisionAgent] Filtering top ${topCount} prospects from campaign ${campaignId}...`
    );

    // Get all leads for the campaign
    const allLeads = await getLeadsByCampaignId(campaignId, this.userId);

    // Rank leads
    const rankedLeads = await this.rankLeads(allLeads);

    // Take top N
    const topProspects = rankedLeads.slice(0, topCount);

    // Update lead status
    for (const lead of topProspects) {
      await updateLead(lead.id, this.userId, {
        status: "qualified" as const,
      });
    }

    console.log(
      `[DecisionAgent] Filtered ${topProspects.length} top prospects`
    );

    return topProspects;
  }

  /**
   * Optimize outreach strategy based on lead characteristics
   */
  async optimizeOutreachStrategy(leads: any[]): Promise<{
    strategy: string;
    channels: string[];
    timing: string;
    messaging: string;
  }> {
    const systemPrompt = `You are a sales strategy expert. Based on lead characteristics, recommend an optimized outreach strategy.
    
Return a JSON object with "strategy", "channels" (array), "timing", and "messaging".`;

    const userPrompt = `Optimize outreach for these leads:
${leads.map((l) => `- ${l.companyName} (${l.industry})`).join("\n")}`;

    try {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_object",
        },
      });

      const content = response.choices[0]?.message.content;
      if (!content) throw new Error("Failed to optimize strategy");

      const contentStr = typeof content === "string" ? content : JSON.stringify(content);
      return JSON.parse(contentStr);
    } catch (error) {
      console.warn("[DecisionAgent] Falling back to static outreach strategy:", error);
      return {
        strategy: "Prioritize highest-score leads first and use a short email sequence with a timed follow-up.",
        channels: ["email"],
        timing: "Send during weekday business hours and follow up after 3 days.",
        messaging: `Lead with a simple value proposition tailored to ${leads[0]?.industry || "the target market"}.`,
      };
    }
  }

  /**
   * Execute decision-making workflow
   */
  async executeDecision(params: {
    campaignId: number;
    topCount?: number;
  }): Promise<RankedLead[]> {
    console.log(
      `[DecisionAgent] Starting decision workflow for campaign ${params.campaignId}...`
    );

    // Filter top prospects
    const topProspects = await this.filterTopProspects(
      params.campaignId,
      params.topCount || 50
    );

    // Get all leads to optimize strategy
    const allLeads = await getLeadsByCampaignId(params.campaignId, this.userId);
    if (allLeads.length > 0) {
      const strategy = await this.optimizeOutreachStrategy(allLeads);
      console.log("[DecisionAgent] Optimized strategy:", strategy);
    }

    console.log("[DecisionAgent] Decision workflow completed");

    return topProspects;
  }
}
