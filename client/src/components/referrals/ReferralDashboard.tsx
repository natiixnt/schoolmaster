import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ReferralCard } from './ReferralCard';
import { ReferralTable } from './ReferralTable';
import { Wallet, Users, CheckCircle, Clock } from 'lucide-react';

interface ReferralData {
  referralCode: string;
  balance: string;
  totalReferrals: number;
  confirmedReferrals: number;
  pendingReferrals: number;
  totalEarnings: string;
  history: Array<{
    id: string;
    referredUserName: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    bonusAmount: string;
    bonusAwarded: boolean;
    bonusAwardedAt: Date | null;
    firstLessonCompletedAt: Date | null;
    createdAt: Date;
  }>;
}

export function ReferralDashboard() {
  const { data, isLoading, error } = useQuery<ReferralData>({
    queryKey: ['/api/referrals/me'],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12 bg-red-50 rounded-lg border border-red-200">
          <p className="text-red-600">Nie udało się załadować danych polecających</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Dostępne saldo',
      value: `${parseFloat(data.balance).toFixed(2)} zł`,
      icon: Wallet,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      testId: 'stat-balance'
    },
    {
      title: 'Wszystkie polecenia',
      value: data.totalReferrals.toString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      testId: 'stat-total'
    },
    {
      title: 'Zrealizowane',
      value: data.confirmedReferrals.toString(),
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      testId: 'stat-confirmed'
    },
    {
      title: 'Oczekujące',
      value: data.pendingReferrals.toString(),
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      testId: 'stat-pending'
    },
  ];

  return (
    <div className="container mx-auto py-8 px-4 space-y-6" data-testid="dashboard-referrals">
      <div>
        <h1 className="text-3xl font-bold text-[#252627] mb-2" data-testid="title-referrals">
          Program polecający
        </h1>
        <p className="text-gray-600" data-testid="description-referrals">
          Zapraszaj znajomych i zarabiaj na każdej ukończonej przez nich lekcji
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} data-testid={stat.testId}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.color}`} data-testid={`${stat.testId}-value`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ReferralCard referralCode={data.referralCode} />
        
        <Card data-testid="card-earnings-summary">
          <CardHeader>
            <CardTitle className="text-2xl text-[#252627]">Podsumowanie zarobków</CardTitle>
            <CardDescription>
              Całkowite zarobki z programu polecającego
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Łączne zarobki</p>
                <p className="text-3xl font-bold text-green-600" data-testid="text-total-earnings">
                  {parseFloat(data.totalEarnings).toFixed(2)} zł
                </p>
              </div>
              <Wallet className="h-12 w-12 text-green-600" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Dostępne do wykorzystania:</span>
                <span className="font-bold text-green-600" data-testid="text-available-balance">
                  {parseFloat(data.balance).toFixed(2)} zł
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Wykorzystane:</span>
                <span className="font-bold text-gray-700" data-testid="text-used-balance">
                  {(parseFloat(data.totalEarnings) - parseFloat(data.balance)).toFixed(2)} zł
                </span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500">
                💡 Twoje saldo jest automatycznie wykorzystywane przy płatnościach za lekcje
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-history">
        <CardHeader>
          <CardTitle className="text-2xl text-[#252627]">Historia poleceń</CardTitle>
          <CardDescription>
            Lista wszystkich użytkowników, których poleciłeś
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReferralTable history={data.history} />
        </CardContent>
      </Card>
    </div>
  );
}
