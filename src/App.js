import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import ClinicLogin from "./components/Login/ClinicLogin";
import DashboardLayout from "./components/Dashboard/DashboardLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import Patients from "./pages/Dashboard/Patients";
import PatientsList from "./pages/Dashboard/PatientsList";
import DashboardHome from "./pages/Dashboard/DashboardHome";
import Cases from "./pages/Dashboard/Cases/Cases";
import CaseDetail from "./pages/Dashboard/Cases/CaseDetail";
import Reports from "./pages/Dashboard/Reports/Reports";
// import Laboratory from "./pages/Dashboard/Laboratory";
// import Payments from "./pages/Dashboard/Payments";
import Staff from "./components/Dashboard/Staff/Staff";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<ClinicLogin />} />

        {/* PROTECTED DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="patients" element={<Patients />} />
          <Route path="patients-list" element={<PatientsList />} />
          <Route path="cases" element={<Cases />} />
          <Route path="cases/:id" element={<CaseDetail />} />
          <Route path="reports" element={<Reports />} />
          {/* <Route path="laboratory" element={<Laboratory />} />
          <Route path="payments" element={<Payments />} /> */}
          <Route path="staff" element={<Staff />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
