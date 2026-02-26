import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CalendarView } from "./views/CalendarView.tsx";
import { AdminDashboard } from "./views/AdminDashboard.tsx";
import { Login } from "./views/Login.tsx";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CalendarView />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}
