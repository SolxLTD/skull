import {
  Search,
  CreditCard,
  Plus,
} from "lucide-react";

import AdminLayout from "./AdminLayout";

function FeesPayments() {
  return (
    <AdminLayout
      title="Fees & Payments"
      breadcrumb="SKUL / Fees & Payments"
    >
      <div className="module-header">
        <div>
          <h2>Fees & Payments</h2>
          <p>
            Manage school fees, payments, balances and payment history.
          </p>
        </div>

        <button className="primary-button">
          <Plus size={17} />
          Record Payment
        </button>
      </div>

      <div className="module-stats">
        <div className="mini-stat">
          <span>Total Expected</span>
          <strong>₦0</strong>
        </div>

        <div className="mini-stat">
          <span>Total Paid</span>
          <strong>₦0</strong>
        </div>

        <div className="mini-stat">
          <span>Outstanding</span>
          <strong>₦0</strong>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={17} />
            <input placeholder="Search payment record..." />
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Fee Type</th>
                <th>Amount Due</th>
                <th>Amount Paid</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Payment Date</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td colSpan="7" className="empty-table">
                  No payment records available yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

export default FeesPayments;