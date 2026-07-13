// src/components/ActionModals.jsx
import React, { useState, useEffect } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

const ActionModals = ({ modalState, onClose, actions, basket, selectedPositions }) => {
  const [modifyPrice, setModifyPrice] = useState("");
  const [modifyTrigger, setModifyTrigger] = useState("");
  const [positionStopTrigger, setPositionStopTrigger] = useState("");
  const [positionStopLimit, setPositionStopLimit] = useState("");
  const [positionTakeProfitTrigger, setPositionTakeProfitTrigger] = useState("");

  useEffect(() => {
    if (modalState.type === 'modifyOrder' && modalState.data) {
      setModifyPrice(modalState.data.limitPrice || "");
      setModifyTrigger(modalState.data.trigPrice || "");
    }
    if (modalState.type === 'placePositionStopLoss' && modalState.data) {
      setPositionStopTrigger("");
      setPositionStopLimit("");
    }
    if (modalState.type === 'placePositionTakeProfit' && modalState.data) {
      setPositionTakeProfitTrigger("");
    }
  }, [modalState]);

  const {
    handleConfirmOrder, handleSquareOff, handleBulkSquareOff,
    handleLiquidatePortfolio, handleModifyOrder, handleExecuteBasket,
    handlePlacePositionStopLoss, handlePlacePositionTakeProfit
  } = actions;
  
  const isOpen = (type) => modalState.type === type;
  
  if (!modalState.type) return null;

  return (
    <>
      {/* Order Confirmation Modal */}
      <Dialog open={isOpen('confirmOrder')} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Market Order</DialogTitle>
            <DialogDescription className="text-foreground">
              Please review the order details before confirming.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <p><strong>Instrument:</strong> {modalState.data?.symId}</p>
            <p><strong>Side:</strong> <span className={modalState.data?.side === 'BUY' ? 'text-green-600' : 'text-red-600'}>{modalState.data?.side}</span></p>
            <p><strong>Lots:</strong> {modalState.data?.lots}</p>
            <p><strong>Quantity:</strong> {modalState.data?.quantity}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleConfirmOrder}>Confirm Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modify Order Modal */}
      <Dialog open={isOpen('modifyOrder')} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modify Order</DialogTitle>
            <DialogDescription className="text-foreground">Update the price for your pending order.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">Price</Label>
              <Input id="price" value={modifyPrice} onChange={(e) => setModifyPrice(e.target.value)} className="col-span-3" />
            </div>
             {typeof modalState.data?.type === 'string' && modalState.data.type.toLowerCase().includes('stop') && (
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="trigger" className="text-right">Trigger</Label>
                    <Input id="trigger" value={modifyTrigger} onChange={(e) => setModifyTrigger(e.target.value)} className="col-span-3" />
                 </div>
             )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => handleModifyOrder({ price: modifyPrice, triggerPrice: modifyTrigger })}>Confirm Modification</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isOpen('placePositionStopLoss')} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modalState.data?.mode === "paper" ? "Place Paper Stop-Loss" : "Place Real Stop-Loss"}</DialogTitle>
            <DialogDescription className="text-foreground">
              {modalState.data?.mode === "paper"
                ? "Create a virtual stop order for the full paper position."
                : "Create a stop-loss limit order for the full real position."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p><strong>Instrument:</strong> {modalState.data?.symId}</p>
            <p><strong>Net Qty:</strong> {modalState.data?.netQty}</p>
            <p><strong>Avg Price:</strong> {modalState.data?.netAvgPrice?.toFixed?.(2) ?? modalState.data?.netAvgPrice}</p>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="position-stop-trigger" className="text-right">Trigger</Label>
              <Input
                id="position-stop-trigger"
                value={positionStopTrigger}
                onChange={(e) => setPositionStopTrigger(e.target.value)}
                className="col-span-3"
                placeholder="50"
              />
            </div>
            {modalState.data?.mode === "real" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="position-stop-limit" className="text-right">Limit</Label>
                <Input
                  id="position-stop-limit"
                  value={positionStopLimit}
                  onChange={(e) => setPositionStopLimit(e.target.value)}
                  className="col-span-3"
                  placeholder="49.50"
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {modalState.data?.mode === "paper"
                ? "For a long position, the paper stop will trigger when LTP is less than or equal to the trigger price."
                : "For a long position, use a sell stop-loss with trigger above the limit price. For a short position, use a buy stop-loss with trigger below the limit price."}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => handlePlacePositionStopLoss({ triggerPrice: positionStopTrigger, limitPrice: positionStopLimit })}>
              Place Stop-Loss
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isOpen('placePositionTakeProfit')} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arm Take-Profit</DialogTitle>
            <DialogDescription className="text-foreground">
              Track LTP locally. When the trigger is reached, cancel the matching stop-loss order first, then square off at market.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p><strong>Instrument:</strong> {modalState.data?.symId}</p>
            <p><strong>Net Qty:</strong> {modalState.data?.netQty}</p>
            <p><strong>LTP:</strong> {modalState.data?.ltp ?? "-"}</p>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="position-tp-trigger" className="text-right">Trigger</Label>
              <Input
                id="position-tp-trigger"
                value={positionTakeProfitTrigger}
                onChange={(e) => setPositionTakeProfitTrigger(e.target.value)}
                className="col-span-3"
                placeholder="60"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Long positions trigger when LTP is greater than or equal to TP. Short positions trigger when LTP is less than or equal to TP.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => handlePlacePositionTakeProfit({ triggerPrice: positionTakeProfitTrigger })}>
              Arm Take-Profit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialogs for Destructive Actions */}
      <AlertDialog open={['confirmSquareOff', 'confirmBulkSquareOff', 'confirmLiquidate', 'confirmBasket'].includes(modalState.type)} onOpenChange={onClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {
                {
                  'confirmSquareOff': 'Confirm Square Off',
                  'confirmBulkSquareOff': 'Confirm Bulk Square Off',
                  'confirmLiquidate': 'Confirm Portfolio Liquidation',
                  'confirmBasket': 'Confirm Basket Order',
                }[modalState.type]
              }
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground">
                {
                    {
                        'confirmSquareOff': `Are you sure you want to square off ${modalState.data?.symId}?`,
                        'confirmBulkSquareOff': `Square off ${selectedPositions.size} selected positions? This action cannot be undone.`,
                        'confirmLiquidate': 'This will cancel all open orders and exit all positions. This is irreversible.',
                        'confirmBasket': `Execute a basket with ${basket.length} orders?`,
                    }[modalState.type]
                }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={
                {
                  'confirmSquareOff': handleSquareOff,
                  'confirmBulkSquareOff': handleBulkSquareOff,
                  'confirmLiquidate': handleLiquidatePortfolio,
                  'confirmBasket': handleExecuteBasket,
                }[modalState.type]
            }>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ActionModals;
