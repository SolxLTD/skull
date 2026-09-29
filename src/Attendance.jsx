import {
  Search,
  Users,
  UserRoundCog,
} from "lucide-react";

import AdminLayout from "./AdminLayout";

function Attendance() {
  return (
    <AdminLayout
      title="Attendance"
      breadcrumb="SKUL / Attendance"
    >
      <div className="module-header">
        <div>
          <h2>Attendance</h2>
          <p>View and manage student and staff attendance.</p>
        </div>
      </div>

      <div className="module-stats">
        <div className="mini-stat">
          <span>Student Attendance</span>
          <strong>0%</strong>
        </div>

        <div className="mini-stat">
          <span>Staff Attendance</span>
          <strong>0%</strong>
        </div>

        <div className="mini-stat">
          <span>Absent Today</span>
          <strong>0</strong>
        </div>
      </div>

      <div className="attendance-tabs">
        <button className="active">
          <Users size={17} />
          Student Attendance
        </button>

        <button>
          <UserRoundCog size={17} />
          Staff Attendance
        </button>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={17} />
            <input placeholder="Search record..." />
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Class/Department</th>
                <th>Date</th>
                <th>Status</th>
                <th>Attendance %</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td colSpan="6" className="empty-table">
                  No attendance records available yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

export default Attendance;