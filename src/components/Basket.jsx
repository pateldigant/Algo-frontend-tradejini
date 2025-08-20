import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, ShoppingCart } from "lucide-react";

function Basket({ basket, onExecute, onClear, onRemove }) {
  if (basket.length === 0) {
    return null; // The parent component handles visibility
  }

  return (
    <div className="fixed bottom-4 left-4 w-[450px] max-w-[90vw] z-50">
        <Card className="shadow-2xl bg-slate-50">
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
                <CardTitle className="text-lg">Order Basket ({basket.length})</CardTitle>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={onClear}>Clear</Button>
                    <Button size="sm" onClick={onExecute}>
                        <ShoppingCart className="mr-2 h-4 w-4" /> Execute
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="max-h-[200px] overflow-y-auto">
                    {basket.map((order, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border-t">
                            <div className="text-sm">
                                <span className={`font-bold ${order.side === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
                                    {order.side}
                                </span>
                                <span className="mx-2">{order.lots} Lot(s)</span>
                                <span className="text-muted-foreground">{order.symId}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemove(index)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                        </div>
                    ))}
                </ScrollArea>
            </CardContent>
        </Card>
    </div>
  );
}

export default Basket;