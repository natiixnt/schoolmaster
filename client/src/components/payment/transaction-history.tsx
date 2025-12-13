import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownLeft, CreditCard, GraduationCap } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface TransactionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'lesson_payment' | 'refund';
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  description: string;
  createdAt: string;
}

export function TransactionHistory({ isOpen, onClose }: TransactionHistoryProps) {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['/api/balance/transactions'],
    enabled: isOpen,
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
      case 'withdrawal':
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      case 'lesson_payment':
        return <GraduationCap className="h-4 w-4 text-blue-600" />;
      case 'refund':
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'refund':
        return 'text-green-600';
      case 'withdrawal':
      case 'lesson_payment':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTransactionSign = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'refund':
        return '+';
      case 'withdrawal':
      case 'lesson_payment':
        return '-';
      default:
        return '';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Doładowanie';
      case 'withdrawal':
        return 'Wypłata';
      case 'lesson_payment':
        return 'Płatność za lekcję';
      case 'refund':
        return 'Zwrot';
      default:
        return 'Transakcja';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Historia transakcji</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4 p-4">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map((transaction: Transaction) => (
                <div 
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">
                          {transaction.description}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(transaction.type)}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        {format(new Date(transaction.createdAt), 'dd MMM yyyy, HH:mm', { locale: pl })}
                      </p>
                      <p className="text-xs text-gray-400">
                        Saldo: {parseFloat(transaction.balanceAfter).toFixed(2)} zł
                      </p>
                    </div>
                  </div>
                  <div className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                    {getTransactionSign(transaction.type)}{Math.abs(parseFloat(transaction.amount)).toFixed(2)} zł
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Brak transakcji</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}