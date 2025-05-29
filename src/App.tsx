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
import CourseDetails from "./pages/CourseDetails";
import CourseWeekView from "./pages/CourseWeekView";
import CourseQuizView from "./pages/CourseQuizView";
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
import Assessments from "./pages/student/Assessments";
import EnrollPage from "./pages/enroll";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import CourseManagement from "./pages/admin/CourseManagement";
import Analytics from "./pages/admin/Analytics";
import EnrollmentRequests from "./pages/admin/EnrollmentRequests";
import ContactRequests from "./pages/admin/ContactRequests";
import InstructorManagement from "./pages/admin/InstructorManagement";
import InstructorApprovals from "./pages/admin/InstructorApprovals";

// Layouts
import DashboardLayout from "./components/layouts/DashboardLayout";

import ContactInstructorsPage from "./pages/student/ContactInstructors";

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

    if (user?.role === 'admin') {
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
    <Route path="/enroll" element={<EnrollPage />} />
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
    <Route path="/explore-courses" element={<ExploreCourses />} />
    <Route path="/course/:courseId" element={
      <ProtectedRoute>
        <CourseEnrollment />
      </ProtectedRoute>
    } />
    <Route path="/course/:courseId/details" element={<CourseDetails />} />
    <Route path="/course/:courseId/payment" element={<CoursePayment />} />
    <Route path="/course/:courseId/weeks" element={<CourseWeekView />} />
    <Route path="/course/:courseId/quiz/:dayNumber" element={
      <ProtectedRoute>
        <CourseQuizView />
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

    {/* 404 Route */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AppRoutes />
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
