import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Houses from "./pages/Houses";
import HouseDetail from "./pages/HouseDetail";
import MyBookings from "./pages/MyBookings";
import BookingRequests from "./pages/BookingRequests";
import MyListings from "./pages/MyListings";
import CreateListing from "./pages/CreateListing";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminListings from "./pages/admin/AdminListings";
import AdminTestimonials from "./pages/admin/AdminTestimonials";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminUsers from "./pages/admin/AdminUsers";
import Wishlist from "./pages/Wishlist";
import Subscribe from "./pages/Subscribe";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/houses" element={<Houses />} />
          {/* static segment ranks above /houses/:id, so "new" is never an id */}
          {/* Listing is the paid feature, so the gate lives on the route, not
              just on the button that reaches it — typing the URL must not get
              past it either. HouseService enforces the same rule server-side. */}
          <Route
            path="/houses/new"
            element={<ProtectedRoute requireSubscription><CreateListing /></ProtectedRoute>}
          />
          {/* Editing is not behind requireSubscription. The subscription buys the
              right to publish; an owner whose subscription has lapsed still has
              listings on the site and must be able to correct them. Ownership is
              checked server-side either way. */}
          <Route
            path="/houses/:id/edit"
            element={<ProtectedRoute denyAdmin><CreateListing /></ProtectedRoute>}
          />
          <Route path="/houses/:id" element={<HouseDetail />} />

          <Route
            path="/my-bookings"
            element={<ProtectedRoute denyAdmin><MyBookings /></ProtectedRoute>}
          />
          <Route
            path="/requests"
            /* denyAdmin only. Not requireSubscription: an owner whose subscription
               lapsed still has listings with pending requests, and a renter waiting
               on an answer should not be stranded because a payment ran out. The
               account menu hides the link; the page stays reachable. */
            element={<ProtectedRoute denyAdmin><BookingRequests /></ProtectedRoute>}
          />
          <Route
            path="/my-listings"
            element={<ProtectedRoute denyAdmin><MyListings /></ProtectedRoute>}
          />
          <Route
            path="/subscribe"
            element={<ProtectedRoute denyAdmin><Subscribe /></ProtectedRoute>}
          />
          <Route
            path="/wishlist"
            element={<ProtectedRoute denyAdmin><Wishlist /></ProtectedRoute>}
          />
          <Route
            path="/admin"
            element={<ProtectedRoute role="Admin"><AdminLayout /></ProtectedRoute>}
          >
            {/* Each section has its own URL now, so the payments queue can be
                bookmarked and the back button works between them — none of
                which was true when the section was component state. */}
            <Route index element={<Navigate to="listings" replace />} />
            <Route path="listings" element={<AdminListings />} />
            <Route path="testimonials" element={<AdminTestimonials />} />
            <Route path="subscriptions" element={<AdminPayments />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>

          {/* Last, and inside Layout so a wrong URL still gets the nav bar to
              escape with. Without this an unmatched path renders nothing at
              all, which reads as the app having crashed. */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
