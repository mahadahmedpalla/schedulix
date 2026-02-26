import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CalendarView } from "./views/CalendarView.tsx";
import { AdminDashboard } from "./views/AdminDashboard.tsx";
import { Login } from "./views/Login.tsx";
import { Signup } from "./views/Signup.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<CalendarView />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
