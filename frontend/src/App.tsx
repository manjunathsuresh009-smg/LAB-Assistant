import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { ProtectedRoute, RoleRoute } from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Equipment from "./pages/Equipment";
import EquipmentDetail from "./pages/EquipmentDetail";
import MyBookings from "./pages/MyBookings";
import AIAssistant from "./pages/AIAssistant";
import FacultyApprovals from "./pages/FacultyApprovals";
import ConflictResolver from "./pages/ConflictResolver";
import Analytics from "./pages/Analytics";
import AdminEquipment from "./pages/AdminEquipment";
import AdminUsers from "./pages/AdminUsers";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/equipment" element={<Equipment />} />
        <Route path="/equipment/:id" element={<EquipmentDetail />} />
        <Route path="/bookings" element={<MyBookings />} />
        <Route path="/assistant" element={<AIAssistant />} />
        <Route
          path="/faculty"
          element={
            <RoleRoute roles={["FACULTY", "ADMIN"]}>
              <FacultyApprovals />
            </RoleRoute>
          }
        />
        <Route
          path="/conflicts"
          element={
            <RoleRoute roles={["FACULTY", "ADMIN"]}>
              <ConflictResolver />
            </RoleRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <RoleRoute roles={["FACULTY", "ADMIN"]}>
              <Analytics />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/equipment"
          element={
            <RoleRoute roles={["ADMIN"]}>
              <AdminEquipment />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RoleRoute roles={["ADMIN"]}>
              <AdminUsers />
            </RoleRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
