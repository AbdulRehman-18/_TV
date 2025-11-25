import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ClientProtectedRoute } from '@/components/ClientProtectedRoute';
import { Landing } from '@/pages/Landing';
import { Login } from '@/pages/Login';
import { Admin } from '@/pages/Admin';
import { Client } from '@/pages/Client';
import { Display } from '@/pages/Display';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/landing" element={<Landing />} />
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
        <Route
          path="/client/*"
          element={
            <ClientProtectedRoute>
              <Client />
            </ClientProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;