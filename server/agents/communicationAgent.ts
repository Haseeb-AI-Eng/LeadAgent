import { invokeLLM } from "../_core/llm";
import { ENV } from "../_core/env";
import { createMessage, updateMessage, getLeadById, getMessageById, updateLead } from "../db";
import nodemailer from "nodemailer";

interface EmailTemplate {
  subject: string;
  body: string;
}

/**
 * Communication Agent - Handles all outreach communication
 * Responsibilities:
 * - Generate personalized emails
 * - Send emails to leads
 * - Track email metrics (open, reply rates)
 * - Schedule follow-ups
 * - Manage automated responses
 */
export class CommunicationAgent {
  private userId: number;

  constructor(userId: number) {
    this.userId = userId;
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    // Check for valid email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }

    // Block generic/admin emails that often get filtered
    const blockedPatterns = [
      /^admin@/i,
      /^noreply@/i,
      /^no-reply@/i,
      /^donotreply@/i,
      /^contact@generic/i,
    ];

    return !blockedPatterns.some(pattern => pattern.test(email));
  }

  /**
   * Generate personalized email for a lead
   */
  async generateEmail(lead: {
    companyName: string;
    contactName?: string;
    email: string;
    industry?: string;
  }): Promise<EmailTemplate> {
    const systemPrompt = `You are an expert email copywriter. Generate a professional, personalized outreach email.
    
The email should:
- Be engaging and relevant to the recipient's industry
- Include a clear call-to-action
- Be concise (under 150 words)
- Sound natural and not robotic

Return a JSON object with "subject" and "body" fields.`;

    const userPrompt = `Generate an outreach email for:
Company: ${lead.companyName}
Contact: ${lead.contactName || "Hiring Manager"}
Email: ${lead.email}
Industry: ${lead.industry || "General"}`;

    try {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_object",
        },
        maxTokens: 500, // Email generation only needs 300-500 tokens
      });

      const content = response.choices[0]?.message.content;
      if (!content) throw new Error("Failed to generate email");

      const contentStr = typeof content === "string" ? content : JSON.stringify(content);
      return JSON.parse(contentStr);
    } catch (error) {
      console.warn("[CommunicationAgent] Falling back to template email generation:", error);
      return {
        subject: `Collaboration Opportunity - Rdex Solutions`,
        body: `Hello Team,

Greetings from **Rdex Solutions**.

We are a software development company specializing in **AI-powered systems, mobile applications, Flutter solutions, and modern frontend development**.

We are currently expanding our collaboration network and are reaching out to organizations that may require technical development support for new or ongoing projects.

Our team focuses on delivering reliable, scalable, and business-oriented solutions that help companies automate workflows, improve performance, and enhance customer experiences.

We would be happy to schedule a short discussion to understand your technical needs and explore possible collaboration opportunities.

Looking forward to connecting with your team.

Best regards,
**Rdex Solutions**
🌐 https://rdexsolutions.com
📧 hr@rdexsolutions.com
📱 WhatsApp: +92 334 5135936`,
      };
    }
  }

  /**
   * Send email to a lead
   */
  async sendEmail(
    leadId: number,
    email: EmailTemplate,
    senderEmail: string,
    recipientEmail: string,
    campaignId?: number
  ): Promise<number> {
    console.log(`[CommunicationAgent] Sending email to ${recipientEmail}...`);

    try {
      // Create nodemailer transporter for webmail
      const transporter = nodemailer.createTransport({
        host: ENV.SMTP_HOST,
        port: parseInt(ENV.SMTP_PORT || "587"),
        secure: parseInt(ENV.SMTP_PORT || "587") === 465, // true for 465 (SSL), false for 587 (TLS)
        auth: {
          user: ENV.SMTP_USER,
          pass: ENV.SMTP_PASSWORD,
        },
      });

      // Send email
      const result = await transporter.sendMail({
        from: `${ENV.SMTP_FROM_NAME || "Rdex Solutions"} <${senderEmail}>`,
        to: recipientEmail,
        subject: email.subject,
        html: email.body,
        text: email.body.replace(/<[^>]*>/g, ""), // Plain text fallback
      });

      console.log(`[CommunicationAgent] Email sent successfully to ${recipientEmail} (Message ID: ${result.messageId})`);

      // Create message record in database
      const record = await createMessage(this.userId, {
        leadId,
        campaignId,
        messageType: "outgoing" as const,
        source: "email",
        senderEmail,
        recipientEmail,
        subject: email.subject,
        content: email.body,
        status: "sent" as const,
      });

      return record.id;
    } catch (error) {
      console.error(`[CommunicationAgent] Failed to send email to ${recipientEmail}:`, error);

      // Still create a failed record for tracking
      const record = await createMessage(this.userId, {
        leadId,
        campaignId,
        messageType: "outgoing" as const,
        source: "email",
        senderEmail,
        recipientEmail,
        subject: email.subject,
        content: email.body,
        status: "failed" as const,
      });

      throw error;
    }
  }

  /**
   * Track email open
   */
  async trackEmailOpen(messageId: number): Promise<void> {
    await updateMessage(messageId, this.userId, {
      status: "opened" as const,
      openedAt: new Date(),
    });

    console.log(`[CommunicationAgent] Email opened (ID: ${messageId})`);
  }

  /**
   * Track email reply
   */
  async trackEmailReply(
    messageId: number,
    replyContent: string
  ): Promise<void> {
    await updateMessage(messageId, this.userId, {
      status: "replied" as const,
      repliedAt: new Date(),
    });

    // Create a new message for the reply
    const originalMessage = await getMessageById(messageId, this.userId);
    if (originalMessage) {
      await createMessage(this.userId, {
        leadId: originalMessage.leadId || undefined,
        campaignId: originalMessage.campaignId || undefined,
        messageType: "incoming" as const,
        source: "email",
        senderEmail: originalMessage.recipientEmail || originalMessage.senderEmail,
        recipientEmail: originalMessage.senderEmail || undefined,
        subject: `Re: ${originalMessage.subject}`,
        content: replyContent,
        status: "delivered" as const,
      });
    }

    console.log(`[CommunicationAgent] Email reply tracked (ID: ${messageId})`);
  }

  /**
   * Schedule follow-up email
   */
  async scheduleFollowUp(
    leadId: number,
    daysDelay: number,
    campaignId?: number
  ): Promise<void> {
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + daysDelay);

    console.log(
      `[CommunicationAgent] Follow-up scheduled for ${followUpDate.toISOString()}`
    );

    // In a real implementation, this would create a scheduled task
    // For now, we just log it
  }

  async updateLeadStatusAfterSend(leadId: number): Promise<void> {
    const lead = await getLeadById(leadId, this.userId);
    if (lead) {
      await updateLead(leadId, this.userId, {
        status: "contacted" as const,
      });
    }
  }

  /**
   * Get email metrics for a campaign
   */
  async getEmailMetrics(campaignId: number): Promise<{
    totalSent: number;
    totalOpened: number;
    totalReplied: number;
    openRate: number;
    replyRate: number;
  }> {
    // This would query the database for actual metrics
    // For now, return placeholder data
    return {
      totalSent: 0,
      totalOpened: 0,
      totalReplied: 0,
      openRate: 0,
      replyRate: 0,
    };
  }

  /**
   * Execute full communication workflow
   */
  async executeCommunication(params: {
    leadIds: number[];
    campaignId?: number;
    senderEmail?: string;
    senderEmails?: string[];
    followUpDays?: number;
    marketingEmail?: {
      subject: string;
      body: string;
    } | null;
  }): Promise<void> {
    const senderEmails = Array.isArray(params.senderEmails)
      ? params.senderEmails.filter(Boolean)
      : params.senderEmail
      ? [params.senderEmail]
      : [];

    console.log(
      `[CommunicationAgent] Starting communication for ${params.leadIds.length} leads using ${senderEmails.length} sender(s)...`
    );

    // Add delay between emails to avoid spam filters
    const delayBetweenEmails = 3000; // 3 seconds between each email
    let emailIndex = 0;

    for (const leadId of params.leadIds) {
      try {
        const lead = await getLeadById(leadId, this.userId);
        if (!lead || !lead.email) {
          console.warn(
            `[CommunicationAgent] Skipping lead ${leadId} because lead data is missing or email is not available.`
          );
          continue;
        }

        // Validate email before sending
        if (!this.isValidEmail(lead.email)) {
          console.warn(
            `[CommunicationAgent] Skipping lead ${leadId} - invalid email format: ${lead.email}`
          );
          continue;
        }

        const emailTemplate =
          params.marketingEmail ??
          (await this.generateEmail({
            companyName: lead.companyName,
            contactName: lead.contactName || "Hiring Manager",
            email: lead.email,
            industry: lead.industry || "General",
          }));

        const sendersToUse = senderEmails.length > 0 ? senderEmails : [ENV.defaultSenderEmail];

        for (const senderEmail of sendersToUse) {
          // Add delay before sending to avoid spam filters (except for first email)
          if (emailIndex > 0) {
            console.log(`[CommunicationAgent] Waiting ${delayBetweenEmails}ms before next send...`);
            await new Promise(resolve => setTimeout(resolve, delayBetweenEmails));
          }
          emailIndex++;

          await this.sendEmail(
            leadId,
            emailTemplate,
            senderEmail,
            lead.email,
            params.campaignId
          );
        }

        await this.updateLeadStatusAfterSend(leadId);
        await this.scheduleFollowUp(leadId, params.followUpDays ?? 3, params.campaignId);
      } catch (error) {
        console.error(
          `[CommunicationAgent] Failed to send email to lead ${leadId}:`,
          error
        );
      }
    }

    console.log("[CommunicationAgent] Communication workflow completed");
  }
}
