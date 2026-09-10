import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import Admin from "./pages/Admin";
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
            element={<ProtectedRoute><CreateListing /></ProtectedRoute>}
          />
          <Route path="/houses/:id" element={<HouseDetail />} />

          <Route
            path="/my-bookings"
            element={<ProtectedRoute><MyBookings /></ProtectedRoute>}
          />
          <Route
            path="/requests"
            element={<ProtectedRoute><BookingRequests /></ProtectedRoute>}
          />
          <Route
            path="/my-listings"
            element={<ProtectedRoute><MyListings /></ProtectedRoute>}
          />
          <Route
            path="/subscribe"
            element={<ProtectedRoute><Subscribe /></ProtectedRoute>}
          />
          <Route
            path="/wishlist"
            element={<ProtectedRoute><Wishlist /></ProtectedRoute>}
          />
          <Route
            path="/admin"
            element={<ProtectedRoute role="Admin"><Admin /></ProtectedRoute>}
          />

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
