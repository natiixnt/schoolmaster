import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface ReferralHistoryItem {
  id: string;
  referredUserName: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  bonusAmount: string;
  bonusAwarded: boolean;
  bonusAwardedAt: Date | null;
  firstLessonCompletedAt: Date | null;
  createdAt: Date;
}

interface ReferralTableProps {
  history: ReferralHistoryItem[];
}

export function ReferralTable({ history }: ReferralTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100" data-testid={`badge-status-confirmed`}>
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Zrealizowane
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100" data-testid={`badge-status-pending`}>
            <Clock className="mr-1 h-3 w-3" />
            Oczekujące
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100" data-testid={`badge-status-cancelled`}>
            <XCircle className="mr-1 h-3 w-3" />
            Anulowane
          </Badge>
        );
      default:
        return null;
    }
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300" data-testid="empty-referrals">
        <p className="text-gray-500 mb-2">Nie masz jeszcze żadnych poleceń</p>
        <p className="text-sm text-gray-400">Zaproś znajomych, aby zacząć zarabiać!</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden" data-testid="table-referrals">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead data-testid="header-user">Użytkownik</TableHead>
            <TableHead data-testid="header-status">Status</TableHead>
            <TableHead data-testid="header-bonus">Bonus</TableHead>
            <TableHead data-testid="header-date">Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((item) => (
            <TableRow key={item.id} data-testid={`row-referral-${item.id}`}>
              <TableCell className="font-medium" data-testid={`cell-user-${item.id}`}>
                {item.referredUserName}
              </TableCell>
              <TableCell data-testid={`cell-status-${item.id}`}>
                {getStatusBadge(item.status)}
              </TableCell>
              <TableCell data-testid={`cell-bonus-${item.id}`}>
                <span className={item.bonusAwarded ? 'text-green-600 font-bold' : 'text-gray-500'}>
                  {parseFloat(item.bonusAmount).toFixed(2)} zł
                </span>
              </TableCell>
              <TableCell className="text-sm text-gray-500" data-testid={`cell-date-${item.id}`}>
                {item.bonusAwardedAt 
                  ? format(new Date(item.bonusAwardedAt), 'dd MMM yyyy', { locale: pl })
                  : format(new Date(item.createdAt), 'dd MMM yyyy', { locale: pl })
                }
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
