import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import SchoolMasterLogo from "@/assets/schoolmaster-logo.png";
import { 
  Search, 
  Mail, 
  MessageCircle, 
  Calendar, 
  Settings, 
  Star, 
  LayoutDashboard, 
  LogOut,
  Gift,
  Target
} from "lucide-react";

interface NavbarProps {
  showDemoMode?: boolean;
}

export function Navbar({ showDemoMode = false }: NavbarProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Get conversations for unread message badge
  const { data: conversationsData = [] } = useQuery({
    queryKey: ["/api/conversations"],
    enabled: !!user && !showDemoMode,
    retry: false,
    staleTime: 30 * 1000, // 30 seconds - refresh badge frequently
  });

  // Get lesson invitations for students only
  const { data: lessonInvitations = [] } = useQuery({
    queryKey: ["/api/student/lesson-invitations"],
    enabled: !!user && user.role === "student" && !showDemoMode,
    retry: false,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setLocation("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setLocation("/login");
    }
  };

  const handleLogoClick = () => {
    if (!user) {
      setLocation("/");
      return;
    }

    switch (user.role) {
      case "student":
        setLocation("/");
        break;
      case "tutor":
        setLocation("/");
        break;
      case "admin":
        setLocation("/admin-dashboard");
        break;
      default:
        setLocation("/");
    }
  };

  // Calculate unread message count
  const unreadMessageCount = (conversationsData as any[]).reduce(
    (total: number, conv: any) => total + (conv.unreadCount || 0), 
    0
  );

  // Calculate pending invitation count (for students only)
  const pendingInvitationCount = user?.role === "student" 
    ? (lessonInvitations as any[]).filter((inv: any) => inv.status === 'pending').length 
    : 0;

  return (
    <header className="bg-white border-b border-gray-200" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={handleLogoClick}
              className="focus:outline-none"
              data-testid="logo-button"
            >
              <img 
                src={SchoolMasterLogo} 
                alt="SchoolMaster" 
                className="h-6"
                data-testid="logo-image"
              />
            </button>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {user?.role === "student" && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setLocation("/student-progress")} 
                  className="flex items-center gap-2"
                  data-testid="button-progress"
                >
                  <Target className="w-4 h-4" />
                  <span className="hidden lg:inline">Postęp i zadania</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setLocation("/find-tutor")} 
                  className="flex items-center gap-2"
                  data-testid="button-find-tutor"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden lg:inline">Znajdź korepetytora</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setLocation("/student-invitations")} 
                  className="flex items-center gap-2 relative"
                  data-testid="button-invitations"
                >
                  <Mail className="w-4 h-4" />
                  <span className="hidden lg:inline">Moje zaproszenia</span>
                  {pendingInvitationCount > 0 && (
                    <div 
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                      data-testid="badge-pending-invitations"
                    >
                      {pendingInvitationCount}
                    </div>
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setLocation("/messages")} 
                  className="flex items-center gap-2 relative"
                  data-testid="button-messages"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden lg:inline">Wiadomości</span>
                  {unreadMessageCount > 0 && (
                    <div 
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                      data-testid="badge-unread-messages"
                    >
                      {unreadMessageCount}
                    </div>
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setLocation("/student-availability")} 
                  className="flex items-center gap-2"
                  data-testid="button-availability"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="hidden lg:inline">Dostępność</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setLocation("/dashboard/referrals")} 
                  className="flex items-center gap-2"
                  data-testid="button-referrals"
                >
                  <Gift className="w-4 h-4" />
                  <span className="hidden lg:inline">Polecenia</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setLocation("/settings")} 
                  className="flex items-center gap-2"
                  data-testid="button-settings"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden lg:inline">Ustawienia</span>
                </Button>
              </>
            )}

            {user?.role === "tutor" && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setLocation("/tutor-invitations")} 
                  className="flex items-center gap-2"
                  data-testid="button-invitations"
                >
                  <Mail className="w-4 h-4" />
                  <span className="hidden lg:inline">Zaproszenia</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setLocation("/messages")} 
                  className="flex items-center gap-2 relative"
                  data-testid="button-messages"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden lg:inline">Wiadomości</span>
                  {unreadMessageCount > 0 && (
                    <div 
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                      data-testid="badge-unread-messages"
                    >
                      {unreadMessageCount}
                    </div>
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setLocation("/tutor-featured-status")} 
                  className="flex items-center gap-2"
                  data-testid="button-featured-status"
                >
                  <Star className="w-4 h-4" />
                  <span className="hidden lg:inline">Status polecany</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setLocation("/settings")} 
                  className="flex items-center gap-2"
                  data-testid="button-settings"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden lg:inline">Ustawienia</span>
                </Button>
              </>
            )}

            {user?.role === "admin" && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setLocation("/admin-dashboard")} 
                  className="flex items-center gap-2"
                  data-testid="button-admin-dashboard"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden lg:inline">Panel admina</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setLocation("/messages")} 
                  className="flex items-center gap-2 relative"
                  data-testid="button-messages"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden lg:inline">Wiadomości</span>
                  {unreadMessageCount > 0 && (
                    <div 
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                      data-testid="badge-unread-messages"
                    >
                      {unreadMessageCount}
                    </div>
                  )}
                </Button>
              </>
            )}

            {/* Logout Button */}
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              size="sm"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Wyloguj się</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
