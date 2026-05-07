import { Routes, Route, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Login from "./pages/Login";
import GuestDashboard from "./pages/GuestDashboard";
import TableManagement from "./pages/TableManagement";
import TemplateStore from "./components/TemplateStore";
import CheckoutPage from "./components/CheckoutPage";

function App() {
  return (
    <Routes>
      {/* Existing routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/guests" element={<GuestDashboard />} />
      <Route path="/tables" element={<TableManagement />} />

      {/* Template Store routes */}
      <Route path="/templates" element={<TemplateStore />} />
      <Route path="/checkout" element={<CheckoutPage />} />

      {/* Redirect root to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* Catch all redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;