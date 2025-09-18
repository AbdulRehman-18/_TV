import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Login } from '@/pages/Login';
import { Admin } from '@/pages/Admin';
import { Display } from '@/pages/Display';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/display" element={<Display />} />
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/display" replace />} />
      </Routes>
    </Router>
  );
}

export default App;