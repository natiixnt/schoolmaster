import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import StudentDashboard from "@/pages/student-dashboard";
import StudentHomework from "@/pages/student-homework";
import StudentPackages from "@/pages/student-packages";
import QuizTaking from "@/pages/quiz-taking";
import TutorDashboard from "@/pages/tutor-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminLogin from "@/pages/admin-login";
import AdminFinances from "@/pages/admin-finances";
import QuizManagement from "@/pages/quiz-management";
import AdminExerciseManagement from "@/pages/admin-exercise-management";
import Messages from "@/pages/messages";
import StudentMatching from "@/pages/student-matching";
import TutorMatching from "@/pages/tutor-matching";
import StudentList from "@/pages/student-list";
import TutorList from "@/pages/tutor-list";
import StudentEnrollment from "@/pages/student-enrollment";
import FindTutorSimple from "@/pages/find-tutor-simple";
import StudentProgress from "@/pages/student-progress";
import TutorAvailability from "@/pages/tutor-availability";
import StudentAvailability from "@/pages/student-availability";
import TutorInvitations from "@/pages/tutor-invitations";
import StudentInvitations from "@/pages/student-invitations";
import RoleSelection from "@/pages/role-selection";
import UserSettings from "@/pages/user-settings";

import Checkout from "@/pages/checkout";
import PaymentSuccess from "@/pages/payment-success";
import AuthPage from "@/pages/auth-page";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import TutorFeatured from "@/pages/tutor-featured";
import Referrals from "@/pages/referrals";
import ExerciseBank from "@/pages/exercise-bank";
import ExerciseSolving from "@/pages/exercise-solving";
import ExerciseHistory from "@/pages/exercise-history";
import NotFound from "@/pages/not-found";

function Router() {
  // Check if any demo mode is active
  const isDemoMode = window.location.search.includes('demo=true');
  
  const { isAuthenticated, isLoading, user } = useAuth();

  // Skip loading screen for demo mode
  if (!isDemoMode && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-900"></div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Admin routes - accessible regardless of user auth */}
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/admin-finances" component={AdminFinances} />
      <Route path="/quiz-management" component={QuizManagement} />
      <Route path="/admin/exercise-management" component={AdminExerciseManagement} />
      
      {/* View switching routes - accessible from admin panel */}
      <Route path="/student-dashboard" component={StudentDashboard} />
      <Route path="/student-homework" component={StudentHomework} />
      <Route path="/tutor-dashboard" component={TutorDashboard} />
      <Route path="/student-list" component={StudentList} />
      <Route path="/tutor-list" component={TutorList} />
      
      {/* Payment routes - accessible by all users */}
      <Route path="/checkout" component={Checkout} />
      <Route path="/payment-success" component={PaymentSuccess} />
      
      {/* Settings routes - accessible by authenticated users */}
      <Route path="/settings" component={UserSettings} />
      <Route path="/tutor-availability" component={TutorAvailability} />

      
      {/* Public auth routes - always accessible */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
        </>
      ) : user && !(user as any).roleSetupComplete ? (
        <>
          <Route path="/role-selection" component={RoleSelection} />
          <Route path="/*" component={RoleSelection} />
        </>
      ) : (
        <>
          {(user as any)?.role === "student" && <Route path="/" component={StudentDashboard} />}
          {(user as any)?.role === "tutor" && <Route path="/" component={TutorDashboard} />}
          {(user as any)?.role === "admin" && <Route path="/" component={AdminDashboard} />}
          <Route path="/role-selection" component={RoleSelection} />
          <Route path="/student" component={StudentDashboard} />
          <Route path="/student-homework" component={StudentHomework} />
          <Route path="/student-packages" component={StudentPackages} />
          <Route path="/student-progress" component={StudentProgress} />
          <Route path="/quiz/:moduleCode" component={QuizTaking} />
          <Route path="/exercises/:moduleCode" component={ExerciseBank} />
          <Route path="/exercise/:exerciseId" component={ExerciseSolving} />
          <Route path="/exercise-history" component={ExerciseHistory} />
          <Route path="/student-matching" component={StudentMatching} />
          <Route path="/student-enrollment" component={StudentEnrollment} />
          <Route path="/student-invitations" component={StudentInvitations} />
          <Route path="/find-tutor" component={FindTutorSimple} />
          <Route path="/tutor" component={TutorDashboard} />
          <Route path="/tutor-featured" component={TutorFeatured} />
          <Route path="/tutor-matching" component={TutorMatching} />
          <Route path="/tutor-availability" component={TutorAvailability} />
        <Route path="/student-availability" component={StudentAvailability} />
          <Route path="/tutor-invitations" component={TutorInvitations} />
          <Route path="/messages" component={Messages} />
          <Route path="/dashboard/referrals" component={Referrals} />
          <Route path="/admin" component={AdminDashboard} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
