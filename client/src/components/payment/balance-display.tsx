import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Plus, History } from "lucide-react";
import { TopUpModal } from "./top-up-modal";
import { TransactionHistory } from "./transaction-history";

export function BalanceDisplay() {
  const [showTopUp, setShowTopUp] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const { data: balanceData, isLoading } = useQuery({
    queryKey: ['/api/balance'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Saldo konta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-24 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const balance = parseFloat((balanceData as any)?.balance || "0.00");

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Saldo konta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="text-center sm:text-left">
              <div className="text-2xl font-bold text-navy-800">
                {balance.toLocaleString('pl-PL', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })} zł
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Dostępne środki
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => setShowTopUp(true)}
                className="bg-navy-600 hover:bg-navy-700"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Doładuj
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowHistory(true)}
                size="sm"
              >
                <History className="h-4 w-4 mr-2" />
                Historia
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <TopUpModal 
        isOpen={showTopUp} 
        onClose={() => setShowTopUp(false)} 
      />
      
      <TransactionHistory 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)} 
      />
    </>
  );
}