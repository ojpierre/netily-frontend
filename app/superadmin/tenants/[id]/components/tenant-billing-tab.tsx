"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CalendarClock, Users, Wifi, Calculator, ReceiptText } from "lucide-react";
import { format } from "date-fns";

// Assuming you have a types file, or you can just use `any` for rapid integration
interface TenantBillingTabProps {
  tenant: any; 
}

export function TenantBillingTab({ tenant }: TenantBillingTabProps) {
  const cycle = tenant?.billing_cycle_details;

  // 1. Handle Missing Cycle (e.g., Trialing tenants who haven't paid yet)
  if (!cycle) {
    return (
      <Alert className="mt-4 border-blue-500 bg-blue-50/50">
        <CalendarClock className="h-4 w-4 text-blue-500" />
        <AlertTitle className="text-blue-700 font-semibold">No Metered Cycle Active</AlertTitle>
        <AlertDescription className="text-blue-600">
          This tenant is currently in a free trial or has not initiated their first metered billing cycle.
        </AlertDescription>
      </Alert>
    );
  }

  // Formatting helpers
  const formatCurrency = (amount: string | number) => 
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(Number(amount));
  
  const formatDate = (dateString: string) => format(new Date(dateString), "MMM dd, yyyy");

  // Determine Badge Colors using valid variants and Tailwind overrides
  // Fixed: Replaced invalid variants 'warning' and 'success' with 'secondary' + Tailwind classes
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': 
        return <Badge variant="secondary" className="bg-blue-500 text-white hover:bg-blue-600 border-transparent">ACTIVE</Badge>;
      case 'invoiced': 
        return <Badge variant="secondary" className="bg-amber-500 text-white hover:bg-amber-600 border-transparent">INVOICED</Badge>;
      case 'paid': 
        return <Badge variant="secondary" className="bg-emerald-500 text-white hover:bg-emerald-600 border-transparent">PAID</Badge>;
      default: 
        return <Badge variant="secondary">{status.toUpperCase()}</Badge>;
    }
  };

  const isEstimated = cycle.status === 'active';

  return (
    <div className="space-y-6 mt-4">
      
      {/* 🔴 THE LOCKOUT ALERT */}
      {(tenant.status === 'past_due' || tenant.status === 'suspended') && (
        <Alert variant="destructive" className="border-red-600 bg-red-50">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-lg font-bold">PAST DUE — Tenant Access Restricted</AlertTitle>
          <AlertDescription className="text-red-700">
            This tenant has been locked out of the dashboard by the TrialGuard middleware. 
            They must settle Invoice <strong>{cycle.invoice_reference || "Pending"}</strong> to restore platform access.
          </AlertDescription>
        </Alert>
      )}

      {/* 📊 LEVEL 1: TOP SUMMARY BAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Cycle Identity */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Cycle</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {formatDate(cycle.start_date)} - {formatDate(cycle.end_date)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(cycle.status)}
              <span className="text-xs text-muted-foreground truncate">ID: {cycle.cycle_id.split('-')[0]}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: PPPoE Count */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unique PPPoE Clients</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cycle.raw_pppoe_count} Users</div>
            <p className="text-xs text-muted-foreground mt-1">
              Billed at {formatCurrency(cycle.snapshot_pppoe_price)} / active user
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Hotspot Share */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Netily Hotspot Share</CardTitle>
            <Wifi className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(cycle.hotspot_share)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {cycle.snapshot_hotspot_share_pct}% of {formatCurrency(cycle.hotspot_revenue_accumulated)} accumulated
            </p>
          </CardContent>
        </Card>

        {/* Card 4: The Bottom Line */}
        <Card className="shadow-sm bg-slate-50 dark:bg-slate-900 border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {isEstimated ? "Current Estimated Total" : "Final Invoiced Total"}
            </CardTitle>
            <Calculator className="h-4 w-4 text-slate-700 dark:text-slate-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(cycle.total_charge)}
            </div>
            {cycle.invoice_reference ? (
              <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <ReceiptText className="h-3 w-3" /> Inv Ref: {cycle.invoice_reference}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1 italic">
                Invoice generated at cycle end
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 🧮 LEVEL 2: THE CHARGE BREAKDOWN TABLE */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Metered Charge Breakdown</CardTitle>
          <CardDescription>The exact, auditable formula used to calculate this cycle's invoice.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900">
              <TableRow>
                <TableHead className="w-[200px]">Component</TableHead>
                <TableHead>Business Rule Formula</TableHead>
                <TableHead className="text-right">Final Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Base Fee */}
              <TableRow>
                <TableCell className="font-medium">Platform Base License</TableCell>
                <TableCell className="text-muted-foreground">Fixed Base Fee</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(cycle.snapshot_base_fee)}</TableCell>
              </TableRow>
              
              {/* PPPoE */}
              <TableRow>
                <TableCell className="font-medium">Active PPPoE Clients</TableCell>
                <TableCell className="text-muted-foreground">
                  {cycle.raw_pppoe_count} true active users × {formatCurrency(cycle.snapshot_pppoe_price)}
                </TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(cycle.pppoe_charge)}</TableCell>
              </TableRow>
              
              {/* Hotspot */}
              <TableRow>
                <TableCell className="font-medium">Hotspot Revenue Share</TableCell>
                <TableCell className="text-muted-foreground">
                  {cycle.snapshot_hotspot_share_pct}% of {formatCurrency(cycle.hotspot_revenue_accumulated)}
                </TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(cycle.hotspot_share)}</TableCell>
              </TableRow>
            </TableBody>
            {/* Total Footer */}
            <TableBody>
              <TableRow className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 border-t-2">
                <TableCell className="font-bold text-lg">Total Due</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right font-black text-lg">{formatCurrency(cycle.total_charge)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}