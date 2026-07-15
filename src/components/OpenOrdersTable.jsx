import React from "react";
import { Edit3, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const formatNumber = (value) => Number.isFinite(Number(value)) ? Number(value).toFixed(2) : "-";

function OpenOrdersTable({ orders, onCancel, onModify }) {
  return (
    <section className="activity-panel orders-panel">
      <div className="activity-toolbar">
        <div className="activity-title"><strong>Open orders</strong><span>{orders.length}</span></div>
      </div>
      <div className="activity-table-scroll">
        <Table className="orders-table min-w-[660px]">
          <TableHeader><TableRow>
            <TableHead>Symbol</TableHead><TableHead>Qty</TableHead><TableHead>Side</TableHead>
            <TableHead>Type</TableHead><TableHead>Price</TableHead><TableHead>Trigger</TableHead>
            <TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {orders.length ? orders.map((order) => (
              <TableRow key={order.orderId}>
                <TableCell className="font-medium">{order.symId}</TableCell>
                <TableCell className="terminal-metric">{order.qty}</TableCell>
                <TableCell><Badge variant="outline" className={order.side === "BUY" ? "long-badge" : "short-badge"}>{order.side}</Badge></TableCell>
                <TableCell>{order.type}</TableCell><TableCell className="terminal-metric">{formatNumber(order.price)}</TableCell>
                <TableCell className="terminal-metric">{Number(order.trigPrice) > 0 ? formatNumber(order.trigPrice) : "-"}</TableCell>
                <TableCell><Badge variant="secondary">{String(order.status || "").replaceAll("_", " ")}</Badge></TableCell>
                <TableCell className="text-right"><div className="order-row-actions">
                  <Button variant="ghost" size="icon" title="Modify order" onClick={() => onModify(order)}><Edit3 aria-hidden="true" /></Button>
                  <Button variant="ghost" size="icon" title="Cancel order" className="text-rose-600" onClick={() => onCancel(order.orderId)}><X aria-hidden="true" /></Button>
                </div></TableCell>
              </TableRow>
            )) : <TableRow><TableCell colSpan="8" className="h-20 text-center text-slate-500">No open orders.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

export default OpenOrdersTable;
