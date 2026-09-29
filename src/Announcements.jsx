import {
  Plus,
  Megaphone,
} from "lucide-react";

import AdminLayout from "./AdminLayout";

function Announcements() {
  return (
    <AdminLayout
      title="Announcements"
      breadcrumb="SKUL / Announcements"
    >
      <div className="module-header">
        <div>
          <h2>Announcements</h2>
          <p>
            Create and manage school announcements.
          </p>
        </div>

        <button className="primary-button">
          <Plus size={17} />
          New Announcement
        </button>
      </div>

      <div className="announcement-layout">
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-title">
              <div className="card-icon">
                <Megaphone size={21} />
              </div>

              <div>
                <h3>Create Announcement</h3>
                <p>Prepare an announcement for delivery.</p>
              </div>
            </div>
          </div>

          <div className="announcement-form">
            <label>
              Title
              <input placeholder="Announcement title" />
            </label>

            <label>
              Message
              <textarea
                rows="6"
                placeholder="Write announcement..."
              />
            </label>

            <label>
              Audience
              <select defaultValue="">
                <option value="" disabled>
                  Select audience
                </option>
                <option>Students</option>
                <option>Teachers</option>
                <option>Parents</option>
                <option>All</option>
              </select>
            </label>

            <button className="primary-button">
              Publish Announcement
            </button>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-title">
              <div className="card-icon">
                <Megaphone size={21} />
              </div>

              <div>
                <h3>Published Announcements</h3>
                <p>Previously published announcements.</p>
              </div>
            </div>
          </div>

          <div className="empty-module-small">
            No announcements published yet.
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default Announcements;