import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

type LeadRecord = {
  id: number;
  campaignId?: number | null;
  companyName: string;
  email: string;
  industry?: string | null;
  location?: string | null;
  score: number;
  status: string;
  contactName?: string | null;
  phone?: string | null;
  website?: string | null;
  createdAt: string | Date;
};

export default function LeadsPage() {
  const queryParams =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const campaignId = Number(queryParams?.get("campaignId") || "");
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);

  const leadsQuery = trpc.data.getLeads.useQuery();
  const messagesQuery = trpc.data.getMessages.useQuery();
  const clearDataMutation = trpc.data.clearAllData.useMutation({
    onSuccess: () => {
      leadsQuery.refetch();
      messagesQuery.refetch();
    },
  });

  const leads = useMemo(() => {
    const allLeads = (leadsQuery.data?.leads || []) as unknown as LeadRecord[];
    if (!Number.isFinite(campaignId)) {
      return allLeads;
    }
    return allLeads.filter((lead) => lead.campaignId === campaignId);
  }, [campaignId, leadsQuery.data?.leads]);

  const leadMessages = useMemo(() => {
    if (!selectedLead) {
      return [];
    }
    return (messagesQuery.data?.messages || []).filter(
      (message: any) => message.leadId === selectedLead.id
    );
  }, [messagesQuery.data?.messages, selectedLead]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient mb-2">Leads</h1>
        <p className="text-muted-foreground">
          Review generated companies, open their websites, and inspect outreach tied to each lead.
        </p>
      </div>

      <Card className="card-premium p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold">Generated Leads</h2>
            <p className="text-sm text-muted-foreground">
              {Number.isFinite(campaignId)
                ? `Filtered to campaign ${campaignId}`
                : "Showing all leads"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{leads.length} leads</Badge>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm("Are you sure you want to clear all leads and history? This cannot be undone.")) {
                  clearDataMutation.mutate();
                }
              }}
              disabled={clearDataMutation.isPending}
            >
              {clearDataMutation.isPending ? "Clearing..." : "Clear All"}
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No leads available yet.
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedLead(lead)}
                >
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{lead.companyName}</p>
                      <p className="text-xs text-muted-foreground">
                        {lead.industry || "General"} {lead.location ? `• ${lead.location}` : ""}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p>{lead.contactName || "Unknown contact"}</p>
                      <p className="text-xs text-muted-foreground">{lead.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {lead.website ? (
                      <a
                        href={lead.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                        onClick={(event) => event.stopPropagation()}
                      >
                        Open website
                      </a>
                    ) : (
                      <span className="text-muted-foreground">No website</span>
                    )}
                  </TableCell>
                  <TableCell>{Number(lead.score).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{lead.status}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Card className="card-premium p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold">Lead Detail</h2>
            <p className="text-sm text-muted-foreground">
              Select a lead to review the marketing email that was recorded for it.
            </p>
          </div>
        </div>

        {!selectedLead ? (
          <p className="text-muted-foreground">Select a lead from the table above.</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Company</p>
                <p className="font-medium">{selectedLead.companyName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Recipient</p>
                <p className="font-medium">{selectedLead.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              {leadMessages.length === 0 ? (
                <p className="text-muted-foreground">
                  No messages stored for this lead yet.
                </p>
              ) : (
                leadMessages.map((message: any) => (
                  <Card key={message.id} className="p-4 border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{message.subject}</p>
                      <Badge variant="outline">{message.status || "stored"}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      From {message.senderEmail} to {message.recipientEmail || selectedLead.email}
                    </p>
                    <pre className="whitespace-pre-wrap text-sm font-sans text-foreground">
                      {message.content}
                    </pre>
                  </Card>
                ))
              )}
            </div>

            {selectedLead.website ? (
              <Button asChild variant="outline">
                <a href={selectedLead.website} target="_blank" rel="noreferrer">
                  Visit Company Website
                </a>
              </Button>
            ) : null}
          </div>
        )}
      </Card>
    </div>
  );
}
