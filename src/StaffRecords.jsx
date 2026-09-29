import {
  Upload,
  UserPlus,
  Search,
  Pencil,
  Eye,
} from "lucide-react";

import AdminLayout from "./AdminLayout";

function StaffRecords() {
  return (
    <AdminLayout
      title="Staff Records"
      breadcrumb="SKUL / Staff Records"
    >
      <div className="module-header">
        <div>
          <h2>Staff Records</h2>
          <p>View, upload and manage all school staff.</p>
        </div>

        <div className="module-actions">
          <button className="secondary-button">
            <Upload size={17} />
            Upload Staff Records
          </button>

          <button className="primary-button">
            <UserPlus size={17} />
            Add Staff
          </button>
        </div>
      </div>

      <div className="module-stats">
        <div className="mini-stat">
          <span>Total Staff</span>
          <strong>0</strong>
        </div>

        <div className="mini-stat">
          <span>Teaching Staff</span>
          <strong>0</strong>
        </div>

        <div className="mini-stat">
          <span>Non-Teaching Staff</span>
          <strong>0</strong>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={17} />
            <input placeholder="Search staff..." />
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Staff ID</th>
                <th>Name</th>
                <th>Position</th>
                <th>Department</th>
                <th>Salary</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td colSpan="7" className="empty-table">
                  No staff records available yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

export default StaffRecords;