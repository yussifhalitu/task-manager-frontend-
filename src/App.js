import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function App() {
  // Load dark mode preference from localStorage
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true'
  );

  useEffect(() => {
    // Save preference and apply to body
    localStorage.setItem('darkMode', darkMode);
    document.body.className = darkMode ? 'dark' : '';
  }, [darkMode]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          success: { duration: 3000 },
          error:   { duration: 4000 },
        }}
      />
      <Routes>
        <Route path="/login"    element={<Login darkMode={darkMode} setDarkMode={setDarkMode} />} />
        <Route path="/register" element={<Register darkMode={darkMode} setDarkMode={setDarkMode} />} />
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard darkMode={darkMode} setDarkMode={setDarkMode} />
          </PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;