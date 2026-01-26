import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import ClinicLogin from "./components/Login/ClinicLogin";
import DashboardLayout from "./components/Dashboard/DashboardLayout";
import ProtectedRoute from "./routes/ProtectedRoute";

import DashboardLyout from "./components/Dashboard/DashboardLayout";
// import Patients from "./pages/Dashboard/Patients";
// import Cases from "./pages/Dashboard/Cases";
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
          {/* <Route path="patients" element={<Patients />} />
          <Route path="cases" element={<Cases />} />
          <Route path="laboratory" element={<Laboratory />} />
          <Route path="payments" element={<Payments />} /> */}
          <Route path="staff" element={<Staff />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
