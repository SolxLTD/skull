import {
  Search,
  GraduationCap,
} from "lucide-react";

import AdminLayout from "./AdminLayout";

function ResultsPerformance() {
  return (
    <AdminLayout
      title="Results & Performance"
      breadcrumb="SKUL / Results & Performance"
    >
      <div className="module-header">
        <div>
          <h2>Results & Performance</h2>
          <p>
            View accumulated academic results and student performance.
          </p>
        </div>
      </div>

      <div className="module-stats">
        <div className="mini-stat">
          <span>Academic Records</span>
          <strong>0</strong>
        </div>

        <div className="mini-stat">
          <span>Students With Results</span>
          <strong>0</strong>
        </div>

        <div className="mini-stat">
          <span>Average Performance</span>
          <strong>0%</strong>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={17} />
            <input placeholder="Search student or subject..." />
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th>Subject</th>
                <th>Score</th>
                <th>Grade</th>
                <th>Academic Year</th>
                <th>Term</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td colSpan="7" className="empty-table">
                  No academic results available yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="dashboard-card performance-summary-card">
        <div className="card-header">
          <div className="card-title">
            <div className="card-icon">
              <GraduationCap size={21} />
            </div>

            <div>
              <h3>Performance Overview</h3>
              <p>School-wide performance trend.</p>
            </div>
          </div>
        </div>

        <div className="performance-chart large">
          <span>No performance data available yet.</span>
        </div>
      </div>
    </AdminLayout>
  );
}

export default ResultsPerformance;