// src/components/FundsDisplay.jsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function FundsDisplay({ funds }) {
  const formatNumber = (num) => {
    if (num === null || num === undefined) return "0.00";
    return new Intl.NumberFormat('en-IN', { 
      maximumFractionDigits: 2, 
      minimumFractionDigits: 2 
    }).format(num);
  };

  const availableMargin = funds?.d?.availMargin ?? 0;
  const usedMargin = funds?.d?.marginUsed ?? 0;
  const totalMargin = availableMargin + usedMargin;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-xl">Margin Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 text-center gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Available Margin</p>
            <p className="text-2xl font-semibold text-green-600">
              ₹{formatNumber(availableMargin)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Used Margin</p>
            <p className="text-2xl font-semibold text-red-600">
              ₹{formatNumber(usedMargin)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Margin</p>
            <p className="text-2xl font-semibold">
              ₹{formatNumber(totalMargin)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default FundsDisplay;