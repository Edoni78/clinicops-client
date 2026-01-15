import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import ClinicLogin from "./components/Login/ClinicLogin";
import DashboardLayout from "./components/Dashboard/DashboardLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<ClinicLogin />} />
        <Route path="/dashboard" element={<DashboardLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
