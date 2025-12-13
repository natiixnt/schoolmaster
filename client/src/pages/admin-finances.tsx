import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DollarSign, Plus, Minus, User, History } from "lucide-react";
import { Link } from "wouter";

interface Student {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  balance: number;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

export default function AdminFinances() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [operationType, setOperationType] = useState<"add" | "subtract">("add");

  // Get all students
  const { data: students = [], isLoading: isStudentsLoading } = useQuery<Student[]>({
    queryKey: ["/api/admin/students-with-balance"],
  });

  // Get selected student's transaction history
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/balance-transactions", selectedStudentId],
    enabled: !!selectedStudentId,
  });

  // Balance update mutation
  const updateBalanceMutation = useMutation({
    mutationFn: async (data: { studentId: string; amount: number; description: string; type: string }) => {
      const response = await apiRequest("/api/admin/update-student-balance", "POST", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sukces",
        description: "Saldo zostało zaktualizowane",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/students-with-balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/balance-transactions", selectedStudentId] });
      setAmount("");
      setDescription("");
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się zaktualizować salda",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudentId || !amount || !description) {
      toast({
        title: "Błąd",
        description: "Wypełnij wszystkie pola",
        variant: "destructive",
      });
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: "Błąd",
        description: "Wprowadź poprawną kwotę",
        variant: "destructive",
      });
      return;
    }

    const finalAmount = operationType === "subtract" ? -amountValue : amountValue;
    
    updateBalanceMutation.mutate({
      studentId: selectedStudentId,
      amount: finalAmount,
      description,
      type: operationType === "add" ? "deposit" : "withdrawal"
    });
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  if (isStudentsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-50 to-yellow-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-navy-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-50 to-yellow-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-start justify-start gap-4 mb-4">
            <Link href="/admin-dashboard">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Powrót do panelu admin
              </Button>
            </Link>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel Finansowy Uczniów</h1>
            <p className="text-gray-600">Zarządzaj saldami uczniów</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Balance Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Zarządzaj Saldem
              </CardTitle>
              <CardDescription>
                Dodaj lub odejmij środki z konta ucznia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="student">Wybierz ucznia</Label>
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz ucznia..." />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map(student => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.firstName} {student.lastName} ({student.email}) - {student.balance} zł
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedStudent && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4" />
                        <span className="font-medium">
                          {selectedStudent.firstName} {selectedStudent.lastName}
                        </span>
                        <span className="text-gray-600">•</span>
                        <span className="font-bold text-green-600">
                          Saldo: {selectedStudent.balance} zł
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div>
                  <Label htmlFor="operation">Operacja</Label>
                  <Select value={operationType} onValueChange={(value: "add" | "subtract") => setOperationType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="add">
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4 text-green-600" />
                          Dodaj środki
                        </div>
                      </SelectItem>
                      <SelectItem value="subtract">
                        <div className="flex items-center gap-2">
                          <Minus className="h-4 w-4 text-red-600" />
                          Odejmij środki
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">Kwota (zł)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Opis operacji</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="np. Doładowanie salda, Korekta, itp."
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={updateBalanceMutation.isPending}
                >
                  {operationType === "add" ? (
                    <Plus className="h-4 w-4 mr-2" />
                  ) : (
                    <Minus className="h-4 w-4 mr-2" />
                  )}
                  {operationType === "add" ? "Dodaj" : "Odejmij"} {amount || "0"} zł
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historia Transakcji
              </CardTitle>
              <CardDescription>
                {selectedStudent 
                  ? `Transakcje dla ${selectedStudent.firstName} ${selectedStudent.lastName}`
                  : "Wybierz ucznia aby zobaczyć historię"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedStudentId ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {transactions.length > 0 ? (
                    transactions.map(transaction => (
                      <Card key={transaction.id} className="p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              {transaction.amount > 0 ? (
                                <Plus className="h-4 w-4 text-green-600" />
                              ) : (
                                <Minus className="h-4 w-4 text-red-600" />
                              )}
                              <span className={`font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {transaction.amount > 0 ? '+' : ''}{transaction.amount} zł
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{transaction.description}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(transaction.createdAt).toLocaleString('pl-PL')}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      Brak transakcji dla tego ucznia
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Wybierz ucznia aby zobaczyć historię transakcji
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}