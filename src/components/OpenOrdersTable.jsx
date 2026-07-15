import React from "react";
import { Edit3, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const formatNumber = (value) => Number.isFinite(Number(value)) ? Number(value).toFixed(2) : "-";
const firstPositivePrice = (...values) => values.find((value) => Number.isFinite(Number(value)) && Number(value) > 0);

const getLimitPrice = (order) => firstPositivePrice(order?.limitPrice, order?.price, order?.limit_price);
const getTriggerPrice = (order) => firstPositivePrice(order?.trigPrice, order?.triggerPrice, order?.trigger_price);

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
            {orders.length ? orders.map((order) => {
              const limitPrice = getLimitPrice(order);
              const triggerPrice = getTriggerPrice(order);
              const side = String(order.side || "").toUpperCase();
              return (
                <TableRow key={order.orderId}>
                  <TableCell className="font-medium">{order.symId}</TableCell>
                  <TableCell className="terminal-metric">{order.qty}</TableCell>
                  <TableCell><Badge variant="outline" className={side === "BUY" ? "long-badge" : "short-badge"}>{side}</Badge></TableCell>
                  <TableCell>{order.type}</TableCell><TableCell className="terminal-metric">{formatNumber(limitPrice)}</TableCell>
                  <TableCell className="terminal-metric">{formatNumber(triggerPrice)}</TableCell>
                  <TableCell><Badge variant="secondary">{String(order.status || "").replaceAll("_", " ")}</Badge></TableCell>
                  <TableCell className="text-right"><div className="order-row-actions">
                    <Button variant="ghost" size="icon" title="Modify order" onClick={() => onModify(order)}><Edit3 aria-hidden="true" /></Button>
                    <Button variant="ghost" size="icon" title="Cancel order" className="text-rose-600" onClick={() => onCancel(order.orderId)}><X aria-hidden="true" /></Button>
                  </div></TableCell>
                </TableRow>
              );
            }) : <TableRow><TableCell colSpan="8" className="h-20 text-center text-slate-500">No open orders.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

export default OpenOrdersTable;
