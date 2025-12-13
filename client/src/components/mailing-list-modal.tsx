import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Mail, CheckCircle } from "lucide-react";

interface MailingListModalProps {
  subjectId: string;
  subjectName: string;
  children: React.ReactNode;
}

export function MailingListModal({ subjectId, subjectName, children }: MailingListModalProps) {
  const [email, setEmail] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const subscribeMutation = useMutation({
    mutationFn: async (data: { email: string; subjectId: string }) => {
      return await apiRequest("/api/mailing-list/subscribe", "POST", data);
    },
    onSuccess: () => {
      setIsSubscribed(true);
      toast({
        title: "Zapisano na listę!",
        description: `Powiadomimy Cię gdy ${subjectName} będzie dostępny.`,
      });
      setTimeout(() => {
        setIsOpen(false);
        setIsSubscribed(false);
        setEmail("");
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Błąd zapisu",
        description: error.message || "Nie udało się zapisać na listę mailingową.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        title: "Błąd",
        description: "Podaj adres email.",
        variant: "destructive",
      });
      return;
    }

    subscribeMutation.mutate({ email: email.trim(), subjectId });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-navy-900" />
            Powiadomienie o dostępności
          </DialogTitle>
          <DialogDescription>
            Przedmiot <strong>{subjectName}</strong> nie jest jeszcze dostępny. 
            Podaj swój email, a powiadomimy Cię gdy będzie można się zapisać.
          </DialogDescription>
        </DialogHeader>
        
        {isSubscribed ? (
          <div className="text-center py-6">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-700 mb-2">
              Zapisano na listę!
            </h3>
            <p className="text-gray-600">
              Wyślemy Ci email gdy {subjectName} będzie dostępny.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adres email</Label>
              <Input
                id="email"
                type="email"
                placeholder="twoj@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={subscribeMutation.isPending}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={subscribeMutation.isPending}
              >
                Anuluj
              </Button>
              <Button
                type="submit"
                disabled={subscribeMutation.isPending}
                className="bg-navy-900 hover:bg-navy-800"
              >
                {subscribeMutation.isPending ? "Zapisuję..." : "Zapisz mnie"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}