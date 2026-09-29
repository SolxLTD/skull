import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  Upload,
  FileSpreadsheet,
  ArrowRight,
  X,
} from "lucide-react";

function Records() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const readFile = async (selectedFile) => {
    setError("");

    if (!selectedFile) return;

    const allowed = [".xlsx", ".xls", ".csv"];
    const extension =
      "." + selectedFile.name.split(".").pop().toLowerCase();

    if (!allowed.includes(extension)) {
      setError("Please upload an Excel or CSV file.");
      return;
    }

    try {
      const buffer = await selectedFile.arrayBuffer();

      const workbook = XLSX.read(buffer, {
        type: "array",
        cellDates: true,
      });

      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        throw new Error("No readable sheet was found.");
      }

      const worksheet = workbook.Sheets[firstSheetName];

      const parsedRows = XLSX.utils.sheet_to_json(worksheet, {
        defval: "",
        raw: false,
      });

      if (!parsedRows.length) {
        throw new Error("The uploaded file contains no readable records.");
      }

      setFile(selectedFile);
      setRows(parsedRows);
    } catch (err) {
      setFile(null);
      setRows([]);
      setError(err.message || "Unable to read the uploaded file.");
    }
  };

  const handleFileInput = (event) => {
    readFile(event.target.files?.[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);

    readFile(event.dataTransfer.files?.[0]);
  };

  const removeFile = () => {
    setFile(null);
    setRows([]);
    setError("");
  };

  const continueToAnalysis = () => {
    if (!file || !rows.length) return;

    navigate("/student-matching", {
      state: {
        rows,
        filename: file.name,
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Upload School Records
          </h1>

          <p className="mt-2 text-slate-500">
            Upload the school's existing records for SKUL Intelligence to analyze.
          </p>
        </div>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`rounded-2xl border-2 border-dashed p-12 text-center transition ${
            dragging
              ? "border-blue-600 bg-blue-50"
              : "border-slate-300 bg-white"
          }`}
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Upload className="h-8 w-8 text-blue-600" />
          </div>

          <h2 className="text-xl font-semibold text-slate-900">
            Upload your school file
          </h2>

          <p className="mt-2 text-slate-500">
            Excel or CSV files are supported.
          </p>

          <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">
            <Upload className="h-5 w-5" />
            Upload File
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {file && rows.length > 0 && (
          <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-green-100 p-3">
                  <FileSpreadsheet className="h-6 w-6 text-green-600" />
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900">
                    {file.name}
                  </h3>

                  <p className="text-sm text-slate-500">
                    {rows.length.toLocaleString()} records detected
                  </p>
                </div>
              </div>

              <button
                onClick={removeFile}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
              <div className="max-h-80 overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr>
                      {Object.keys(rows[0]).map((column) => (
                        <th
                          key={column}
                          className="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-700"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {rows.slice(0, 10).map((row, index) => (
                      <tr
                        key={index}
                        className="border-t border-slate-100"
                      >
                        {Object.keys(rows[0]).map((column) => (
                          <td
                            key={column}
                            className="whitespace-nowrap px-4 py-3 text-slate-600"
                          >
                            {String(row[column] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={continueToAnalysis}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Analyze File
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Records;