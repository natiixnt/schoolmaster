import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
  Target,
  Menu
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

  const navItems = (() => {
    if (user?.role === "student") {
      return [
        {
          id: "progress",
          label: "Postęp i zadania",
          icon: Target,
          onClick: () => setLocation("/student-progress"),
        },
        {
          id: "find-tutor",
          label: "Znajdź korepetytora",
          icon: Search,
          onClick: () => setLocation("/find-tutor"),
        },
        {
          id: "invitations",
          label: "Moje zaproszenia",
          icon: Mail,
          onClick: () => setLocation("/student-invitations"),
          badgeCount: pendingInvitationCount,
          badgeTestId: "badge-pending-invitations",
        },
        {
          id: "messages",
          label: "Wiadomości",
          icon: MessageCircle,
          onClick: () => setLocation("/messages"),
          badgeCount: unreadMessageCount,
          badgeTestId: "badge-unread-messages",
        },
        {
          id: "availability",
          label: "Dostępność",
          icon: Calendar,
          onClick: () => setLocation("/student-availability"),
        },
        {
          id: "referrals",
          label: "Polecenia",
          icon: Gift,
          onClick: () => setLocation("/dashboard/referrals"),
        },
        {
          id: "settings",
          label: "Ustawienia",
          icon: Settings,
          onClick: () => setLocation("/settings"),
        },
      ];
    }

    if (user?.role === "tutor") {
      return [
        {
          id: "invitations",
          label: "Zaproszenia",
          icon: Mail,
          onClick: () => setLocation("/tutor-invitations"),
        },
        {
          id: "messages",
          label: "Wiadomości",
          icon: MessageCircle,
          onClick: () => setLocation("/messages"),
          badgeCount: unreadMessageCount,
          badgeTestId: "badge-unread-messages",
        },
        {
          id: "featured-status",
          label: "Status polecany",
          icon: Star,
          onClick: () => setLocation("/tutor-featured-status"),
        },
        {
          id: "settings",
          label: "Ustawienia",
          icon: Settings,
          onClick: () => setLocation("/settings"),
        },
      ];
    }

    if (user?.role === "admin") {
      return [
        {
          id: "admin-dashboard",
          label: "Panel admina",
          icon: LayoutDashboard,
          onClick: () => setLocation("/admin-dashboard"),
        },
        {
          id: "messages",
          label: "Wiadomości",
          icon: MessageCircle,
          onClick: () => setLocation("/messages"),
          badgeCount: unreadMessageCount,
          badgeTestId: "badge-unread-messages",
        },
      ];
    }

    return [];
  })();

  return (
    <header className="bg-white border-b border-gray-200" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
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
                className="h-6 w-auto max-w-none object-contain"
                data-testid="logo-image"
              />
            </button>
          </div>

          {/* Navigation Buttons */}
          <div className="hidden md:flex items-center space-x-1 sm:space-x-2">
            {navItems.map((item) => (
              <Button 
                key={item.id}
                variant="ghost" 
                size="sm"
                onClick={item.onClick}
                className="flex items-center gap-2 relative"
                data-testid={`button-${item.id}`}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden lg:inline">{item.label}</span>
                {item.badgeCount && item.badgeCount > 0 && (
                  <div 
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                    data-testid={item.badgeTestId || `badge-${item.id}`}
                  >
                    {item.badgeCount}
                  </div>
                )}
              </Button>
            ))}

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

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col gap-2 mt-8">
                  {navItems.map((item) => (
                    <SheetClose asChild key={item.id}>
                      <Button
                        variant="ghost"
                        onClick={item.onClick}
                        className="w-full justify-start gap-3"
                        data-testid={`button-mobile-${item.id}`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                        {item.badgeCount && item.badgeCount > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1">
                            {item.badgeCount}
                          </span>
                        )}
                      </Button>
                    </SheetClose>
                  ))}
                  <SheetClose asChild>
                    <Button 
                      onClick={handleLogout} 
                      variant="outline"
                      className="w-full justify-start gap-3"
                      data-testid="button-mobile-logout"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Wyloguj się</span>
                    </Button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
