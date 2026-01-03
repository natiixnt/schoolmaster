import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import SchoolMasterLogo from "@/assets/schoolmaster-logo-auth.png";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Eye, EyeOff, Mail, Lock, User, Calculator, Shield, Star, Target, CheckCircle } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";

const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
  password: z.string().min(6, "Hasło musi mieć minimum 6 znaków"),
});

const registerSchema = z.object({
  firstName: z.string().min(2, "Imię musi mieć minimum 2 znaki"),
  lastName: z.string().min(2, "Nazwisko musi mieć minimum 2 znaki"),
  email: z.string().email("Nieprawidłowy adres email"),
  password: z.string().min(6, "Hasło musi mieć minimum 6 znaków"),
  confirmPassword: z.string().min(6, "Potwierdź hasło"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Hasła nie są identyczne",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") === "register" ? "register" : "login";
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiRequest("/api/auth/login", "POST", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Zalogowano pomyślnie",
        description: "Witamy w SchoolMaster!",
      });
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Błąd logowania",
        description: error.message || "Nieprawidłowe dane logowania",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const { confirmPassword, ...registerData } = data;
      const response = await apiRequest("/api/auth/register", "POST", registerData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Konto utworzone",
        description: "Zaloguj się swoimi nowymi danymi",
      });
      setActiveTab("login");
    },
    onError: (error: any) => {
      toast({
        title: "Błąd rejestracji",
        description: error.message || "Nie udało się utworzyć konta",
        variant: "destructive",
      });
    },
  });

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-indigo-300/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-10 -right-10 w-80 h-80 bg-gradient-to-br from-yellow-200/30 to-orange-300/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-200/20 to-purple-300/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-6xl relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Hero Content */}
        <div className="space-y-8 text-center lg:text-left order-2 lg:order-1">
          {/* Logo & Brand */}
          <div className="flex items-center justify-center lg:justify-start space-x-4">
            <img 
              src={SchoolMasterLogo} 
              alt="SchoolMaster" 
              className="h-12"
            />
          </div>

          {/* Main Heading */}
          <div className="space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
              Zacznij swoją przygodę z
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> matematyką</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Dołącz do tysięcy uczniów, którzy już przygotowują się do egzaminu ósmoklasisty
            </p>
          </div>

          {/* Key Features */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">Indywidualne korepetycje online</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">System motywacji i gamifikacji</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">Sprawdzone metody przygotowania</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 py-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">2847+</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Uczniów</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">94%</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Sukces</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">4.9</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Ocena</div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="lg:max-w-lg mx-auto w-full order-1 lg:order-2">
          <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-2xl">
            <CardHeader className="text-center p-8">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <span className="text-lg font-semibold text-gray-900 dark:text-white">Bezpieczne logowanie</span>
              </div>
            </CardHeader>

            <CardContent className="p-8 pt-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 dark:bg-slate-700 p-1 rounded-lg">
                  <TabsTrigger value="login" className="rounded-md font-medium">Logowanie</TabsTrigger>
                  <TabsTrigger value="register" className="rounded-md font-medium">Rejestracja</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-6">
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-gray-700 dark:text-gray-300 font-medium">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="twoj@email.com"
                          className="pl-10 h-12 border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                          {...loginForm.register("email")}
                        />
                      </div>
                      {loginForm.formState.errors.email && (
                        <p className="text-sm text-blue-600 dark:text-red-400">{loginForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-gray-700 dark:text-gray-300 font-medium">Hasło</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Twoje hasło"
                          className="pl-10 pr-10 h-12 border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                          {...loginForm.register("password")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-blue-600 dark:text-red-400">{loginForm.formState.errors.password.message}</p>
                      )}
                      <div className="text-right">
                        <a 
                          href="/forgot-password" 
                          className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                          data-testid="link-forgot-password"
                        >
                          Zapomniałem hasła
                        </a>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Logowanie..." : "Zaloguj się"}
                    </Button>
                  </form>

                  <div className="mt-6">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-300 dark:border-slate-600" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white dark:bg-slate-800 px-2 text-gray-500 dark:text-gray-400">
                          lub
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-3">
                      <Button
                        type="button"
                        onClick={handleGoogleLogin}
                        variant="outline"
                        className="w-full h-12 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
                      >
                        <FaGoogle className="mr-2 h-4 w-4 text-blue-600" />
                        Zaloguj się z Google
                      </Button>
                    </div>


                  </div>
                </TabsContent>

                <TabsContent value="register" className="space-y-6">
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-gray-700 dark:text-gray-300 font-medium">Imię</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="firstName"
                            placeholder="Jan"
                            className="pl-10 h-12 border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                            {...registerForm.register("firstName")}
                          />
                        </div>
                        {registerForm.formState.errors.firstName && (
                          <p className="text-sm text-blue-600 dark:text-red-400">{registerForm.formState.errors.firstName.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-gray-700 dark:text-gray-300 font-medium">Nazwisko</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="lastName"
                            placeholder="Kowalski"
                            className="pl-10 h-12 border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                            {...registerForm.register("lastName")}
                          />
                        </div>
                        {registerForm.formState.errors.lastName && (
                          <p className="text-sm text-blue-600 dark:text-red-400">{registerForm.formState.errors.lastName.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="text-gray-700 dark:text-gray-300 font-medium">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="twoj@email.com"
                          className="pl-10 h-12 border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                          {...registerForm.register("email")}
                        />
                      </div>
                      {registerForm.formState.errors.email && (
                        <p className="text-sm text-blue-600 dark:text-red-400">{registerForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="text-gray-700 dark:text-gray-300 font-medium">Hasło</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="register-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Minimum 6 znaków"
                          className="pl-10 pr-10 h-12 border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                          {...registerForm.register("password")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-blue-600 dark:text-red-400">{registerForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300 font-medium">Potwierdź hasło</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Powtórz hasło"
                          className="pl-10 pr-10 h-12 border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                          {...registerForm.register("confirmPassword")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {registerForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-blue-600 dark:text-red-400">{registerForm.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Tworzenie konta..." : "Utwórz konto"}
                    </Button>
                  </form>

                  <div className="mt-6">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-300 dark:border-slate-600" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white dark:bg-slate-800 px-2 text-gray-500 dark:text-gray-400">
                          lub
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-3">
                      <Button
                        type="button"
                        onClick={handleGoogleLogin}
                        variant="outline"
                        className="w-full h-12 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
                      >
                        <FaGoogle className="mr-2 h-4 w-4 text-blue-600" />
                        Zaloguj się z Google
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
