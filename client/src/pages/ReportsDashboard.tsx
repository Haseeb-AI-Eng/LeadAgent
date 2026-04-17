import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Download, TrendingUp, Mail, MessageSquare, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function ReportsDashboard() {
  const [selectedCampaigns, setSelectedCampaigns] = useState<number[]>([]);

  const campaignsQuery = trpc.data.getCampaigns.useQuery();
  const reportQuery = trpc.reporting.generateReport.useQuery(
    { campaignIds: selectedCampaigns },
    { enabled: selectedCampaigns.length > 0 }
  );

  const campaigns = campaignsQuery.data?.campaigns || [];
  const report = reportQuery.data;

  const handleCampaignToggle = (campaignId: number) => {
    setSelectedCampaigns((prev) =>
      prev.includes(campaignId)
        ? prev.filter((id) => id !== campaignId)
        : [...prev, campaignId]
    );
  };

  const emailMetricsData = [
    { name: "Sent", value: report?.totalEmailsSent || 0, fill: "#3b82f6" },
    { name: "Opened", value: report?.totalEmailsOpened || 0, fill: "#10b981" },
    { name: "Replied", value: report?.totalEmailsReplied || 0, fill: "#f59e0b" },
    { name: "Meetings", value: report?.totalMeetingsBooked || 0, fill: "#8b5cf6" },
  ];

  const conversionData =
    report?.topCampaigns.map((campaign) => ({
      name: campaign.campaignName,
      rate: campaign.conversionRate,
    })) || [];

  const leadScoreData =
    report?.topCampaigns.map((campaign, index) => ({
      name: campaign.campaignName,
      value: campaign.totalLeads,
      fill: ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"][index % 5],
    })) || [];

  const StatCard = ({
    icon: Icon,
    label,
    value,
    unit,
  }: {
    icon: any;
    label: string;
    value: number;
    unit: string;
  }) => (
    <Card className="card-premium p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-2">
            {value.toLocaleString()}
            <span className="text-sm text-muted-foreground ml-1">{unit}</span>
          </p>
        </div>
        <Icon className="w-10 h-10 text-primary opacity-20" />
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gradient mb-2">Reports Dashboard</h1>
        <p className="text-muted-foreground">
          Comprehensive analytics and performance metrics for your campaigns
        </p>
      </div>

      {/* Campaign Selection */}
      <Card className="card-premium p-6">
        <h3 className="font-semibold mb-4">Select Campaigns</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground col-span-full">
              No campaigns available
            </p>
          ) : (
            campaigns.map((campaign: any) => (
              <button
                key={campaign.id}
                onClick={() => handleCampaignToggle(campaign.id)}
                className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                  selectedCampaigns.includes(campaign.id)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                {campaign.name}
              </button>
            ))
          )}
        </div>
      </Card>

      {report && selectedCampaigns.length > 0 ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Mail}
              label="Emails Sent"
              value={report.totalEmailsSent}
              unit="emails"
            />
            <StatCard
              icon={MessageSquare}
              label="Replies Received"
              value={report.totalEmailsReplied}
              unit="replies"
            />
            <StatCard
              icon={CheckCircle2}
              label="Meetings Booked"
              value={report.totalMeetingsBooked}
              unit="meetings"
            />
            <StatCard
              icon={TrendingUp}
              label="Conversion Rate"
              value={report.overallConversionRate}
              unit="%"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Email Metrics Bar Chart */}
            <Card className="card-premium p-6">
              <h3 className="font-semibold mb-4">Email Metrics</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={emailMetricsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {emailMetricsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Conversion Rate Trend */}
            <Card className="card-premium p-6">
              <h3 className="font-semibold mb-4">Top Campaign Conversion Rates</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={conversionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="rate" stroke="var(--primary)" strokeWidth={2} dot={{ fill: "var(--primary)", r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Lead Score Distribution */}
            <Card className="card-premium p-6">
              <h3 className="font-semibold mb-4">Lead Volume By Campaign</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={leadScoreData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {leadScoreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Performance Summary */}
            <Card className="card-premium p-6">
              <h3 className="font-semibold mb-4">Performance Summary</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Open Rate</span>
                    <span className="text-sm font-semibold">
                      {report.overallOpenRate.toFixed(2)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${Math.min(report.overallOpenRate, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Reply Rate</span>
                    <span className="text-sm font-semibold">
                      {report.overallReplyRate.toFixed(2)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${Math.min(report.overallReplyRate, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Conversion Rate</span>
                    <span className="text-sm font-semibold">
                      {report.overallConversionRate.toFixed(2)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${Math.min(report.overallConversionRate, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Insights */}
          {report.insights && report.insights.length > 0 && (
            <Card className="card-premium p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Key Insights</h3>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>
              <div className="space-y-2">
                {report.insights.map((insight: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 p-2 rounded hover:bg-muted">
                    <span className="text-primary mt-1">•</span>
                    <p className="text-sm">{insight}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      ) : (
        <Card className="card-premium p-12 text-center">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">
            Select campaigns to view detailed analytics and reports
          </p>
        </Card>
      )}
    </div>
  );
}
