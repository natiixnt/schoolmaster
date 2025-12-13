import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Calendar, DollarSign, Users, BookOpen, X } from "lucide-react";

interface RevenueDetailsModalProps {
  isOpen: boolean;  
  onClose: () => void;
}

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  date: string;
  category: string;
  userId?: string;
  userName?: string;
}

export default function RevenueDetailsModal({ isOpen, onClose }: RevenueDetailsModalProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("2025-07");

  // Fetch revenue details for the selected period
  const { data: revenueData, isLoading } = useQuery({
    queryKey: ["/api/admin/revenue-details", selectedPeriod],
    enabled: isOpen,
    retry: false,
  });

  const transactions = (revenueData as any)?.transactions || [];
  const summary = (revenueData as any)?.summary || {
    totalIncome: 0,
    totalExpenses: 0,
    netRevenue: 0,
    transactionCount: 0
  };

  const incomeTransactions = transactions.filter((t: Transaction) => t.type === "income");
  const expenseTransactions = transactions.filter((t: Transaction) => t.type === "expense");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <DollarSign className="w-6 h-6" />
            Szczegóły przychodów i kosztów
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Period Selector */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Wybierz okres:</label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025-07">Lipiec 2025</SelectItem>
                <SelectItem value="2025-06">Czerwiec 2025</SelectItem>
                <SelectItem value="2025-05">Maj 2025</SelectItem>
                <SelectItem value="2025-04">Kwiecień 2025</SelectItem>
                <SelectItem value="2025-03">Marzec 2025</SelectItem>
                <SelectItem value="2025-02">Luty 2025</SelectItem>
                <SelectItem value="2025-01">Styczeń 2025</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(summary.totalIncome)}
                    </div>
                    <div className="text-sm text-gray-600">Łączne przychody</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <TrendingDown className="w-8 h-8 text-red-600" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(summary.totalExpenses)}
                    </div>
                    <div className="text-sm text-gray-600">Łączne koszty</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <DollarSign className="w-8 h-8 text-navy-900" />
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${summary.netRevenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(summary.netRevenue)}
                    </div>
                    <div className="text-sm text-gray-600">Zysk netto</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Calendar className="w-8 h-8 text-blue-600" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {summary.transactionCount}
                    </div>
                    <div className="text-sm text-gray-600">Transakcje</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <TrendingUp className="w-5 h-5" />
                  Przychody ({incomeTransactions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {incomeTransactions.length > 0 ? (
                    incomeTransactions.map((transaction: Transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-green-50"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {transaction.description}
                          </div>
                          <div className="text-sm text-gray-600 flex items-center gap-2">
                            <span>{formatDate(transaction.date)}</span>
                            <Badge variant="outline" className="text-xs">
                              {transaction.category}
                            </Badge>
                            {transaction.userName && (
                              <span className="text-xs">• {transaction.userName}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-lg font-semibold text-green-600">
                          +{formatCurrency(transaction.amount)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Brak przychodów w tym okresie</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Expense Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <TrendingDown className="w-5 h-5" />
                  Koszty ({expenseTransactions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {expenseTransactions.length > 0 ? (
                    expenseTransactions.map((transaction: Transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-red-50"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {transaction.description}
                          </div>
                          <div className="text-sm text-gray-600 flex items-center gap-2">
                            <span>{formatDate(transaction.date)}</span>
                            <Badge variant="outline" className="text-xs">
                              {transaction.category}
                            </Badge>
                            {transaction.userName && (
                              <span className="text-xs">• {transaction.userName}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-lg font-semibold text-red-600">
                          -{formatCurrency(transaction.amount)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <TrendingDown className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Brak kosztów w tym okresie</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={onClose} variant="outline">
              <X className="w-4 h-4 mr-2" />
              Zamknij
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}