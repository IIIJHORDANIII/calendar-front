import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import Footer from './components/Footer';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Churches from './pages/Churches';
import Events from './pages/Events';
import Tithes from './pages/Tithes';
import Documentation from './pages/Documentation';
import ProtectedRoute from './components/ProtectedRoute';
import Members from './pages/Members';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <Routes>
          {/* Landing Page */}
          <Route path="/" element={
            <>
              <Header />
              <Hero />
              <Features />
              <Footer />
            </>
          } />
          
          {/* Auth Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Documentation */}
          <Route path="/documentation" element={<Documentation />} />
          
          {/* Protected Dashboard Pages */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/churches" element={
            <ProtectedRoute>
              <Churches />
            </ProtectedRoute>
          } />
          <Route path="/events" element={
            <ProtectedRoute>
              <Events />
            </ProtectedRoute>
          } />
          <Route path="/tithes" element={
            <ProtectedRoute>
              <Tithes />
            </ProtectedRoute>
          } />
          <Route path="/members" element={<Members />} />
        </Routes>
      </div>
    </Router>
    </ThemeProvider>
  );
}

export default App;
