import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, XCircle } from "lucide-react";

function OpenOrdersTable({ orders, onCancel, onModify }) {
  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "open": return <Badge>OPEN</Badge>;
      case "trigger_pending": return <Badge variant="secondary">TRIGGER PENDING</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="terminal-shell border-0">
      <CardHeader className="border-b border-slate-200/80 pb-4">
        <CardTitle className="text-xl font-bold text-slate-800">
          Open Orders
          <span className="ml-2 rounded-full bg-violet-100 px-2 py-1 text-sm font-normal text-violet-700">
            {orders.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Symbol</TableHead>
              <TableHead className="text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">Qty</TableHead>
              <TableHead className="text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">Side</TableHead>
              <TableHead className="text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">Type</TableHead>
              <TableHead className="text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">Price</TableHead>
              <TableHead className="text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">Trigger</TableHead>
              <TableHead className="text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">Status</TableHead>
              <TableHead className="text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <TableRow key={order.orderId}>
                  <TableCell className="font-medium text-slate-800">{order.symId}</TableCell>
                  <TableCell className="terminal-metric text-center">{order.qty}</TableCell>
                  <TableCell className={`text-center font-bold ${order.side?.toLowerCase() === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                    {order.side?.toUpperCase()}
                  </TableCell>
                  <TableCell className="text-center text-xs font-semibold text-muted-foreground">
                    {order.type?.toUpperCase() || 'MARKET'}
                  </TableCell>
                  <TableCell className="terminal-metric text-center">{order.limitPrice > 0 ? order.limitPrice.toFixed(2) : "-"}</TableCell>
                  <TableCell className="terminal-metric text-center">{order.trigPrice > 0 ? order.trigPrice.toFixed(2) : "-"}</TableCell>
                  <TableCell className="text-center">{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button variant="outline" size="sm" className="rounded-lg" onClick={() => onModify(order)}>
                        <Edit className="h-4 w-4 mr-1" /> Modify
                      </Button>
                      <Button variant="destructive" size="sm" className="rounded-lg" onClick={() => onCancel(order.orderId)}>
                        <XCircle className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan="8" className="h-24 text-center text-slate-500">
                  No open orders.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default OpenOrdersTable;
