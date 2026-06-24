"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  HelpCircle,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
} from "lucide-react"
import { customerApi } from "@/lib/customer-api"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface TicketRecord {
  id: number
  ticket_number: string
  subject: string
  description?: string
  status: string
  priority: string
  created_at: string
  updated_at?: string
  messages?: Array<{
    id: number
    message: string
    sender_type: string  // 'customer', 'agent', or 'system'
    created_at: string
  }>
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  open: { icon: AlertCircle, color: "text-primary dark:text-primary/80", bg: "bg-primary/15 dark:bg-blue-950" },
  in_progress: { icon: Clock, color: "text-warning dark:text-warning", bg: "bg-warning/15 dark:bg-yellow-950" },
  pending: { icon: Clock, color: "text-warning dark:text-warning", bg: "bg-warning/15 dark:bg-orange-950" },
  resolved: { icon: CheckCircle2, color: "text-success dark:text-success", bg: "bg-success/15 dark:bg-green-950" },
  closed: { icon: CheckCircle2, color: "text-slate-700 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800" },
}

export default function CustomerSupportPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<TicketRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newTicket, setNewTicket] = useState({ subject: "", description: "" })
  const [selectedTicket, setSelectedTicket] = useState<TicketRecord | null>(null)
  const [replyText, setReplyText] = useState("")
  const [isSendingReply, setIsSendingReply] = useState(false)
  const [isLoadingTicketDetail, setIsLoadingTicketDetail] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("customerToken")
    if (!token) {
      router.push("/customer/login")
      return
    }
    fetchTickets()
  }, [router])

  const fetchTickets = async () => {
    try {
      setIsLoading(true)
      const data = await customerApi.getTickets()
      const ticketList = Array.isArray(data) ? data : data.results || []
      setTickets(ticketList)
    } catch (err: any) {
      if (err.message?.includes("401")) {
        router.push("/customer/login")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTicketDetail = async (ticketId: number) => {
    try {
      setIsLoadingTicketDetail(true)
      const data = await customerApi.getTicket(ticketId)
      return data
    } catch (err: any) {
      console.error("Failed to fetch ticket detail:", err)
      return null
    } finally {
      setIsLoadingTicketDetail(false)
    }
  }

  const handleTicketClick = async (ticket: TicketRecord) => {
    if (selectedTicket?.id === ticket.id) {
      setSelectedTicket(null)
      return
    }
    
    // Fetch full ticket details including messages
    const fullTicket = await fetchTicketDetail(ticket.id)
    if (fullTicket) {
      setSelectedTicket(fullTicket)
    } else {
      // Fallback to the list data if detail fetch fails
      setSelectedTicket(ticket)
    }
  }

  const handleCreateTicket = async () => {
    if (!newTicket.subject.trim()) return
    try {
      setIsCreating(true)
      await customerApi.createTicket({
        subject: newTicket.subject,
        description: newTicket.description,
      })
      setNewTicket({ subject: "", description: "" })
      setShowCreate(false)
      toast.success("Ticket created successfully")
      fetchTickets()
    } catch (err: any) {
      toast.error(err.message || "Failed to create ticket")
    } finally {
      setIsCreating(false)
    }
  }

  const handleReply = async () => {
    if (!selectedTicket || !replyText.trim()) return
    try {
      setIsSendingReply(true)
      await customerApi.replyToTicket(selectedTicket.id, replyText)
      setReplyText("")
      toast.success("Reply sent")
      // Refresh the ticket detail to show the new reply
      const updatedTicket = await fetchTicketDetail(selectedTicket.id)
      if (updatedTicket) {
        setSelectedTicket(updatedTicket)
      }
      fetchTickets() // Also refresh the list
    } catch (err: any) {
      toast.error(err.message || "Failed to send reply")
    } finally {
      setIsSendingReply(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Support</h1>
        {[1, 2].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-5 w-48 mb-2" />
            <Skeleton className="h-4 w-full" />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Support</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Get help from our support team
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  placeholder="Please describe your issue in detail..."
                  rows={4}
                  className="mt-1"
                />
              </div>
              <Button
                onClick={handleCreateTicket}
                disabled={isCreating || !newTicket.subject.trim()}
                className="w-full"
              >
                {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit Ticket
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {tickets.length === 0 ? (
        <Card className="p-12 text-center">
          <HelpCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold text-lg mb-1">No Support Tickets</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Need help? Create a support ticket and our team will assist you.
          </p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Ticket
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const config = statusConfig[ticket.status] || statusConfig.open
            const StatusIcon = config.icon
            const isSelected = selectedTicket?.id === ticket.id

            return (
              <div key={ticket.id}>
                <Card
                  className={`p-4 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                    isSelected ? "ring-2 ring-ring" : ""
                  }`}
                  onClick={() => handleTicketClick(ticket)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                      <StatusIcon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{ticket.subject}</p>
                        <Badge variant="outline" className={`text-xs ${config.color} ${config.bg}`}>
                          {ticket.status.replace("_", " ")}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {ticket.priority}
                        </Badge>
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                        <span>#{ticket.ticket_number}</span>
                        <span>{new Date(ticket.created_at).toLocaleDateString("en-KE", {
                          month: "short", day: "numeric", year: "numeric",
                        })}</span>
                      </div>
                    </div>
                    <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </Card>

                {/* Expanded ticket view */}
                {isSelected && (
                  <Card className="mt-1 p-4 border-l-4 border-l-blue-500">
                    {isLoadingTicketDetail ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    ) : (
                      <>
                        {selectedTicket.description && (
                          <p className="text-sm mb-4">{selectedTicket.description}</p>
                        )}

                        {/* Replies - using 'messages' from backend */}
                        {/* Note: The backend uses 'messages' instead of 'replies' */}
                        {(selectedTicket as any).messages && (selectedTicket as any).messages.length > 0 && (
                          <div className="space-y-3 mb-4">
                            {(selectedTicket as any).messages.map((msg: any) => {
                              const isStaff = msg.sender_type === 'agent' || msg.sender_type === 'system';
                              return (
                                <div
                                  key={msg.id}
                                  className={`p-3 rounded-lg text-sm ${
                                    isStaff
                                      ? "bg-primary/10 dark:bg-blue-950 border border-primary/20 dark:border-primary/20"
                                      : "bg-slate-50 dark:bg-slate-800"
                                  }`}
                                >
                                  <div className="flex justify-between mb-1">
                                    <span className="font-medium text-xs">
                                      {isStaff ? "Support Team" : "You"}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(msg.created_at).toLocaleDateString("en-KE", {
                                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                  <p>{msg.message}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Reply input */}
                        {!["closed", "resolved"].includes(selectedTicket.status) && (
                          <div className="flex gap-2">
                            <Input
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Type a reply..."
                              onKeyDown={(e) => e.key === "Enter" && handleReply()}
                            />
                            <Button
                              size="icon"
                              onClick={handleReply}
                              disabled={isSendingReply || !replyText.trim()}
                            >
                              {isSendingReply ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </Card>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}