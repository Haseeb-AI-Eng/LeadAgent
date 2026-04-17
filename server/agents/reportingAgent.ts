import { getCampaignById, getLeadsByCampaignId, getMessagesByUserId } from "../db";

interface CampaignMetrics {
  campaignId: number;
  campaignName: string;
  totalLeads: number;
  emailsSent: number;
  emailsOpened: number;
  emailsReplied: number;
  meetingsBooked: number;
  openRate: number;
  replyRate: number;
  conversionRate: number;
  averageLeadScore: number;
  topPerformingIndustries: string[];
  topPerformingLocations: string[];
}

interface AnalyticsReport {
  period: string;
  totalCampaigns: number;
  totalLeads: number;
  totalEmailsSent: number;
  totalEmailsOpened: number;
  totalEmailsReplied: number;
  totalMeetingsBooked: number;
  overallOpenRate: number;
  overallReplyRate: number;
  overallConversionRate: number;
  topCampaigns: CampaignMetrics[];
  insights: string[];
}

/**
 * Reporting Agent - Generates analytics and insights
 * Responsibilities:
 * - Calculate campaign metrics
 * - Generate reports
 * - Provide insights and recommendations
 * - Track KPIs
 */
export class ReportingAgent {
  private userId: number;

  constructor(userId: number) {
    this.userId = userId;
  }

  /**
   * Calculate metrics for a campaign
   */
  async calculateCampaignMetrics(
    campaignId: number
  ): Promise<CampaignMetrics> {
    const campaign = await getCampaignById(campaignId, this.userId);
    if (!campaign) throw new Error("Campaign not found");

    const leads = await getLeadsByCampaignId(campaignId, this.userId);
    const messages = (await getMessagesByUserId(this.userId)).filter(
      (message) => message.campaignId === campaignId
    );

    // Calculate average lead score
    const averageLeadScore =
      leads.length > 0
        ? leads.reduce((sum, lead) => sum + parseFloat(lead.score as any), 0) /
          leads.length
        : 0;

    // Get industry and location distributions
    const industries = leads.map((l) => l.industry).filter(Boolean);
    const locations = leads.map((l) => l.location).filter(Boolean);

    const topPerformingIndustries = Array.from(new Set(industries)).slice(0, 5) as string[];
    const topPerformingLocations = Array.from(new Set(locations)).slice(0, 5) as string[];

    const emailsSent = messages.filter((message) => message.messageType === "outgoing").length;
    const emailsOpened = messages.filter((message) => Boolean(message.openedAt)).length;
    const emailsReplied = messages.filter((message) => Boolean(message.repliedAt)).length;
    const meetingsBooked = leads.filter((lead) => lead.status === "converted").length;

    const openRate = emailsSent > 0 ? (emailsOpened / emailsSent) * 100 : 0;
    const replyRate = emailsSent > 0 ? (emailsReplied / emailsSent) * 100 : 0;
    const conversionRate = emailsSent > 0 ? (meetingsBooked / emailsSent) * 100 : 0;

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      totalLeads: leads.length,
      emailsSent,
      emailsOpened,
      emailsReplied,
      meetingsBooked,
      openRate: parseFloat(openRate.toFixed(2)),
      replyRate: parseFloat(replyRate.toFixed(2)),
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      averageLeadScore: parseFloat(averageLeadScore.toFixed(2)),
      topPerformingIndustries,
      topPerformingLocations,
    };
  }

  /**
   * Generate comprehensive analytics report
   */
  async generateAnalyticsReport(
    campaignIds: number[]
  ): Promise<AnalyticsReport> {
    console.log(
      `[ReportingAgent] Generating analytics report for ${campaignIds.length} campaigns...`
    );

    const campaignMetrics = await Promise.all(
      campaignIds.map((id) => this.calculateCampaignMetrics(id))
    );

    // Calculate overall metrics
    const totalLeads = campaignMetrics.reduce((sum, m) => sum + m.totalLeads, 0);
    const totalEmailsSent = campaignMetrics.reduce(
      (sum, m) => sum + m.emailsSent,
      0
    );
    const totalEmailsOpened = campaignMetrics.reduce(
      (sum, m) => sum + m.emailsOpened,
      0
    );
    const totalEmailsReplied = campaignMetrics.reduce(
      (sum, m) => sum + m.emailsReplied,
      0
    );
    const totalMeetingsBooked = campaignMetrics.reduce(
      (sum, m) => sum + m.meetingsBooked,
      0
    );

    const overallOpenRate =
      totalEmailsSent > 0
        ? parseFloat(((totalEmailsOpened / totalEmailsSent) * 100).toFixed(2))
        : 0;
    const overallReplyRate =
      totalEmailsSent > 0
        ? parseFloat(((totalEmailsReplied / totalEmailsSent) * 100).toFixed(2))
        : 0;
    const overallConversionRate =
      totalEmailsSent > 0
        ? parseFloat(((totalMeetingsBooked / totalEmailsSent) * 100).toFixed(2))
        : 0;

    // Get top campaigns
    const topCampaigns = campaignMetrics
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, 5);

    // Generate insights
    const insights = this.generateInsights(
      campaignMetrics,
      overallOpenRate,
      overallReplyRate,
      overallConversionRate
    );

    return {
      period: `${new Date().toISOString().split("T")[0]}`,
      totalCampaigns: campaignIds.length,
      totalLeads,
      totalEmailsSent,
      totalEmailsOpened,
      totalEmailsReplied,
      totalMeetingsBooked,
      overallOpenRate,
      overallReplyRate,
      overallConversionRate,
      topCampaigns,
      insights,
    };
  }

  /**
   * Generate actionable insights from metrics
   */
  private generateInsights(
    metrics: CampaignMetrics[],
    openRate: number,
    replyRate: number,
    conversionRate: number
  ): string[] {
    const insights: string[] = [];

    if (openRate > 30) {
      insights.push("✓ Email open rate is strong (>30%). Keep current subject lines.");
    } else if (openRate < 15) {
      insights.push("⚠ Email open rate is low (<15%). Consider improving subject lines.");
    }

    if (replyRate > 5) {
      insights.push("✓ Reply rate is excellent (>5%). Your messaging resonates well.");
    } else if (replyRate < 2) {
      insights.push("⚠ Reply rate is low (<2%). Consider personalizing emails more.");
    }

    if (conversionRate > 2) {
      insights.push("✓ Conversion rate is strong (>2%). Continue current strategy.");
    }

    if (metrics.length > 0) {
      const topCampaign = metrics.reduce((max, m) =>
        m.conversionRate > max.conversionRate ? m : max
      );
      insights.push(
        `📊 Top performing campaign: ${topCampaign.campaignName} (${topCampaign.conversionRate}% conversion)`
      );
    }

    if (metrics.length > 0) {
      const avgScore =
        metrics.reduce((sum, m) => sum + m.averageLeadScore, 0) / metrics.length;
      insights.push(`📈 Average lead quality score: ${avgScore.toFixed(2)}/1.0`);
    }

    return insights;
  }

  /**
   * Get trend analysis
   */
  async getTrendAnalysis(campaignId: number): Promise<{
    trend: "improving" | "declining" | "stable";
    changePercentage: number;
    recommendation: string;
  }> {
    // This would compare metrics over time
    // For now, return placeholder
    return {
      trend: "stable",
      changePercentage: 0,
      recommendation: "Continue monitoring performance metrics.",
    };
  }

  /**
   * Export report as JSON
   */
  async exportReport(report: AnalyticsReport): Promise<string> {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Execute reporting workflow
   */
  async executeReporting(params: {
    campaignIds: number[];
  }): Promise<AnalyticsReport> {
    console.log("[ReportingAgent] Starting reporting workflow...");

    const report = await this.generateAnalyticsReport(params.campaignIds);

    console.log("[ReportingAgent] Report generated successfully");

    return report;
  }
}
