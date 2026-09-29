import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./Dashboard";
import StudentRecords from "./StudentRecords";
import StaffRecords from "./StaffRecords";
import ClassesSubjects from "./ClassesSubjects";
import Attendance from "./Attendance";
import ResultsPerformance from "./ResultsPerformance";
import FeesPayments from "./FeesPayments";
import Announcements from "./Announcements";
import Settings from "./Settings";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />

        <Route
          path="/records"
          element={<StudentRecords />}
        />

        <Route
          path="/staff"
          element={<StaffRecords />}
        />

        <Route
          path="/classes"
          element={<ClassesSubjects />}
        />

        <Route
          path="/attendance"
          element={<Attendance />}
        />

        <Route
          path="/results"
          element={<ResultsPerformance />}
        />

        <Route
          path="/fees"
          element={<FeesPayments />}
        />

        <Route
          path="/announcements"
          element={<Announcements />}
        />

        <Route
          path="/settings"
          element={<Settings />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;