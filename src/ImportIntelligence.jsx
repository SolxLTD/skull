import {
  useEffect,
  useState,
} from "react";

import {
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Database,
  Globe2,
  ArrowRight,
  Loader2,
  UploadCloud,
} from "lucide-react";

import { useLocation, useNavigate } from "react-router-dom";


function ImportIntelligence() {

  const location = useLocation();

  const navigate = useNavigate();


  const [analysis, setAnalysis] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [committing, setCommitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [batchId, setBatchId] =
    useState(null);


  useEffect(() => {

    if (
      !location.state?.rows ||
      !location.state?.filename
    ) {

      setError(
        "No school record file was provided."
      );

      return;
    }


    analyzeFile(
      location.state.rows,
      location.state.filename
    );

  }, []);


  async function analyzeFile(
    rows,
    filename
  ) {

    setLoading(true);

    setError("");


    try {

      const response =
        await fetch(
          "http://localhost:5000/api/import/analyze",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              filename,
              rows,
            }),
          }
        );


      const result =
        await response.json();


      if (!response.ok) {

        throw new Error(
          result.message ||
          "Unable to analyze file."
        );
      }


      setAnalysis(
        result.analysis
      );

      setBatchId(
        result.batch_id
      );

    } catch (err) {

      setError(
        err.message
      );

    } finally {

      setLoading(false);

    }
  }


  async function approveImport() {

    if (!batchId) {
      return;
    }


    const confirmed =
      window.confirm(
        "Approve this import and permanently add the records to SKUL?"
      );


    if (!confirmed) {
      return;
    }


    setCommitting(true);

    setError("");


    try {

      const response =
        await fetch(
          `http://localhost:5000/api/import/${batchId}/commit`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },
          }
        );


      const result =
        await response.json();


      if (!response.ok) {

        throw new Error(
          result.message ||
          "Import failed."
        );
      }


      window.alert(
        `Import complete.\n\nStudents created: ${result.statistics.students_created}\nHistorical enrollment records: ${result.statistics.enrollment_records_created}\nAcademic records: ${result.statistics.academic_records_created}\nAttendance records: ${result.statistics.attendance_records_created}`
      );


      navigate("/");

    } catch (err) {

      setError(
        err.message
      );

    } finally {

      setCommitting(false);

    }
  }


  if (loading) {

    return (

      <div className="min-h-screen bg-slate-100 flex items-center justify-center">

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center">

          <Loader2
            size={40}
            className="animate-spin text-[#173B6C] mx-auto"
          />

          <h2 className="text-xl font-bold mt-5">
            SKUL is analyzing the file
          </h2>

          <p className="text-slate-500 mt-2">
            Detecting columns, students,
            academic history and missing information.
          </p>

        </div>

      </div>

    );
  }


  if (error && !analysis) {

    return (

      <div className="min-h-screen bg-slate-100 p-8">

        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-red-200 p-8">

          <div className="flex items-center gap-3 text-red-600">

            <AlertTriangle />

            <h2 className="text-xl font-bold">
              Import Intelligence Error
            </h2>

          </div>

          <p className="mt-4 text-slate-600">
            {error}
          </p>

          <button
            onClick={() =>
              navigate("/records")
            }
            className="mt-6 px-5 py-3 bg-[#173B6C] text-white rounded-lg font-semibold"
          >
            Return to Upload
          </button>

        </div>

      </div>

    );
  }


  return (

    <div className="min-h-screen bg-slate-100">

      {/* HEADER */}

      <header className="bg-white border-b border-slate-200 px-8 py-5">

        <div className="max-w-7xl mx-auto">

          <div className="flex items-center gap-3">

            <Database
              className="text-[#173B6C]"
              size={28}
            />

            <div>

              <h1 className="text-2xl font-bold text-slate-800">
                Import Intelligence
              </h1>

              <p className="text-sm text-slate-500">
                SKUL has analyzed your school record file.
              </p>

            </div>

          </div>

        </div>

      </header>


      <main className="max-w-7xl mx-auto p-8">

        {/* FILE SUMMARY */}

        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">

          <div className="flex items-center gap-4">

            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">

              <FileSpreadsheet
                className="text-[#173B6C]"
              />

            </div>

            <div>

              <h2 className="font-bold text-lg">
                {analysis.file.filename}
              </h2>

              <p className="text-sm text-slate-500">
                {analysis.file.columns.length}
                columns detected
              </p>

            </div>

          </div>

        </div>


        {/* STATISTICS */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">

          <SummaryCard
            title="Rows Analyzed"
            value={analysis.file.total_rows}
          />

          <SummaryCard
            title="Unique Students"
            value={analysis.structure.unique_students}
          />

          <SummaryCard
            title="Academic Years"
            value={analysis.structure.unique_years}
          />

          <SummaryCard
            title="Classes"
            value={analysis.structure.unique_classes}
          />

        </div>


        {/* COUNTRY */}

        <section className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">

          <div className="flex items-center gap-3 mb-5">

            <Globe2
              className="text-[#173B6C]"
            />

            <div>

              <h2 className="text-lg font-bold">
                School Context Detection
              </h2>

              <p className="text-sm text-slate-500">
                Country detection is a suggestion.
                The school administrator must confirm it.
              </p>

            </div>

          </div>


          {analysis.country_detection.country ? (

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-slate-500">
                    Suggested country
                  </p>

                  <p className="text-2xl font-bold text-[#173B6C]">
                    {analysis.country_detection.country}
                  </p>

                </div>

                <div className="text-right">

                  <p className="text-sm text-slate-500">
                    Confidence
                  </p>

                  <p className="text-xl font-bold">
                    {analysis.country_detection.confidence}%
                  </p>

                </div>

              </div>


              <p className="text-sm text-slate-600 mt-4">
                {analysis.country_detection.reason}
              </p>

            </div>

          ) : (

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">

              <p className="font-semibold text-amber-800">
                Country could not be reliably detected.
              </p>

              <p className="text-sm text-amber-700 mt-1">
                The administrator should select the
                school's country before curriculum and
                grading intelligence is activated.
              </p>

            </div>

          )}

        </section>


        {/* INTERPRETATION */}

        <section className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">

          <h2 className="text-lg font-bold mb-4">
            SKUL Interpretation
          </h2>

          <div className="bg-slate-50 rounded-xl p-5">

            <p className="text-slate-700">

              SKUL detected{" "}

              <strong>
                {analysis.structure.unique_students}
              </strong>

              {" "}unique students across{" "}

              <strong>
                {analysis.structure.unique_years}
              </strong>

              {" "}academic years.

            </p>


            <p className="text-slate-600 mt-3">

              This means repeated Student IDs should be
              treated as historical academic records,
              not as new students.

            </p>

          </div>

        </section>


        {/* COLUMN MAPPING */}

        <section className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">

          <div className="flex items-center gap-3 mb-5">

            <ArrowRight
              className="text-[#173B6C]"
            />

            <div>

              <h2 className="text-lg font-bold">
                Column Mapping
              </h2>

              <p className="text-sm text-slate-500">
                SKUL translated the school's column names
                into the standard SKUL structure.
              </p>

            </div>

          </div>


          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>

                <tr className="border-b border-slate-200">

                  <th className="text-left py-3">
                    Uploaded Column
                  </th>

                  <th className="text-left py-3">
                    SKUL Field
                  </th>

                  <th className="text-left py-3">
                    Confidence
                  </th>

                </tr>

              </thead>


              <tbody>

                {analysis.mappings
                  .filter(
                    (mapping) =>
                      mapping.source_column
                  )
                  .map(
                    (mapping, index) => (

                      <tr
                        key={index}
                        className="border-b border-slate-100"
                      >

                        <td className="py-3 font-medium">
                          {mapping.source_column}
                        </td>

                        <td className="py-3">
                          {mapping.target_field}
                        </td>

                        <td className="py-3">

                          <span className="inline-flex items-center gap-1 text-green-700">

                            <CheckCircle2 size={16} />

                            {mapping.confidence}%

                          </span>

                        </td>

                      </tr>

                    )
                  )}

              </tbody>

            </table>

          </div>

        </section>


        {/* MISSING INFORMATION */}

        <section className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">

          <div className="flex items-center gap-3 mb-5">

            <AlertTriangle
              className="text-amber-500"
            />

            <div>

              <h2 className="text-lg font-bold">
                Information Not Found
              </h2>

              <p className="text-sm text-slate-500">
                SKUL will not invent missing school data.
              </p>

            </div>

          </div>


          {analysis.unavailable_information.length === 0 ? (

            <div className="flex items-center gap-2 text-green-700">

              <CheckCircle2 size={18} />

              <span>
                No expected information is missing.
              </span>

            </div>

          ) : (

            <div className="grid md:grid-cols-2 gap-3">

              {analysis.unavailable_information.map(
                (item) => (

                  <div
                    key={item}
                    className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-sm text-amber-800"
                  >
                    {item} — not available in this file.
                  </div>

                )
              )}

            </div>

          )}

        </section>


        {/* DATA ISSUES */}

        <section className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">

          <h2 className="text-lg font-bold mb-4">
            Data Quality
          </h2>


          {analysis.issues.length === 0 ? (

            <div className="flex items-center gap-2 text-green-700">

              <CheckCircle2 size={18} />

              <span>
                No critical row-level issues were detected.
              </span>

            </div>

          ) : (

            <div className="space-y-3">

              {analysis.issues
                .slice(0, 20)
                .map(
                  (issue, index) => (

                    <div
                      key={index}
                      className="bg-red-50 border border-red-100 rounded-lg p-4"
                    >

                      <p className="font-semibold text-red-800">
                        Row {issue.row}
                      </p>

                      <p className="text-sm text-red-700 mt-1">
                        {issue.message}
                      </p>

                    </div>

                  )
                )}

            </div>

          )}

        </section>


        {/* YEARS AND CLASSES */}

        <section className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">

          <div className="grid md:grid-cols-2 gap-8">

            <div>

              <h3 className="font-bold mb-3">
                Academic Years
              </h3>

              <div className="flex flex-wrap gap-2">

                {analysis.structure.years.map(
                  (year) => (

                    <span
                      key={year}
                      className="px-3 py-2 bg-slate-100 rounded-lg text-sm"
                    >
                      {year}
                    </span>

                  )
                )}

              </div>

            </div>


            <div>

              <h3 className="font-bold mb-3">
                Classes
              </h3>

              <div className="flex flex-wrap gap-2">

                {analysis.structure.classes.map(
                  (className) => (

                    <span
                      key={className}
                      className="px-3 py-2 bg-slate-100 rounded-lg text-sm"
                    >
                      {className}
                    </span>

                  )
                )}

              </div>

            </div>

          </div>

        </section>


        {/* ACTIONS */}

        <div className="flex flex-col md:flex-row gap-4 justify-end">

          <button
            onClick={() =>
              navigate("/records")
            }
            className="px-6 py-3 rounded-lg border border-slate-300 font-semibold bg-white"
          >
            Back to Upload
          </button>


          <button
            onClick={approveImport}
            disabled={committing}
            className="px-6 py-3 rounded-lg bg-[#173B6C] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >

            {committing ? (

              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />

                Importing...

              </>

            ) : (

              <>
                <UploadCloud size={18} />

                Approve & Import Records

              </>

            )}

          </button>

        </div>

      </main>

    </div>
  );
}


function SummaryCard({
  title,
  value,
}) {

  return (

    <div className="bg-white rounded-xl border border-slate-200 p-5">

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <p className="text-3xl font-bold text-slate-800 mt-2">
        {value}
      </p>

    </div>

  );
}


export default ImportIntelligence;