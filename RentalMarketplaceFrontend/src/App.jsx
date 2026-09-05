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
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/houses" element={<Houses />} />
          {/* static segment ranks above /houses/:id, so "new" is never an id */}
          <Route
            path="/houses/new"
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
