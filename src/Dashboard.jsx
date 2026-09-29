import {
  Users,
  UserRoundCog,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

import AdminLayout from "./AdminLayout";

function TrendChart({ direction = "up" }) {
  const points =
    direction === "up"
      ? "0,62 30,58 60,61 90,48 120,52 150,39 180,42 210,27 240,31 270,16 300,21"
      : "0,18 30,22 60,19 90,32 120,28 150,40 180,37 210,49 240,45 270,58 300,53";

  return (
    <svg
      className="trend-chart"
      viewBox="0 0 300 70"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  direction = "up",
  percentage = "0%",
}) {
  const growing = direction === "up";

  return (
    <div className="dashboard-stat-card">
      <div className="stat-card-top">
        <div>
          <span className="stat-label">{title}</span>
          <strong className="stat-number">{value}</strong>
        </div>

        <div
          className={`trend-badge ${
            growing ? "trend-up" : "trend-down"
          }`}
        >
          {growing ? (
            <ArrowUpRight size={16} />
          ) : (
            <ArrowDownRight size={16} />
          )}

          {percentage}
        </div>
      </div>

      <div
        className={`chart-wrapper ${
          growing ? "chart-up" : "chart-down"
        }`}
      >
        <TrendChart direction={direction} />
      </div>

      <div className="stat-footer">
        <span>Previous period</span>

        <span
          className={
            growing ? "positive-text" : "negative-text"
          }
        >
          {growing ? "Growing" : "Declining"}
        </span>
      </div>
    </div>
  );
}

function Dashboard() {
  return (
    <AdminLayout
      title="Dashboard"
      breadcrumb="SKUL / Dashboard"
    >
      <div className="dashboard-stats-grid">
        <StatCard
          title="Total Students"
          value="0"
          icon={Users}
          direction="up"
          percentage="0%"
        />

        <StatCard
          title="Total Staff"
          value="0"
          icon={UserRoundCog}
          direction="up"
          percentage="0%"
        />

        <StatCard
          title="Active Classes"
          value="0"
          icon={BookOpen}
          direction="up"
          percentage="0%"
        />

        <StatCard
          title="Attendance"
          value="0%"
          icon={ClipboardCheck}
          direction="up"
          percentage="0%"
        />
      </div>

      <div className="dashboard-card">
        <div className="card-header">
          <div className="card-title">
            <div className="card-icon">
              <GraduationCap size={21} />
            </div>

            <div>
              <h3>Results & Performance</h3>
              <p>School-wide academic performance summary</p>
            </div>
          </div>
        </div>

        <div className="performance-summary">
          <div className="performance-number">
            <span>Overall Performance</span>
            <strong>0%</strong>
          </div>

          <div className="performance-chart">
            <TrendChart direction="up" />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default Dashboard;