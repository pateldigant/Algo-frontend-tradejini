import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

const PositionsTable = ({
  positions, allPositions, showOnlyActive, setShowOnlyActive,
  positionLots, setPositionLots, selectedPositions,
  setSelectedPositions, onPlaceOrder, onExit, onExitSelected, onExitAll
}) => {

  const handleSelectionChange = (symId) => {
    setSelectedPositions(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(symId)) { newSelection.delete(symId); }
      else { newSelection.add(symId); }
      return newSelection;
    });
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedPositions(new Set(positions.map(p => p.symId)));
    } else {
      setSelectedPositions(new Set());
    }
  };

  const getDisplayAvgPrice = (p) => {
    const netQty = p?.netQty ?? 0;
    const isIntraday = (p?.buyQty ?? 0) > 0 || (p?.sellQty ?? 0) > 0;
    
    if (netQty > 0) {
      return isIntraday ? p.buyAvgPrice : p.netAvgPrice;
    }
    if (netQty < 0) {
      return isIntraday ? p.sellAvgPrice : p.netAvgPrice;
    }
    return p.buyAvgPrice;
  };

  // PnL for ALL positions
  const totalRealized = allPositions.reduce((sum, p) => sum + (p?.realizedPnl ?? 0), 0);
  const totalUnrealized = allPositions.reduce((sum, p) => sum + (p?.unrealizedPnlLive ?? 0), 0);
  const grandTotal = totalRealized + totalUnrealized;
  
  // PnL for SELECTED positions
  const selectedPnl = React.useMemo(() => {
    return allPositions
      .filter(p => selectedPositions.has(p.symId))
      .reduce((sum, p) => sum + (p?.unrealizedPnlLive ?? 0), 0);
  }, [selectedPositions, allPositions]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Positions</CardTitle>
        <div className="flex justify-between items-center pt-2">
            <div className="flex items-center space-x-2">
                <Switch id="active-positions" checked={showOnlyActive} onCheckedChange={setShowOnlyActive} />
                <Label htmlFor="active-positions">Show only active</Label>
            </div>
            <div className="flex items-center gap-2 w-32">
                <Label htmlFor="pos-lots">Lots:</Label>
                <Input id="pos-lots" type="number" value={positionLots} onChange={e => setPositionLots(Number(e.target.value))} min="1" className="h-8"/>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4 gap-2 items-center">
            {selectedPositions.size > 0 && (
              <div className="text-sm mr-auto">
                <span className="font-semibold">Selected PnL: </span>
                <span className={selectedPnl >= 0 ? "text-green-600" : "text-red-600"}>{selectedPnl.toFixed(2)}</span>
              </div>
            )}
            <Button variant="destructive" size="sm" disabled={selectedPositions.size === 0} onClick={onExitSelected}>
                Exit Selected ({selectedPositions.size})
            </Button>
            <Button variant="outline" size="sm" disabled={positions.length === 0} onClick={onExitAll}>
                Exit All
            </Button>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
            <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[50px]">
                        <Checkbox onCheckedChange={handleSelectAll} checked={positions.length > 0 && selectedPositions.size === positions.length}/>
                    </TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead className="text-center">Lots</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-center">Avg Price</TableHead>
                    <TableHead className="text-center">LTP</TableHead>
                    <TableHead className="text-center">PnL</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {positions.length > 0 ? positions.map((p) => {
                    {/* **FIX**: Determine which PnL to show */}
                    const pnlValue = p.netQty === 0 ? p.realizedPnl : p.unrealizedPnlLive;
                    return (
                        <TableRow key={p.symId}>
                            <TableCell>
                                <Checkbox checked={selectedPositions.has(p.symId)} onCheckedChange={() => handleSelectionChange(p.symId)} />
                            </TableCell>
                            <TableCell className="font-medium">{p.symId}</TableCell>
                            <TableCell className="text-center">{p.lot ? p.netQty / p.lot : "-"}</TableCell>
                            <TableCell className="text-center">{p.netQty}</TableCell>
                            <TableCell className="text-center">{getDisplayAvgPrice(p)?.toFixed(2) ?? "-"}</TableCell>
                            <TableCell className="text-center">{p.ltp ?? "-"}</TableCell>
                            <TableCell className={`text-center font-semibold ${pnlValue >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {pnlValue?.toFixed(2) ?? "-"}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                    <Button size="sm" variant="outline" className="h-7" onClick={() => onPlaceOrder({ symId: p.symId, lot: p.lot, side: 'BUY' }, positionLots)}>B</Button>
                                    <Button size="sm" variant="outline" className="h-7" onClick={() => onPlaceOrder({ symId: p.symId, lot: p.lot, side: 'SELL' }, positionLots)}>S</Button>
                                    <Button variant="secondary" size="sm" className="h-7" onClick={() => onExit(p)}>Exit</Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    )
                }) : (
                <TableRow>
                    <TableCell colSpan="8" className="h-24 text-center">No positions to display.</TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
      </CardContent>
      <CardFooter className="flex justify-around font-medium text-sm pt-4 border-t">
        <div>Total Realized: <span className={totalRealized >= 0 ? "text-green-600" : "text-red-600"}>{totalRealized.toFixed(2)}</span></div>
        <div>Total Unrealized: <span className={totalUnrealized >= 0 ? "text-green-600" : "text-red-600"}>{totalUnrealized.toFixed(2)}</span></div>
        <div>Grand Total: <span className={grandTotal >= 0 ? "text-green-600" : "text-red-600"}>{grandTotal.toFixed(2)}</span></div>
      </CardFooter>
    </Card>
  );
};

export default PositionsTable;