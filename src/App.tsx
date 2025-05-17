import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import ExploreCourses from "./pages/ExploreCourses";
import CourseEnrollment from "./pages/CourseEnrollment";
import CourseWeekView from "./pages/CourseWeekView";
import CoursePayment from "./pages/CoursePayment";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import { default as StudentSettings } from "./pages/Settings";
import Grades from "./pages/Grades";
import Assignments from "./pages/Assignments";
import Calendar from "./pages/Calendar";
import Discussions from "./pages/Discussion";
import Careers from "./pages/Careers";
import InternshipApply from "./pages/InternshipApply";
import PendingApproval from "./pages/PendingApproval";
import CreateAssessment from "./pages/instructor/CreateAssessment";
import Assessments from "./pages/student/Assessments";
import InstructorAssessments from "./pages/instructor/Assessments";
import LiveSessions from "./pages/instructor/LiveSessions";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import CourseManagement from "./pages/admin/CourseManagement";
import Analytics from "./pages/admin/Analytics";
import EnrollmentRequests from "./pages/admin/EnrollmentRequests";
import ContactRequests from "./pages/admin/ContactRequests";
import InstructorManagement from "./pages/admin/InstructorManagement";
import InstructorApprovals from "./pages/admin/InstructorApprovals";

// Instructor Pages
import InstructorDashboard from "./pages/instructor/Dashboard";
import InstructorCourses from "./pages/instructor/Courses";
import CourseForm from "./pages/instructor/CourseForm";
import CourseContent from "./pages/instructor/CourseContent";
import Students from "./pages/instructor/Students";
import InstructorAnalytics from "./pages/instructor/Analytics";
import InstructorGuidelinesPage from "./pages/instructor/InstructorGuidelinesPage";
import Support from "./pages/instructor/Support";
import FAQ from "./pages/instructor/FAQ";
import TeachingResources from "./pages/instructor/TeachingResources";
import MessagesPage from "./pages/instructor/Messages";
import { default as InstructorSettings } from "./pages/instructor/Settings";

// Layouts
import InstructorLayout from "./components/layouts/InstructorLayout";
import DashboardLayout from "./components/layouts/DashboardLayout";

import ContactInstructorsPage from "./pages/student/ContactInstructors";
import InstructorProfile from "./components/instructor/InstructorProfile";

// Auth Pages
import InstructorSignup from "./pages/InstructorSignup";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    localStorage.setItem('redirectPath', location.pathname);
    return <Navigate to="/login" />;
  }

  // Handle instructor redirection
  if (user?.role === 'instructor') {
    if (user.status === 'pending') {
      if (location.pathname !== '/pending-approval') {
      return <Navigate to="/pending-approval" />;
      }
    }
    if (user.status === 'approved' && !location.pathname.startsWith('/instructor')) {
      return <Navigate to="/instructor/dashboard" />;
    }
  }

  return <>{children}</>;
};

// Admin Route Component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

// Public Route Component
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    const redirectPath = localStorage.getItem('redirectPath');
    
    if (redirectPath) {
      localStorage.removeItem('redirectPath');
      return <Navigate to={redirectPath} />;
    }

    // Redirect based on user role
    if (user?.role === 'instructor' && user.status === 'approved') {
      return <Navigate to="/instructor/dashboard" />;
    } else if (user?.role === 'admin') {
      return <Navigate to="/admin/dashboard" />;
    }
    
    return <Navigate to="/explore-courses" />;
  }

  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    {/* Public Routes */}
    <Route path="/" element={
      <PublicRoute>
        <Index />
      </PublicRoute>
    } />
    <Route path="/login" element={
      <PublicRoute>
        <Login />
      </PublicRoute>
    } />
    <Route path="/signup" element={
      <PublicRoute>
        <Signup />
      </PublicRoute>
    } />
    <Route path="/instructor-signup" element={
      <PublicRoute>
        <InstructorSignup />
      </PublicRoute>
    } />
    <Route path="/pending-approval" element={
      <ProtectedRoute>
        <PendingApproval />
      </ProtectedRoute>
    } />
    
    {/* Careers Routes */}
    <Route path="/careers" element={<Careers />} />
    <Route path="/careers/apply/:position" element={<InternshipApply />} />

    {/* Student Routes */}
    <Route path="/dashboard" element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    } />
    <Route path="/my-courses" element={
      <ProtectedRoute>
        <Courses />
      </ProtectedRoute>
    } />
    <Route path="/explore-courses" element={
      <ProtectedRoute>
        <ExploreCourses />
      </ProtectedRoute>
    } />
    <Route path="/course/:courseId" element={
      <ProtectedRoute>
        <CourseEnrollment />
      </ProtectedRoute>
    } />
    <Route path="/course/:courseId/payment" element={
      <ProtectedRoute>
        <CoursePayment />
      </ProtectedRoute>
    } />
    <Route path="/course/:courseId/weeks" element={
      <ProtectedRoute>
        <CourseWeekView />
      </ProtectedRoute>
    } />
    <Route path="/course/:courseId/assessments" element={
      <ProtectedRoute>
        <Assessments />
      </ProtectedRoute>
    } />
    <Route path="/profile" element={
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    } />
    <Route path="/settings" element={
      <ProtectedRoute>
        <StudentSettings />
      </ProtectedRoute>
    } />
    <Route path="/grades" element={
      <ProtectedRoute>
        <Grades />
      </ProtectedRoute>
    } />
    <Route path="/assignments" element={
      <ProtectedRoute>
        <Assignments />
      </ProtectedRoute>
    } />
    <Route path="/calendar" element={
      <ProtectedRoute>
        <Calendar />
      </ProtectedRoute>
    } />
    <Route path="/discussions" element={
      <ProtectedRoute>
        <Discussions />
      </ProtectedRoute>
    } />
    <Route path="/contact-instructors" element={
      <ProtectedRoute>
        <ContactInstructorsPage />
      </ProtectedRoute>
    } />

    {/* Admin Routes */}
    <Route path="/admin/dashboard" element={
      <AdminRoute>
        <AdminDashboard />
      </AdminRoute>
    } />
    <Route path="/admin/users" element={
      <AdminRoute>
        <UserManagement />
      </AdminRoute>
    } />
    <Route path="/admin/courses" element={
      <AdminRoute>
        <CourseManagement />
      </AdminRoute>
    } />
    <Route path="/admin/analytics" element={
      <AdminRoute>
        <Analytics />
      </AdminRoute>
    } />
    <Route path="/admin/enrollment-requests" element={
      <AdminRoute>
        <EnrollmentRequests />
      </AdminRoute>
    } />
    <Route path="/admin/contact-requests" element={
      <AdminRoute>
        <ContactRequests />
      </AdminRoute>
    } />
    <Route path="/admin/instructors" element={
      <AdminRoute>
        <InstructorManagement />
      </AdminRoute>
    } />
    <Route path="/admin/instructor-approvals" element={
      <AdminRoute>
        <InstructorApprovals />
      </AdminRoute>
    } />

    {/* Instructor Routes */}
    <Route path="/instructor" element={
      <ProtectedRoute>
        <InstructorLayout />
      </ProtectedRoute>
    }>
      <Route index element={<Navigate to="/instructor/dashboard" replace />} />
      <Route path="dashboard" element={<InstructorDashboard />} />
      <Route path="profile" element={<InstructorProfile />} />
      <Route path="courses" element={<InstructorCourses />} />
      <Route path="courses/new" element={<CourseForm />} />
      <Route path="courses/:courseId/edit" element={<CourseForm />} />
      <Route path="courses/:courseId/content" element={<CourseContent />} />
      <Route path="courses/:courseId/students" element={<Students />} />
      <Route path="courses/:courseId/analytics" element={<InstructorAnalytics />} />
      <Route path="content" element={<CourseContent />} />
      <Route path="students" element={<Students />} />
      <Route path="guidelines" element={<InstructorGuidelinesPage />} />
      <Route path="support" element={<Support />} />
      <Route path="faq" element={<FAQ />} />
      <Route path="assessments" element={<InstructorAssessments />} />
      <Route path="sessions" element={<LiveSessions />} />
      <Route path="messages" element={<MessagesPage />} />
      <Route path="settings" element={<InstructorSettings />} />
      <Route path="teaching-resources" element={<TeachingResources />} />
      <Route path="create-assessment" element={
        <ProtectedRoute>
          <CreateAssessment />
        </ProtectedRoute>
      } />
      <Route path="assessments" element={<Assessments />} />
      <Route path="sessions" element={<LiveSessions />} />
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster />
          <Sonner />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
