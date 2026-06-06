import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';

// Pages
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { MovieDetails } from './pages/MovieDetails';
import { SeatSelection } from './pages/SeatSelection';
import { PaymentCallback } from './pages/PaymentCallback';
import { BookingHistory } from './pages/BookingHistory';
import { AdminDashboard } from './pages/AdminDashboard';

export const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
          
          {/* Header */}
          <Navbar />
          
          {/* Main content frame */}
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/movies/:id" element={<MovieDetails />} />
              <Route path="/showtimes/:id" element={<SeatSelection />} />
              
              {/* Authenticated Customer Routes */}
              <Route 
                path="/payment-callback" 
                element={
                  <ProtectedRoute>
                    <PaymentCallback />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/history" 
                element={
                  <ProtectedRoute>
                    <BookingHistory />
                  </ProtectedRoute>
                } 
              />

              {/* Administrative Routes */}
              <Route 
                path="/admin" 
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } 
              />

              {/* Catch-all Fallback */}
              <Route path="*" element={<Home />} />
            </Routes>
          </main>
          
          {/* Footer */}
          <Footer />

        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
