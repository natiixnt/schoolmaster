import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Copy, Share2, Check, Mail, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReferralCardProps {
  referralCode: string;
}

export function ReferralCard({ referralCode }: ReferralCardProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const referralUrl = `${window.location.origin}/ref/${referralCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast({
        title: "Skopiowano!",
        description: "Link polecający został skopiowany do schowka",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się skopiować linku",
        variant: "destructive",
      });
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent("Dołącz do SchoolMaster!");
    const body = encodeURIComponent(
      `Cześć!\n\nPolecam Ci platformę SchoolMaster - świetne miejsce do nauki online.\n\nZarejestruj się używając mojego linku i otrzymasz 5% zniżki na pierwszą lekcję:\n${referralUrl}\n\nPozdrawiam!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(
      `Cześć! Polecam Ci platformę SchoolMaster - świetne miejsce do nauki online. Zarejestruj się używając mojego linku i otrzymasz 5% zniżki na pierwszą lekcję: ${referralUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <Card className="border-[#F1C40F] border-2 bg-gradient-to-br from-white to-yellow-50" data-testid="card-referral">
      <CardHeader>
        <CardTitle className="text-2xl text-[#252627]">Twój kod polecający</CardTitle>
        <CardDescription>
          Zaproś znajomych i zarabiaj 20 zł za każdego, kto ukończy pierwszą lekcję
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Input
            readOnly
            value={referralCode}
            className="text-2xl font-bold text-center bg-white border-[#5F5AFC] text-[#5F5AFC]"
            data-testid="input-referral-code"
          />
          <Button
            onClick={handleCopy}
            variant="outline"
            size="icon"
            className="border-[#5F5AFC] hover:bg-[#5F5AFC] hover:text-white"
            data-testid="button-copy-code"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Link do udostępnienia:</p>
          <div className="flex items-center space-x-2">
            <Input
              readOnly
              value={referralUrl}
              className="text-sm bg-gray-50"
              data-testid="input-referral-url"
            />
            <Button
              onClick={handleCopy}
              size="sm"
              variant="ghost"
              className="hover:bg-[#5F5AFC] hover:text-white"
              data-testid="button-copy-url"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full bg-[#5F5AFC] hover:bg-[#4f46e5] text-white" data-testid="button-share">
              <Share2 className="mr-2 h-4 w-4" />
              Udostępnij znajomym
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-share">
            <DialogHeader>
              <DialogTitle>Udostępnij kod polecający</DialogTitle>
              <DialogDescription>
                Wybierz sposób, w jaki chcesz podzielić się swoim kodem
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Button
                onClick={shareViaEmail}
                variant="outline"
                className="w-full justify-start"
                data-testid="button-share-email"
              >
                <Mail className="mr-2 h-4 w-4" />
                Wyślij emailem
              </Button>
              <Button
                onClick={shareViaWhatsApp}
                variant="outline"
                className="w-full justify-start"
                data-testid="button-share-whatsapp"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Udostępnij przez WhatsApp
              </Button>
              <Button
                onClick={handleCopy}
                variant="outline"
                className="w-full justify-start"
                data-testid="button-share-copy"
              >
                <Copy className="mr-2 h-4 w-4" />
                Skopiuj link
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="bg-gradient-to-r from-[#F1C40F] to-[#f39c12] p-4 rounded-lg text-[#252627]">
          <h3 className="font-bold mb-1">💡 Jak to działa?</h3>
          <ul className="text-sm space-y-1">
            <li>• Twoi znajomi otrzymują 5% zniżki na pierwszą lekcję</li>
            <li>• Ty dostajesz 20 zł po ich pierwszej ukończonej lekcji</li>
            <li>• Bonus możesz wykorzystać na płatności za lekcje</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
