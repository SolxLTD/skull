import AdminLayout from "./AdminLayout";

function Settings() {
  return (
    <AdminLayout
      title="Settings"
      breadcrumb="SKUL / Settings"
    >
      <div className="module-header">
        <div>
          <h2>School Settings</h2>
          <p>
            Configure your school's SKUL environment.
          </p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-title">
              <div>
                <h3>School Information</h3>
                <p>Basic information about the school.</p>
              </div>
            </div>
          </div>

          <div className="settings-form">
            <label>
              School Name
              <input placeholder="School name" />
            </label>

            <label>
              School Address
              <input placeholder="School address" />
            </label>

            <label>
              Country
              <input placeholder="Country" />
            </label>

            <button className="primary-button">
              Save Changes
            </button>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-title">
              <div>
                <h3>Academic Configuration</h3>
                <p>
                  Academic year, terms and grading configuration.
                </p>
              </div>
            </div>
          </div>

          <div className="settings-form">
            <label>
              Academic Year
              <input placeholder="2026/2027" />
            </label>

            <label>
              Number of Terms
              <input type="number" placeholder="3" />
            </label>

            <button className="primary-button">
              Save Academic Settings
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default Settings;