import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ShopProvider } from './context/ShopContext';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import ShopMateChatbot from './components/ShopMateChatbot';

import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import AdminDashboard from './pages/AdminDashboard';
import SemanticSearch from './pages/SemanticSearch';

import Loginpage from './pages/Loginpage';
import Registerpage from './pages/Registerpage';
import Logout from './pages/Logout';

function App() {
  return (
    <ShopProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">

          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Loginpage />} />
            <Route path="/register" element={<Registerpage />} />
            <Route path="/logout" element={<Logout />} />

            {/* User Routes */}
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <Home />
                    <ShopMateChatbot />
                  </>
                </ProtectedRoute>
              }
            />

            <Route
              path="/product/:id"
              element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <ProductDetails />
                    <ShopMateChatbot />
                  </>
                </ProtectedRoute>
              }
            />

            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <Cart />
                    <ShopMateChatbot />
                  </>
                </ProtectedRoute>
              }
            />

            <Route
              path="/semantic-search"
              element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <SemanticSearch />
                    <ShopMateChatbot />
                  </>
                </ProtectedRoute>
              }
            />

            {/* Admin Route */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <>
                    <Navbar />
                    <AdminDashboard />
                  </>
                </ProtectedRoute>
              }
            />
          </Routes>

        </div>
      </Router>
    </ShopProvider>
  );
}
export default App;