import { useMemo, useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";

type MessageRecord = {
  id: number;
  leadId?: number | null;
  campaignId?: number | null;
  senderEmail: string;
  recipientEmail?: string | null;
  subject: string;
  content: string;
  status?: string | null;
  createdAt: string | Date;
};

/**
 * Get webmail verification URL based on email provider
 */
function getWebmailVerificationUrl(email: string, subject?: string): string {
  const domain = email.split("@")[1]?.toLowerCase() || "";
  const searchQuery = subject ? `subject:${encodeURIComponent(subject)}` : "is:sent";

  if (domain.includes("gmail.com") || domain.includes("google.com")) {
    return `https://mail.google.com/mail/u/0/#search/${searchQuery}`;
  } else if (
    domain.includes("outlook.com") ||
    domain.includes("hotmail.com") ||
    domain.includes("office365.com")
  ) {
    return `https://outlook.live.com/mail/0/search?q=${searchQuery}`;
  } else if (domain.includes("yahoo.com")) {
    return `https://mail.yahoo.com/?search=${encodeURIComponent(searchQuery)}`;
  } else {
    // Generic webmail - try to open email provider
    return `https://${domain}/mail`;
  }
}

export default function OutboxPage() {
  const queryParams =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const campaignId = Number(queryParams?.get("campaignId") || "");
  const [selectedMessage, setSelectedMessage] = useState<MessageRecord | null>(null);
  const previousMessageCountRef = useRef(0);

  const messagesQuery = trpc.data.getMessages.useQuery(undefined, {
    refetchInterval: 2000, // Poll every 2 seconds for new messages
  });
  const leadsQuery = trpc.data.getLeads.useQuery();

  const messages = useMemo(() => {
    const allMessages = (messagesQuery.data?.messages || []) as unknown as MessageRecord[];
    const outgoing = allMessages.filter((message) => message.senderEmail);
    if (!Number.isFinite(campaignId)) {
      return outgoing;
    }
    return outgoing.filter((message) => message.campaignId === campaignId);
  }, [campaignId, messagesQuery.data?.messages]);

  // Track new messages and show notifications
  useEffect(() => {
    const newMessageCount = messages.length;
    const previousCount = previousMessageCountRef.current;

    if (newMessageCount > previousCount && previousCount > 0) {
      const addedCount = newMessageCount - previousCount;
      const lastMessage = messages[0];
      const senderEmail = lastMessage?.senderEmail || "";
      const webmailUrl = getWebmailVerificationUrl(senderEmail, lastMessage?.subject);

      toast.success(
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => {
          window.open(webmailUrl, "_blank");
        }}>
          <Mail className="w-4 h-4 flex-shrink-0" />
          <div>
            <p className="font-medium">{addedCount} email{addedCount > 1 ? "s" : ""} sent!</p>
            <p className="text-xs opacity-75">📧 Click to verify in webmail</p>
          </div>
          <ExternalLink className="w-4 h-4 flex-shrink-0 ml-2" />
        </div>,
        {
          description: `To: ${lastMessage?.recipientEmail}`,
          duration: 6000,
          action: {
            label: "Open Webmail",
            onClick: () => {
              window.open(webmailUrl, "_blank");
            },
          },
        }
      );
    }

    previousMessageCountRef.current = newMessageCount;
  }, [messages.length, messages]);

  const leadLookup = useMemo(() => {
    const map = new Map<number, any>();
    for (const lead of leadsQuery.data?.leads || []) {
      map.set(lead.id, lead);
    }
    return map;
  }, [leadsQuery.data?.leads]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient mb-2">Outbox</h1>
        <p className="text-muted-foreground">
          Inspect stored outreach records, recipients, and message bodies for each workflow.
        </p>
      </div>

      <Card className="card-premium p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold">Sent Messages</h2>
            <p className="text-sm text-muted-foreground">
              {Number.isFinite(campaignId)
                ? `Filtered to campaign ${campaignId}`
                : "Showing all stored message records"}
            </p>
          </div>
          <Badge variant="outline">{messages.length} messages</Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recipient</TableHead>
              <TableHead>Lead</TableHead>
              <TableHead>Sender</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No messages stored yet.
                </TableCell>
              </TableRow>
            ) : (
              messages.map((message) => (
                <TableRow
                  key={message.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedMessage(message)}
                >
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{message.recipientEmail || "Unknown recipient"}</p>
                      <p className="text-xs text-muted-foreground">{message.subject}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {message.leadId ? leadLookup.get(message.leadId)?.companyName || `Lead ${message.leadId}` : "N/A"}
                  </TableCell>
                  <TableCell>{message.senderEmail}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{message.status || "stored"}</Badge>
                  </TableCell>
                  <TableCell>{new Date(message.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Card className="card-premium p-6">
        <h2 className="font-semibold mb-4">Message Preview</h2>
        {!selectedMessage ? (
          <p className="text-muted-foreground">Select a message from the table above.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{selectedMessage.subject}</p>
                <p className="text-xs text-muted-foreground">
                  From {selectedMessage.senderEmail} to {selectedMessage.recipientEmail || "unknown"}
                </p>
              </div>
              <Badge variant="outline">{selectedMessage.status || "stored"}</Badge>
            </div>

            <pre className="whitespace-pre-wrap text-sm font-sans text-foreground">
              {selectedMessage.content}
            </pre>
          </div>
        )}
      </Card>
    </div>
  );
}
