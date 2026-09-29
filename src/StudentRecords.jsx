import { useEffect, useRef, useState } from "react";
import {
  Upload,
  UserPlus,
  Search,
  Pencil,
  Eye,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  X,
  LoaderCircle,
  Database,
  ArrowRight,
} from "lucide-react";
import * as XLSX from "xlsx";

import AdminLayout from "./AdminLayout";

const API_URL = "http://localhost:5000";

function StudentRecords() {
  const fileInputRef = useRef(null);

  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({
    total_students: 0,
    active_students: 0,
    total_classes: 0,
  });

  const [search, setSearch] = useState("");

  const [loadingStudents, setLoadingStudents] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [committing, setCommitting] = useState(false);

  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState("");

  const [showImportModal, setShowImportModal] = useState(false);

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const [studentForm, setStudentForm] = useState({
    student_id: "",
    student_name: "",
    gender: "",
    class_name: "",
    academic_year: "",
    days_present: "",
    total_school_days: "",
    attendance_percentage: "",
    average_score: "",
    overall_grade: "",
    result_status: "Active",
  });

  // ============================================================
  // LOAD STUDENTS
  // ============================================================

  async function loadStudents() {
    setLoadingStudents(true);

    try {
      const response = await fetch(`${API_URL}/api/students`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load students."
        );
      }

      setStudents(data.students || []);
    } catch (error) {
      console.error("Student loading error:", error);
    } finally {
      setLoadingStudents(false);
    }
  }

  // ============================================================
  // LOAD STATISTICS
  // ============================================================

  async function loadStats() {
    try {
      const response = await fetch(`${API_URL}/api/dashboard`);

      const data = await response.json();

      if (!response.ok) {
        return;
      }

      const statistics = data.statistics || {};

      setStats({
        total_students:
          Number(statistics.total_students) || 0,

        active_students:
          Number(statistics.total_students) || 0,

        total_classes:
          Number(statistics.total_classes) || 0,
      });
    } catch (error) {
      console.error("Statistics loading error:", error);
    }
  }

  useEffect(() => {
    loadStudents();
    loadStats();
  }, []);

  // ============================================================
  // OPEN FILE SELECTOR
  // ============================================================

  function openFileSelector() {
    setImportError("");

    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  // ============================================================
  // READ EXCEL / CSV
  // ============================================================

  async function readSpreadsheet(file) {
    const buffer = await file.arrayBuffer();

    const workbook = XLSX.read(buffer, {
      type: "array",
      cellDates: true,
    });

    if (!workbook.SheetNames.length) {
      throw new Error(
        "The uploaded spreadsheet does not contain a worksheet."
      );
    }

    const firstSheet =
      workbook.Sheets[workbook.SheetNames[0]];

    const rows = XLSX.utils.sheet_to_json(firstSheet, {
      defval: "",
      raw: false,
    });

    if (!rows.length) {
      throw new Error(
        "The uploaded file does not contain any records."
      );
    }

    return rows;
  }

  // ============================================================
  // UPLOAD + INTELLIGENCE ANALYSIS
  // ============================================================

  async function handleFileSelected(event) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    const extension =
      file.name.split(".").pop()?.toLowerCase();

    if (!["csv", "xlsx", "xls"].includes(extension)) {
      setImportError(
        "For this import step, please select a CSV, XLSX or XLS file."
      );

      setShowImportModal(true);

      return;
    }

    setUploading(true);
    setImportError("");
    setImportResult(null);
    setShowImportModal(true);

    try {
      const rows = await readSpreadsheet(file);

      const response = await fetch(
        `${API_URL}/api/import/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filename: file.name,
            rows,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "SKUL could not analyze the uploaded file."
        );
      }

      setImportResult({
        ...data,
        filename: file.name,
      });
    } catch (error) {
      console.error("Import analysis error:", error);

      setImportError(
        error.message ||
          "Unable to analyze the uploaded file."
      );
    } finally {
      setUploading(false);
    }
  }

  // ============================================================
  // COMMIT IMPORT TO POSTGRESQL
  // ============================================================

  async function commitImport() {
    if (!importResult?.batch_id) {
      setImportError(
        "There is no analyzed import available to save."
      );

      return;
    }

    setCommitting(true);
    setImportError("");

    try {
      const response = await fetch(
        `${API_URL}/api/import/${importResult.batch_id}/commit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "SKUL could not save the imported records."
        );
      }

      setImportResult((previous) => ({
        ...previous,
        committed: true,
        commitStatistics:
          data.statistics || {},
        commitMessage:
          data.message ||
          "School records successfully imported.",
      }));

      await loadStudents();
      await loadStats();
    } catch (error) {
      console.error("Import commit error:", error);

      setImportError(
        error.message ||
          "Unable to save the imported records."
      );
    } finally {
      setCommitting(false);
    }
  }

  // ============================================================
  // ADD STUDENT
  // ============================================================

  function openAddStudent() {
    setEditingStudent(null);

    setStudentForm({
      student_id: "",
      student_name: "",
      gender: "",
      class_name: "",
      academic_year: new Date()
        .getFullYear()
        .toString(),
      days_present: "",
      total_school_days: "",
      attendance_percentage: "",
      average_score: "",
      overall_grade: "",
      result_status: "Active",
    });

    setShowStudentModal(true);
  }

  // ============================================================
  // EDIT STUDENT
  // ============================================================

  function openEditStudent(student) {
    setEditingStudent(student);

    setStudentForm({
      student_id: student.student_id || "",
      student_name: student.student_name || "",
      gender: student.gender || "",
      class_name: student.class_name || "",
      academic_year:
        student.academic_year || "",
      days_present:
        student.days_present ?? "",
      total_school_days:
        student.total_school_days ?? "",
      attendance_percentage:
        student.attendance_percentage ?? "",
      average_score:
        student.average_score ?? "",
      overall_grade:
        student.overall_grade || "",
      result_status:
        student.result_status || "Active",
    });

    setShowStudentModal(true);
  }

  // ============================================================
  // FORM CHANGE
  // ============================================================

  function handleStudentFormChange(event) {
    const { name, value } = event.target;

    setStudentForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // ============================================================
  // SAVE STUDENT
  // ============================================================

  async function saveStudent(event) {
    event.preventDefault();

    if (!studentForm.student_name.trim()) {
      alert("Student name is required.");

      return;
    }

    try {
      const url = editingStudent
        ? `${API_URL}/api/students/${editingStudent.id}`
        : `${API_URL}/api/students`;

      const method = editingStudent
        ? "PUT"
        : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(studentForm),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to save student."
        );
      }

      setShowStudentModal(false);

      await loadStudents();
      await loadStats();
    } catch (error) {
      console.error("Student save error:", error);

      alert(
        error.message ||
          "Unable to save student."
      );
    }
  }

  // ============================================================
  // FILTER STUDENTS
  // ============================================================

  const filteredStudents = students.filter(
    (student) => {
      const searchText =
        search.trim().toLowerCase();

      if (!searchText) {
        return true;
      }

      return (
        String(student.student_id || "")
          .toLowerCase()
          .includes(searchText) ||
        String(student.student_name || "")
          .toLowerCase()
          .includes(searchText) ||
        String(student.class_name || "")
          .toLowerCase()
          .includes(searchText)
      );
    }
  );

  const analysis =
    importResult?.analysis || null;

  const mappings =
    analysis?.mappings || [];

  const mappedFields = mappings.filter(
    (mapping) =>
      mapping.source_column &&
      Number(mapping.confidence) > 0
  );

  // ============================================================
  // UI
  // ============================================================

  return (
    <AdminLayout
      title="Student Records"
      breadcrumb="SKUL / Student Records"
    >
      <div className="module-header">
        <div>
          <h2>Student Records</h2>

          <p>
            View, add, upload and manage student
            records.
          </p>
        </div>

        <div className="module-actions">
          <button
            className="secondary-button"
            onClick={openFileSelector}
            disabled={uploading}
          >
            {uploading ? (
              <LoaderCircle
                size={17}
                className="spin"
              />
            ) : (
              <Upload size={17} />
            )}

            {uploading
              ? "Analyzing..."
              : "Upload Student Records"}
          </button>

          <button
            className="primary-button"
            onClick={openAddStudent}
          >
            <UserPlus size={17} />

            Add Student
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelected}
            style={{ display: "none" }}
          />
        </div>
      </div>

      <div className="module-stats">
        <div className="mini-stat">
          <span>Total Students</span>

          <strong>
            {stats.total_students}
          </strong>
        </div>

        <div className="mini-stat">
          <span>Active Students</span>

          <strong>
            {stats.active_students}
          </strong>
        </div>

        <div className="mini-stat">
          <span>Classes</span>

          <strong>
            {stats.total_classes}
          </strong>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={17} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search student..."
            />
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Class</th>
                <th>Gender</th>
                <th>Performance</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loadingStudents ? (
                <tr>
                  <td
                    colSpan="7"
                    className="empty-table"
                  >
                    <LoaderCircle
                      size={20}
                      className="spin"
                    />

                    Loading student records...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="empty-table"
                  >
                    No student records available yet.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(
                  (student) => (
                    <tr key={student.id}>
                      <td>
                        {student.student_id ||
                          "—"}
                      </td>

                      <td>
                        <strong>
                          {student.student_name}
                        </strong>
                      </td>

                      <td>
                        {student.class_name ||
                          "—"}
                      </td>

                      <td>
                        {student.gender ||
                          "—"}
                      </td>

                      <td>
                        {student.average_score !==
                        null &&
                        student.average_score !==
                          undefined
                          ? `${Number(
                              student.average_score
                            ).toFixed(1)}%`
                          : "—"}
                      </td>

                      <td>
                        <span
                          className="status-badge"
                        >
                          {student.result_status ||
                            "Active"}
                        </span>
                      </td>

                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                          }}
                        >
                          <button
                            className="secondary-button"
                            onClick={() =>
                              openEditStudent(
                                student
                              )
                            }
                            title="Edit student"
                          >
                            <Pencil
                              size={15}
                            />

                            Edit
                          </button>

                          <button
                            className="secondary-button"
                            title="View student"
                          >
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================
          IMPORT ANALYSIS MODAL
      ======================================================= */}

      {showImportModal && (
        <div
          className="modal-overlay"
          onClick={() =>
            !committing &&
            setShowImportModal(false)
          }
        >
          <div
            className="modal"
            style={{
              maxWidth: "900px",
              width: "94%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <h2>
                  {importResult?.committed
                    ? "Import Completed"
                    : "SKUL Intelligence Analysis"}
                </h2>

                <p
                  style={{
                    marginTop: "6px",
                    color: "#627d98",
                  }}
                >
                  {importResult?.filename ||
                    "Student records"}
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  !committing &&
                  setShowImportModal(false)
                }
              >
                <X size={20} />
              </button>
            </div>

            {importError && (
              <div
                className="alert alert-danger"
                style={{
                  marginBottom: "20px",
                }}
              >
                <AlertTriangle
                  size={18}
                />

                <span>{importError}</span>
              </div>
            )}

            {uploading && (
              <div
                style={{
                  padding: "35px 20px",
                  textAlign: "center",
                }}
              >
                <LoaderCircle
                  size={38}
                  className="spin"
                />

                <h3>
                  SKUL is analyzing the file...
                </h3>

                <p>
                  Detecting columns, records,
                  classes and academic information.
                </p>
              </div>
            )}

            {!uploading &&
              importResult &&
              analysis && (
                <>
                  {/* SUMMARY */}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(3, 1fr)",
                      gap: "12px",
                      marginBottom: "24px",
                    }}
                  >
                    <div className="mini-stat">
                      <span>
                        Records detected
                      </span>

                      <strong>
                        {analysis.file
                          ?.total_rows || 0}
                      </strong>
                    </div>

                    <div className="mini-stat">
                      <span>
                        Unique students
                      </span>

                      <strong>
                        {analysis.structure
                          ?.unique_students || 0}
                      </strong>
                    </div>

                    <div className="mini-stat">
                      <span>
                        Classes detected
                      </span>

                      <strong>
                        {analysis.structure
                          ?.unique_classes || 0}
                      </strong>
                    </div>
                  </div>

                  {/* COUNTRY */}

                  {analysis
                    .country_detection
                    ?.country && (
                    <div
                      className="alert alert-info"
                      style={{
                        marginBottom: "20px",
                      }}
                    >
                      <Database
                        size={18}
                      />

                      <span>
                        Detected education
                        context:{" "}
                        <strong>
                          {
                            analysis
                              .country_detection
                              .country
                          }
                        </strong>{" "}
                        (
                        {
                          analysis
                            .country_detection
                            .confidence
                        }
                        % confidence)
                      </span>
                    </div>
                  )}

                  {/* MAPPING */}

                  <div
                    style={{
                      marginBottom: "24px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <h3>
                        Column Mapping
                      </h3>

                      <span
                        style={{
                          color: "#16a34a",
                          fontWeight: 700,
                        }}
                      >
                        {mappedFields.length}{" "}
                        fields detected
                      </span>
                    </div>

                    <div
                      style={{
                        border:
                          "1px solid #dbe7f3",
                        borderRadius: "12px",
                        overflow: "hidden",
                      }}
                    >
                      {mappings.map(
                        (mapping) => (
                          <div
                            key={
                              mapping.target_field
                            }
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "1fr 35px 1fr 90px",
                              gap: "12px",
                              alignItems:
                                "center",
                              padding:
                                "13px 16px",
                              borderBottom:
                                "1px solid #edf2f7",
                            }}
                          >
                            <span>
                              {mapping.source_column ||
                                "Not found"}
                            </span>

                            <ArrowRight
                              size={16}
                              color="#627d98"
                            />

                            <span>
                              {mapping.target_field}
                            </span>

                            <strong
                              style={{
                                color:
                                  mapping.confidence >=
                                  85
                                    ? "#16a34a"
                                    : "#d97706",
                              }}
                            >
                              {
                                mapping.confidence
                              }
                              %
                            </strong>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* ISSUES */}

                  {analysis.issues?.length >
                    0 && (
                    <div
                      className="alert alert-warning"
                      style={{
                        marginBottom: "20px",
                      }}
                    >
                      <AlertTriangle
                        size={18}
                      />

                      <div>
                        <strong>
                          {analysis.issues.length}{" "}
                          issue(s) detected
                        </strong>

                        <p
                          style={{
                            margin:
                              "4px 0 0",
                          }}
                        >
                          Review the mapping and
                          source file before
                          importing.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* COMMITTED */}

                  {importResult.committed ? (
                    <div
                      className="alert alert-success"
                      style={{
                        display: "flex",
                        alignItems:
                          "flex-start",
                        gap: "12px",
                      }}
                    >
                      <CheckCircle
                        size={22}
                      />

                      <div>
                        <strong>
                          Records successfully
                          saved to PostgreSQL.
                        </strong>

                        <p
                          style={{
                            margin:
                              "6px 0 0",
                          }}
                        >
                          {importResult
                            .commitMessage ||
                            "The imported records are now part of SKUL."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "flex-end",
                        gap: "10px",
                        marginTop: "20px",
                      }}
                    >
                      <button
                        className="secondary-button"
                        onClick={() =>
                          setShowImportModal(
                            false
                          )
                        }
                        disabled={committing}
                      >
                        Cancel
                      </button>

                      <button
                        className="primary-button"
                        onClick={commitImport}
                        disabled={committing}
                      >
                        {committing ? (
                          <>
                            <LoaderCircle
                              size={17}
                              className="spin"
                            />

                            Saving to
                            PostgreSQL...
                          </>
                        ) : (
                          <>
                            <CheckCircle
                              size={17}
                            />

                            Import Records
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
          </div>
        </div>
      )}

      {/* ======================================================
          ADD / EDIT STUDENT MODAL
      ======================================================= */}

      {showStudentModal && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShowStudentModal(false)
          }
        >
          <div
            className="modal"
            style={{
              maxWidth: "760px",
              width: "94%",
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <h2>
                  {editingStudent
                    ? "Edit Student"
                    : "Register Student"}
                </h2>

                <p
                  style={{
                    marginTop: "6px",
                    color: "#627d98",
                  }}
                >
                  Student identity and academic
                  record
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setShowStudentModal(false)
                }
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveStudent}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, 1fr)",
                  gap: "16px",
                }}
              >
                <label>
                  <strong>Student ID</strong>

                  <input
                    name="student_id"
                    value={
                      studentForm.student_id
                    }
                    onChange={
                      handleStudentFormChange
                    }
                    placeholder="Leave empty to generate"
                    disabled={Boolean(
                      editingStudent
                    )}
                    style={{
                      width: "100%",
                      padding: "11px",
                      marginTop: "6px",
                      border:
                        "1px solid #dbe7f3",
                      borderRadius: "8px",
                    }}
                  />
                </label>

                <label>
                  <strong>Student Name *</strong>

                  <input
                    name="student_name"
                    value={
                      studentForm.student_name
                    }
                    onChange={
                      handleStudentFormChange
                    }
                    required
                    placeholder="Full name"
                    style={{
                      width: "100%",
                      padding: "11px",
                      marginTop: "6px",
                      border:
                        "1px solid #dbe7f3",
                      borderRadius: "8px",
                    }}
                  />
                </label>

                <label>
                  <strong>Gender</strong>

                  <select
                    name="gender"
                    value={studentForm.gender}
                    onChange={
                      handleStudentFormChange
                    }
                    style={{
                      width: "100%",
                      padding: "11px",
                      marginTop: "6px",
                      border:
                        "1px solid #dbe7f3",
                      borderRadius: "8px",
                    }}
                  >
                    <option value="">
                      Select gender
                    </option>

                    <option value="Male">
                      Male
                    </option>

                    <option value="Female">
                      Female
                    </option>
                  </select>
                </label>

                <label>
                  <strong>Class</strong>

                  <input
                    name="class_name"
                    value={
                      studentForm.class_name
                    }
                    onChange={
                      handleStudentFormChange
                    }
                    placeholder="e.g. JSS 1"
                    style={{
                      width: "100%",
                      padding: "11px",
                      marginTop: "6px",
                      border:
                        "1px solid #dbe7f3",
                      borderRadius: "8px",
                    }}
                  />
                </label>

                <label>
                  <strong>Academic Year</strong>

                  <input
                    name="academic_year"
                    value={
                      studentForm.academic_year
                    }
                    onChange={
                      handleStudentFormChange
                    }
                    placeholder="2026"
                    style={{
                      width: "100%",
                      padding: "11px",
                      marginTop: "6px",
                      border:
                        "1px solid #dbe7f3",
                      borderRadius: "8px",
                    }}
                  />
                </label>

                <label>
                  <strong>Status</strong>

                  <select
                    name="result_status"
                    value={
                      studentForm.result_status
                    }
                    onChange={
                      handleStudentFormChange
                    }
                    style={{
                      width: "100%",
                      padding: "11px",
                      marginTop: "6px",
                      border:
                        "1px solid #dbe7f3",
                      borderRadius: "8px",
                    }}
                  >
                    <option value="Active">
                      Active
                    </option>

                    <option value="Promoted">
                      Promoted
                    </option>

                    <option value="Graduated">
                      Graduated
                    </option>

                    <option value="Inactive">
                      Inactive
                    </option>
                  </select>
                </label>

                <label>
                  <strong>Average Score</strong>

                  <input
                    type="number"
                    step="0.01"
                    name="average_score"
                    value={
                      studentForm.average_score
                    }
                    onChange={
                      handleStudentFormChange
                    }
                    placeholder="0"
                    style={{
                      width: "100%",
                      padding: "11px",
                      marginTop: "6px",
                      border:
                        "1px solid #dbe7f3",
                      borderRadius: "8px",
                    }}
                  />
                </label>

                <label>
                  <strong>Overall Grade</strong>

                  <input
                    name="overall_grade"
                    value={
                      studentForm.overall_grade
                    }
                    onChange={
                      handleStudentFormChange
                    }
                    placeholder="A"
                    style={{
                      width: "100%",
                      padding: "11px",
                      marginTop: "6px",
                      border:
                        "1px solid #dbe7f3",
                      borderRadius: "8px",
                    }}
                  />
                </label>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "flex-end",
                  gap: "10px",
                  marginTop: "24px",
                }}
              >
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowStudentModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  <CheckCircle size={17} />

                  {editingStudent
                    ? "Save Changes"
                    : "Register Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default StudentRecords;