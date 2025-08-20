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
    <Card>
      <CardHeader>
        <CardTitle>Open Orders ({orders.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead className="text-center">Qty</TableHead>
              <TableHead className="text-center">Side</TableHead>
              <TableHead className="text-center">Type</TableHead> {/* <-- NEW COLUMN */}
              <TableHead className="text-center">Price</TableHead>
              <TableHead className="text-center">Trigger</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <TableRow key={order.orderId}>
                  <TableCell className="font-medium">{order.symId}</TableCell>
                  <TableCell className="text-center">{order.qty}</TableCell>
                  <TableCell className={`text-center font-bold ${order.side?.toLowerCase() === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                    {order.side?.toUpperCase()}
                  </TableCell>
                  <TableCell className="text-center text-xs font-semibold text-muted-foreground">
                    {order.type?.toUpperCase() || 'MARKET'}
                  </TableCell> {/* <-- NEW CELL */}
                  <TableCell className="text-center">{order.limitPrice > 0 ? order.limitPrice.toFixed(2) : "-"}</TableCell>
                  <TableCell className="text-center">{order.trigPrice > 0 ? order.trigPrice.toFixed(2) : "-"}</TableCell>
                  <TableCell className="text-center">{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => onModify(order)}>
                        <Edit className="h-4 w-4 mr-1" /> Modify
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => onCancel(order.orderId)}>
                        <XCircle className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan="8" className="h-24 text-center"> {/* <-- Adjusted colSpan */}
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