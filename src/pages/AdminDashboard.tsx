import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import Dashboard from "./admin/Dashboard";
import Clientes from "./admin/Clientes";
import Assinaturas from "./admin/Assinaturas";
import Pagamentos from "./admin/Pagamentos";
import Analytics from "./admin/Analytics";
import Configuracoes from "./admin/Configuracoes";

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/assinaturas" element={<Assinaturas />} />
        <Route path="/pagamentos" element={<Pagamentos />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminDashboard;
