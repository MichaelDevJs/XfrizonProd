import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import App from "./app/App";
import AuthProvider from "./context/AuthContext";

import HomePage from "./pages/public/HomePage";
import Login from "./pages/public/auth/Login";
import Register from "./pages/public/auth/Register";
import OrganizerSignUp from "./pages/public/auth/OrganizerSignUp";
import EventDetailsPage from "./pages/public/EventDetailsPage";
import PaymentSuccessPage from "./pages/public/PaymentSuccessPage";
import UserProfilePage from "./pages/public/UserProfilePage";
import UserProfile from "./pages/public/UserProfile";
import UserProfileEdit from "./pages/public/UserProfileEdit";
import TicketHistoryPage from "./pages/public/TicketHistoryPage";
import SavedEventsPage from "./pages/public/SavedEventsPage";
import OrganizerStorePage from "./pages/public/OrganizerStorePage";
import BlogDetailPage from "./pages/public/blog/BlogDetailPage";
import AllBlogs from "./pages/public/AllBlogs";

import OrganizerRegister from "./pages/organizer/OrganizerRegister";
import OrganizerLogin from "./pages/organizer/OrganizerLogin";
import OrganizerDashboard from "./pages/organizer/OrganizerDashboard";
import MyEvents from "./pages/organizer/MyEvents";
import CreateEvent from "./pages/organizer/CreateEvent";
import EditEvent from "./pages/organizer/EditEvent";
import PreviewEvent from "./pages/organizer/PreviewEvents";
import OrganizerProfile from "./pages/organizer/OrganizerProfile";
import OrganizerProfileEdit from "./pages/organizer/OrganizerProfileEdit";
import OrganizerLayout from "./pages/organizer/OrganizerLayout";
import OrganizerMessages from "./pages/organizer/OrganizerMessages";
import OrganizerFinance from "./pages/organizer/OrganizerFinance";
import OrganizerSupport from "./pages/organizer/OrganizerSupport";
import TicketScanner from "./pages/organizer/TicketScanner";
import Statistics from "./pages/organizer/pages/Statistics/Statistics";
import StripeSuccessPage from "./pages/organizer/StripeSuccessPage";
import StripeRefreshPage from "./pages/organizer/StripeRefreshPage";

import ProtectedRoute from "./component/ProtectedRoute";
import RoleBasedRoute from "./component/RoleBasedRoute";
import UserRoute from "./component/UserRoute";
import AdminRoute from "./component/admin/AdminRoute";
import UnauthorizedRedirectListener from "./component/UnauthorizedRedirectListener";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import BlogManagement from "./pages/admin/BlogManagement";
import UsersManagement from "./pages/admin/UsersManagement";
import OrganizersManagement from "./pages/admin/OrganizersManagement";
import OrganizerVerificationSystem from "./pages/admin/OrganizerVerificationSystem";
import MessagesManagement from "./pages/admin/MessagesManagement";
import AdminHomeBlocksPage from "./pages/admin/AdminHomeBlocksPage";
import AdminPayoutManagement from "./pages/admin/AdminPayoutManagement";

function RootApp() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UnauthorizedRedirectListener />
        <App>
          <Routes>
            {/* Public */}
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />

            {/* User Auth Routes */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route
              path="/auth/organizer-signup"
              element={<OrganizerSignUp />}
            />

            {/* Event Details & Ticketing (Public) */}
            <Route path="/event/:eventId" element={<EventDetailsPage />} />
            <Route path="/payment-success" element={<PaymentSuccessPage />} />

            {/* Blog Articles (Public) */}
            <Route path="/blog/:id" element={<BlogDetailPage />} />
            <Route path="/blogs" element={<AllBlogs />} />

            {/* Organizer Store/Profile (Public) */}
            <Route path="/organizer/:id" element={<OrganizerProfile />} />

            {/* User Profile (Public) */}
            <Route path="/user/:userId" element={<UserProfile />} />

            {/* User Profile Edit (Protected) */}
            <Route
              path="/user-profile-edit"
              element={
                <UserRoute>
                  <UserProfileEdit />
                </UserRoute>
              }
            />

            {/* Saved Events (Protected) */}
            <Route
              path="/saved-events"
              element={
                <UserRoute>
                  <SavedEventsPage />
                </UserRoute>
              }
            />

            {/* Ticket History (Protected) */}
            <Route
              path="/ticket-history"
              element={
                <UserRoute>
                  <TicketHistoryPage />
                </UserRoute>
              }
            />

            {/* User Profile */}
            <Route
              path="/profile"
              element={
                <UserRoute>
                  <UserProfilePage />
                </UserRoute>
              }
            />

            {/* Organizer Auth Routes */}
            <Route path="/organizer/login" element={<OrganizerLogin />} />
            <Route path="/organizer/register" element={<OrganizerRegister />} />
            
            {/* Stripe Connect Callback Routes */}
            <Route path="/organizer/stripe/success" element={<StripeSuccessPage />} />
            <Route path="/organizer/stripe/refresh" element={<StripeRefreshPage />} />

            {/* Organizer Protected Routes */}
            <Route
              path="/organizer"
              element={
                <RoleBasedRoute requiredRole="ORGANIZER">
                  <OrganizerLayout />
                </RoleBasedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<OrganizerDashboard />} />
              <Route path="statistics" element={<Statistics />} />
              <Route path="scanner" element={<TicketScanner />} />
              <Route path="my-events" element={<MyEvents />} />
              <Route path="create-event" element={<CreateEvent />} />
              <Route path="edit-event/:eventId" element={<EditEvent />} />
              <Route path="preview/:id" element={<PreviewEvent />} />
              <Route path="profile" element={<OrganizerProfile />} />
              <Route
                path="profile/:organizerId"
                element={<OrganizerProfile />}
              />
              <Route path="profile-edit" element={<OrganizerProfileEdit />} />
              <Route path="messages" element={<OrganizerMessages />} />
              <Route path="finance" element={<OrganizerFinance />} />
              <Route path="support" element={<OrganizerSupport />} />
            </Route>

            {/* Admin Auth Routes */}
            <Route path="/admin-login" element={<AdminLogin />} />

            {/* Admin Protected Routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="blogs" element={<BlogManagement />} />
              <Route path="users" element={<UsersManagement />} />
              <Route path="organizers" element={<OrganizersManagement />} />
              <Route path="home-blocks" element={<AdminHomeBlocksPage />} />
              <Route
                path="verify-organizers"
                element={<OrganizerVerificationSystem />}
              />
              <Route path="messages" element={<MessagesManagement />} />
              <Route path="payouts" element={<AdminPayoutManagement />} />
            </Route>
          </Routes>
        </App>
      </AuthProvider>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>,
);
