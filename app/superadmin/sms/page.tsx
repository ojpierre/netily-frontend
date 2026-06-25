import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MessageSquareText, Banknote, SignalHigh } from "lucide-react";

// Mock data for UI design purposes
const mockTenants = [
  { id: '1', name: 'Unilex Networks', smsType: 'inbuilt', balance: 12500 },
  { id: '2', name: 'Nantech ISP', smsType: 'custom', balance: null },
  { id: '3', name: 'Frontsedge Telecom', smsType: 'inbuilt', balance: 850 },
  { id: '4', name: 'Meraki Hotspots', smsType: 'inbuilt', balance: 0 },
];

export default function SuperAdminSMSPage() {
  // Mock calculations for the summary cards
  const totalInbuiltBalance = mockTenants
    .filter(t => t.smsType === 'inbuilt')
    .reduce((acc, curr) => acc + (curr.balance || 0), 0);
    
  // Mock total payments (you will fetch this from your backend)
  const totalPaymentsMade = 145000; 

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tenant SMS Overview</h1>
        <p className="text-muted-foreground mt-2">
          Monitor inbuilt SMS balances and total payments across all tenants.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Inbuilt SMS Balance
            </CardTitle>
            <MessageSquareText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInbuiltBalance.toLocaleString()} Units</div>
            <p className="text-xs text-muted-foreground mt-1">
              Available across all inbuilt tenants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total SMS Payments
            </CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {totalPaymentsMade.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Lifetime revenue from SMS top-ups
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tenant SMS Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tenant Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant Name</TableHead>
                <TableHead>SMS Provider</TableHead>
                <TableHead className="text-right">Current Balance</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">{tenant.name}</TableCell>
                  <TableCell>
                    {tenant.smsType === 'inbuilt' ? (
                      <Badge variant="default" className="bg-blue-600">Inbuilt</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Custom API</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {tenant.smsType === 'inbuilt' 
                      ? tenant.balance?.toLocaleString() 
                      : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    {tenant.smsType === 'inbuilt' ? (
                      tenant.balance !== null && tenant.balance > 1000 ? (
                        <div className="flex items-center justify-end text-green-600">
                          <SignalHigh className="w-4 h-4 mr-1" />
                          Healthy
                        </div>
                      ) : (
                        <div className="flex items-center justify-end text-destructive">
                          <SignalHigh className="w-4 h-4 mr-1" />
                          Low
                        </div>
                      )
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}