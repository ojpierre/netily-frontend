"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/app/auth-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  MessageSquare, 
  Plus, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle2,
  HelpCircle,
  Send,
  Paperclip
} from "lucide-react"
import { toast } from "sonner"

interface Ticket {
  id: number
  subject: string
  category: string
  status: "open" | "in_progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high"
  created_at: string
  updated_at: string
  messages: number
}

const faqs = [
  {
    question: "How do I pay my internet bill?",
    answer: "You can pay through M-Pesa, credit/debit card, or bank transfer. Go to the Recharge page, enter the amount, select your payment method, and complete the transaction."
  },
  {
    question: "What happens if my service expires?",
    answer: "Your internet service will be temporarily suspended until payment is made. Your account data remains intact, and service resumes immediately after payment."
  },
  {
    question: "How do I upgrade my package?",
    answer: "Contact our support team or visit your nearest branch. We'll help you choose the best package for your needs and handle the upgrade process."
  },
  {
    question: "Can I get a refund?",
    answer: "Refund requests are handled on a case-by-case basis. Contact support with your invoice number and reason for refund within 7 days of payment."
  },
  {
    question: "How do I check my data usage?",
    answer: "Visit the Usage History page in your dashboard to view detailed statistics about your connection duration and data consumption."
  },
  {
    question: "What are your support hours?",
    answer: "Our support team is available 24/7. Live chat and phone support operate from 8 AM to 10 PM EAT, Monday to Sunday."
  },
]

export default function SupportPage() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  const [newTicket, setNewTicket] = useState({
    subject: "",
    category: "technical",
    priority: "medium",
    description: "",
  })

  useEffect(() => {
    loadTickets()
  }, [])

  const loadTickets = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API call
      // const response = await api.getSupportTickets()
      // setTickets(response.results)

      // Mock data
      const mockTickets: Ticket[] = [
        {
          id: 1,
          subject: "Slow internet speed",
          category: "technical",
          status: "in_progress",
          priority: "high",
          created_at: "2024-11-24T10:00:00",
          updated_at: "2024-11-25T14:30:00",
          messages: 3
        },
        {
          id: 2,
          subject: "Payment not reflecting",
          category: "billing",
          status: "resolved",
          priority: "medium",
          created_at: "2024-11-20T15:20:00",
          updated_at: "2024-11-21T09:15:00",
          messages: 5
        },
      ]

      setTickets(mockTickets)
    } catch (error) {
      toast.error("Failed to load support tickets")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)
    try {
      // TODO: Call API to create ticket
      // await api.createSupportTicket(newTicket)
      
      toast.success("Support ticket created successfully!")
      setIsCreateDialogOpen(false)
      setNewTicket({
        subject: "",
        category: "technical",
        priority: "medium",
        description: "",
      })
      loadTickets()
    } catch (error: any) {
      toast.error(error.message || "Failed to create ticket")
    } finally {
      setLoading(false)
    }
  }

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setIsViewDialogOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-100 text-blue-700"
      case "in_progress": return "bg-yellow-100 text-yellow-700"
      case "resolved": return "bg-green-100 text-green-700"
      case "closed": return "bg-slate-100 text-slate-700"
      default: return "bg-slate-100 text-slate-700"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700"
      case "medium": return "bg-orange-100 text-orange-700"
      case "low": return "bg-blue-100 text-blue-700"
      default: return "bg-slate-100 text-slate-700"
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Support Center</h1>
          <p className="text-slate-600 mt-1">Get help from our support team</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
              <DialogDescription>
                Describe your issue and our team will get back to you
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="Brief description of your issue"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newTicket.category}
                    onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical Issue</SelectItem>
                      <SelectItem value="billing">Billing & Payment</SelectItem>
                      <SelectItem value="account">Account Management</SelectItem>
                      <SelectItem value="general">General Inquiry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newTicket.priority}
                    onValueChange={(value) => setNewTicket({ ...newTicket, priority: value })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide detailed information about your issue..."
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  className="mt-2 min-h-32"
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Paperclip className="w-4 h-4" />
                <span>Attachments (optional)</span>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleCreateTicket} disabled={loading} className="flex-1">
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? "Creating..." : "Submit Ticket"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Contact Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Call Us</p>
              <p className="text-sm text-slate-600">+254 799 538 923</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Email Us</p>
              <p className="text-sm text-slate-600">support@netily.com</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Support Hours</p>
              <p className="text-sm text-slate-600">24/7 Available</p>
            </div>
          </div>
        </Card>
      </div>

      {/* My Tickets */}
      <Card>
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold">My Support Tickets</h2>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No support tickets yet</p>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(true)}
              className="mt-4"
            >
              Create Your First Ticket
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">#{ticket.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{ticket.subject}</p>
                      <p className="text-xs text-slate-500">{ticket.messages} messages</p>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{ticket.category}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(ticket.status)}>
                      {ticket.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewTicket(ticket)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* FAQ Section */}
      <Card className="p-8">
        <div className="flex items-center gap-2 mb-6">
          <HelpCircle className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg font-semibold">Frequently Asked Questions</h2>
        </div>
        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>

      {/* View Ticket Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ticket #{selectedTicket?.id}</DialogTitle>
            <DialogDescription>{selectedTicket?.subject}</DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4 pt-4">
              <div className="flex gap-2">
                <Badge className={getStatusColor(selectedTicket.status)}>
                  {selectedTicket.status.replace("_", " ")}
                </Badge>
                <Badge className={getPriorityColor(selectedTicket.priority)}>
                  {selectedTicket.priority} priority
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {selectedTicket.category}
                </Badge>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user.full_name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{user.full_name}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(selectedTicket.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-700">
                      This is the initial ticket description. The support team will respond shortly...
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                    S
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">Support Team</span>
                      <span className="text-xs text-slate-500">
                        {new Date(selectedTicket.updated_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-700">
                      Thank you for contacting us. We're looking into your issue and will get back to you soon.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label htmlFor="reply">Reply to ticket</Label>
                <Textarea
                  id="reply"
                  placeholder="Type your message..."
                  className="mt-2 min-h-24"
                />
                <Button className="mt-3">
                  <Send className="w-4 h-4 mr-2" />
                  Send Reply
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
