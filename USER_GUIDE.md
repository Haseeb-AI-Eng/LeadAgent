# ABOA - User Guide

## Getting Started

### 1. Access the Dashboard

Navigate to your ABOA instance and sign in with your credentials. You'll be redirected to the home page which showcases the platform's capabilities.

Click **"Open Dashboard"** or **"Launch Command Center"** to access the main application.

---

## Dashboard Overview

ABOA features three main screens accessible via the sidebar navigation:

### 1. **Command Center**
The command center is where you orchestrate complex business workflows using natural language.

**Features:**
- **Command Input**: Type natural language commands describing your business goals
- **Decompose**: Click "Decompose" to see how the system breaks down your command into steps
- **Execute**: Click "Execute" to run the workflow
- **Quick Commands**: Pre-built templates for common tasks
- **Command History**: Access your recent commands

**Example Commands:**
- "Find 100 restaurants in New York and send marketing emails"
- "Generate leads in the tech industry and score them by conversion probability"
- "Send follow-up emails to prospects who haven't replied"

---

### 2. **Workflow Monitor**
Monitor real-time execution of your workflows with detailed step-by-step progress.

**Features:**
- **Workflow Selection**: Choose from active workflows to monitor
- **Progress Bar**: Visual representation of overall workflow completion
- **Step Timeline**: See each agent step with its current status
- **Status Indicators**:
  - ✓ Completed (green)
  - ⟳ Running (blue, animated)
  - ⏱ Pending (gray)
  - ✕ Failed (red)

**Workflow Statuses:**
- **Pending**: Waiting to start
- **Running**: Currently executing
- **Completed**: Finished successfully
- **Failed**: Encountered an error

---

### 3. **Reports Dashboard**
View comprehensive analytics and performance metrics for your campaigns.

**Features:**
- **Campaign Selection**: Choose campaigns to analyze
- **Key Metrics**: Email sent, replies, meetings booked, conversion rate
- **Charts**:
  - Email Metrics (bar chart)
  - Conversion Rate Trend (line chart)
  - Lead Score Distribution (pie chart)
  - Performance Summary (progress bars)
- **Insights**: AI-generated recommendations based on your data

**Metrics Explained:**
- **Open Rate**: Percentage of emails opened by recipients
- **Reply Rate**: Percentage of emails that received replies
- **Conversion Rate**: Percentage of emails that resulted in meetings booked
- **Lead Score**: Quality rating of leads (0-1 scale)

---

## Agents Explained

ABOA uses six specialized AI agents working together:

### **Master Agent**
Orchestrates all other agents and manages workflow execution. It:
- Analyzes natural language commands
- Breaks them into actionable steps
- Coordinates agent execution
- Tracks workflow progress

### **Lead Generation Agent**
Finds and scores potential leads. It:
- Searches for prospects matching your criteria
- Extracts company and contact information
- Assigns quality scores (0-1)
- Stores leads in the database

### **Communication Agent**
Handles all outreach communication. It:
- Generates personalized emails
- Sends emails to leads
- Tracks open and reply rates
- Schedules follow-ups

### **Decision Agent**
Makes intelligent business decisions. It:
- Ranks leads by conversion probability
- Filters top prospects
- Optimizes outreach strategy
- Provides recommendations

### **Reporting Agent**
Generates analytics and insights. It:
- Calculates campaign metrics
- Creates performance reports
- Identifies trends
- Provides actionable insights

### **Email Routing Agent**
Classifies and routes messages intelligently. It:
- Analyzes incoming messages
- Classifies by topic (AI/ML, Mobile, UI/UX, General)
- Routes to appropriate team members
- Tracks routing history

---

## Email Routing

The Email Routing Agent automatically classifies incoming messages and forwards them to the right person:

| Classification | Target Email | Keywords |
|---|---|---|
| **AI/ML** | haseeb.ejaz@rdexsolutions.com | AI, machine learning, deep learning, algorithms, LLM, NLP |
| **Mobile** | ahsan.dev@rdexsolutions.com | Mobile, iOS, Android, Flutter, React Native |
| **UI/UX** | rayan.adam@rdexsolutions.com | UI, UX, design, frontend, React, Vue, CSS |
| **General** | sales@rdexsolutions.com | All other inquiries |

---

## Workflow Examples

### Example 1: Lead Generation Campaign

**Command:**
"Find 50 SaaS companies in San Francisco and score them"

**Workflow Steps:**
1. Lead Generation Agent searches for SaaS companies
2. Extracts company information (name, email, industry, location)
3. Scores each lead based on quality indicators
4. Stores leads in database
5. Reporting Agent generates summary

**Result:** 50 qualified leads ready for outreach

---

### Example 2: Email Campaign

**Command:**
"Send personalized emails to top 100 leads and track responses"

**Workflow Steps:**
1. Decision Agent filters top 100 leads
2. Communication Agent generates personalized emails
3. Sends emails to all leads
4. Tracks opens and replies
5. Schedules follow-ups for non-responders
6. Reporting Agent generates campaign metrics

**Result:** Email campaign launched with tracking enabled

---

### Example 3: Lead Qualification

**Command:**
"Rank all leads by conversion probability and show top 50"

**Workflow Steps:**
1. Lead Generation Agent retrieves all leads
2. Decision Agent analyzes each lead
3. Calculates conversion probability
4. Ranks by probability
5. Filters top 50
6. Reporting Agent generates qualification report

**Result:** Top 50 prospects ready for sales team

---

## Tips & Best Practices

### Command Tips
- **Be Specific**: Include target industry, location, and desired outcomes
- **Use Numbers**: Specify exact quantities (e.g., "50 leads", "100 emails")
- **Include Context**: Mention campaign goals or target audience
- **Chain Operations**: Combine multiple operations in one command

### Workflow Tips
- **Monitor Progress**: Check Workflow Monitor for real-time updates
- **Review Insights**: Read AI-generated insights in Reports Dashboard
- **Iterate**: Use results to refine future commands
- **Schedule Regularly**: Set up recurring campaigns for consistent results

### Email Tips
- **Personalization**: System generates personalized emails for each lead
- **Follow-ups**: Automatic follow-up scheduling after 3 days
- **Tracking**: Monitor open and reply rates in Reports Dashboard
- **Optimization**: Adjust messaging based on performance metrics

---

## Troubleshooting

### Workflow Stuck on "Running"
- Check Workflow Monitor for specific step status
- Verify all required data is available
- Refresh the page to get latest status
- Contact support if issue persists

### No Leads Generated
- Verify search criteria are specific enough
- Check industry and location filters
- Try broadening search parameters
- Ensure database has sufficient data

### Emails Not Sending
- Verify sender email is valid
- Check lead email addresses are correct
- Ensure campaign has active leads
- Review Communication Agent logs

### Low Conversion Rates
- Review email content and subject lines
- Check lead quality scores
- Analyze reply patterns in Reports Dashboard
- Adjust targeting criteria based on insights

---

## Account Settings

### User Profile
- View your account information
- Update profile details
- Manage email preferences

### Email Routing Configuration
- View current routing rules
- Add custom routing rules
- Update team member emails
- Test routing with sample messages

### Integrations
- Connect external data sources
- Configure API keys
- Set up webhooks (future)

---

## Support & Help

For questions or issues:
1. Check this User Guide
2. Review API Documentation
3. Check Workflow Monitor for error messages
4. Contact your system administrator

---

## Advanced Features

### Custom Routing Rules
Create custom rules for message classification and routing based on keywords, sender domain, or content patterns.

### Workflow Templates
Save frequently used commands as templates for quick access.

### Batch Operations
Process multiple leads or campaigns simultaneously for efficiency.

### Scheduled Workflows
Schedule workflows to run at specific times or intervals.

---

## Security & Privacy

- All data is encrypted in transit and at rest
- Authentication via Manus OAuth
- Role-based access control (User/Admin)
- Audit logs for all operations
- GDPR compliant data handling

---

## Performance Metrics

ABOA tracks these key metrics:

- **Lead Quality Score**: 0-1 rating of lead fit
- **Email Open Rate**: % of emails opened
- **Reply Rate**: % of emails with replies
- **Conversion Rate**: % of emails resulting in meetings
- **Campaign ROI**: Return on investment per campaign
- **Agent Efficiency**: Time and resources used per task

---

## Frequently Asked Questions

**Q: How long does a workflow take?**
A: Depends on the workflow complexity. Simple lead generation: 2-5 minutes. Complex campaigns: 10-30 minutes.

**Q: Can I stop a running workflow?**
A: Currently workflows run to completion. Support for cancellation coming soon.

**Q: How many leads can I generate?**
A: Up to 1,000 leads per command. For larger volumes, split into multiple commands.

**Q: Can I export reports?**
A: Yes, Reports Dashboard includes an Export button for PDF/CSV formats.

**Q: How is lead scoring calculated?**
A: Based on industry relevance, email domain quality, company size, and location desirability.

**Q: What happens to my data?**
A: All data is stored securely in your database and never shared with third parties.
