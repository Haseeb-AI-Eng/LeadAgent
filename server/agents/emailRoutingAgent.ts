import { invokeLLM } from "../_core/llm";
import { createMessage, getEmailRoutingConfigByUserId, updateMessage } from "../db";

type ClassificationType = "ai_ml" | "mobile" | "ui_ux" | "general";

interface ClassificationResult {
  classification: ClassificationType;
  confidence: number;
  keywords: string[];
  reasoning: string;
}

interface RoutingRule {
  classification: ClassificationType;
  targetEmail: string;
  keywords: string[];
}

/**
 * Email Routing Agent - Classifies incoming messages and routes them intelligently
 * Responsibilities:
 * - Classify incoming messages by audience type
 * - Route messages to appropriate team members
 * - Track routing history
 * - Manage routing rules
 */
export class EmailRoutingAgent {
  private userId: number;

  // Default routing configuration
  private defaultRoutingRules: RoutingRule[] = [
    {
      classification: "ai_ml",
      targetEmail: "haseeb.ejaz@rdexsolutions.com",
      keywords: ["AI", "ML", "machine learning", "deep learning", "neural", "LLM", "GPT", "algorithm", "data science", "NLP"],
    },
    {
      classification: "mobile",
      targetEmail: "ahsan.dev@rdexsolutions.com",
      keywords: ["mobile", "iOS", "Android", "app", "flutter", "react native", "swift", "kotlin", "mobile development"],
    },
    {
      classification: "ui_ux",
      targetEmail: "rayan.adam@rdexsolutions.com",
      keywords: ["UI", "UX", "design", "frontend", "React", "Vue", "Angular", "CSS", "JavaScript", "web development", "interface"],
    },
    {
      classification: "general",
      targetEmail: "sales@rdexsolutions.com",
      keywords: [],
    },
  ];

  constructor(userId: number) {
    this.userId = userId;
  }

  /**
   * Classify an incoming message using LLM
   */
  async classifyMessage(content: string, subject?: string): Promise<ClassificationResult> {
    const systemPrompt = `You are an expert message classifier. Analyze the incoming message and classify it into one of these categories:
- ai_ml: Questions about AI, machine learning, deep learning, algorithms, data science
- mobile: Questions about mobile app development (iOS, Android, Flutter, React Native, etc.)
- ui_ux: Questions about UI/UX design, frontend development, web design
- general: General inquiries that don't fit other categories

Return a JSON object with:
- classification: one of the categories above
- confidence: 0-1 confidence score
- keywords: array of keywords found in the message
- reasoning: brief explanation of why this classification was chosen`;

    const userPrompt = `Classify this message:
${subject ? `Subject: ${subject}\n` : ""}
Content: ${content}`;

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

      const content_response = response.choices[0]?.message.content;
      if (!content_response) throw new Error("Failed to classify message");

      const contentStr = typeof content_response === "string" ? content_response : JSON.stringify(content_response);
      return JSON.parse(contentStr);
    } catch (error) {
      console.warn("[EmailRoutingAgent] Falling back to keyword routing:", error);
      const haystack = `${subject || ""} ${content}`.toLowerCase();
      const matchedRule =
        this.defaultRoutingRules.find(
          (rule) =>
            rule.classification !== "general" &&
            rule.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()))
        ) || this.defaultRoutingRules.find((rule) => rule.classification === "general")!;

      return {
        classification: matchedRule.classification,
        confidence: 0.72,
        keywords: matchedRule.keywords.filter((keyword) => haystack.includes(keyword.toLowerCase())),
        reasoning: "Used local keyword matching because the LLM service was unavailable.",
      };
    }
  }

  /**
   * Get routing rules for the user
   */
  async getRoutingRules(): Promise<RoutingRule[]> {
    const configs = await getEmailRoutingConfigByUserId(this.userId);

    if (configs.length === 0) {
      // Return default rules
      return this.defaultRoutingRules;
    }

    return configs.map((config) => ({
      classification: config.classification as ClassificationType,
      targetEmail: config.targetEmail,
      keywords: (config.keywords as any) || [],
    }));
  }

  /**
   * Get target email for a classification
   */
  async getTargetEmail(classification: ClassificationType): Promise<string> {
    const rules = await this.getRoutingRules();
    const rule = rules.find((r) => r.classification === classification);
    return rule?.targetEmail || "sales@rdexsolutions.com";
  }

  /**
   * Route an incoming message
   */
  async routeMessage(
    senderEmail: string,
    subject: string,
    content: string,
    leadId?: number,
    campaignId?: number
  ): Promise<{
    messageId: number;
    classification: ClassificationType;
    routedTo: string;
    confidence: number;
  }> {
    console.log(`[EmailRoutingAgent] Processing message from ${senderEmail}...`);

    // Classify the message
    const classification = await this.classifyMessage(content, subject);

    // Get target email
    const targetEmail = await this.getTargetEmail(classification.classification);

    // Create message record
    const record = await createMessage(this.userId, {
      messageType: "incoming" as const,
      source: "email",
      senderEmail,
      recipientEmail: targetEmail,
      subject,
      content,
      classification: classification.classification,
      routedTo: targetEmail,
      status: "delivered" as const,
      metadata: {
        confidence: classification.confidence,
        keywords: classification.keywords,
        reasoning: classification.reasoning,
      } as any,
      leadId,
      campaignId,
    });
    const messageId = record.id;

    console.log(
      `[EmailRoutingAgent] Message routed to ${targetEmail} (Classification: ${classification.classification}, Confidence: ${classification.confidence})`
    );

    return {
      messageId,
      classification: classification.classification,
      routedTo: targetEmail,
      confidence: classification.confidence,
    };
  }

  /**
   * Batch route multiple messages
   */
  async batchRouteMessages(
    messages: Array<{
      senderEmail: string;
      subject: string;
      content: string;
      leadId?: number;
      campaignId?: number;
    }>
  ): Promise<
    Array<{
      messageId: number;
      classification: ClassificationType;
      routedTo: string;
      confidence: number;
    }>
  > {
    console.log(
      `[EmailRoutingAgent] Batch routing ${messages.length} messages...`
    );

    const results = await Promise.all(
      messages.map((msg) =>
        this.routeMessage(
          msg.senderEmail,
          msg.subject,
          msg.content,
          msg.leadId,
          msg.campaignId
        )
      )
    );

    console.log(`[EmailRoutingAgent] Batch routing completed`);

    return results;
  }

  /**
   * Get routing statistics
   */
  async getRoutingStatistics(): Promise<{
    totalMessagesRouted: number;
    routingByClassification: Record<ClassificationType, number>;
    averageConfidence: number;
  }> {
    // This would query the database for actual statistics
    // For now, return placeholder
    return {
      totalMessagesRouted: 0,
      routingByClassification: {
        ai_ml: 0,
        mobile: 0,
        ui_ux: 0,
        general: 0,
      },
      averageConfidence: 0,
    };
  }

  /**
   * Execute email routing workflow
   */
  async executeRouting(params: {
    messages: Array<{
      senderEmail: string;
      subject: string;
      content: string;
      leadId?: number;
      campaignId?: number;
    }>;
  }): Promise<
    Array<{
      messageId: number;
      classification: ClassificationType;
      routedTo: string;
      confidence: number;
    }>
  > {
    console.log("[EmailRoutingAgent] Starting email routing workflow...");

    const results = await this.batchRouteMessages(params.messages);

    console.log("[EmailRoutingAgent] Email routing workflow completed");

    return results;
  }
}
