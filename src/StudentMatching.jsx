import {
  useState,
} from "react";

import {
  ArrowRight,
  Database,
  Loader2,
} from "lucide-react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";


function StudentMatching() {

  const location =
    useLocation();

  const navigate =
    useNavigate();


  const rows =
    location.state?.rows || [];

  const filename =
    location.state?.filename ||
    "school_records";


  const [loading, setLoading] =
    useState(false);


  function continueToIntelligence() {

    if (!rows.length) {

      window.alert(
        "No school records were found."
      );

      return;
    }


    setLoading(true);


    navigate(
      "/import-intelligence",
      {
        state: {
          rows,
          filename,
        },
      }
    );
  }


  return (

    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-8">

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 max-w-2xl w-full">

        <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center mb-6">

          <Database
            className="text-[#173B6C]"
            size={30}
          />

        </div>


        <h1 className="text-2xl font-bold text-slate-800">
          School Records Ready
        </h1>


        <p className="text-slate-500 mt-2">
          SKUL will now analyze the uploaded file
          before adding anything to the permanent
          school database.
        </p>


        <div className="bg-slate-50 rounded-xl p-5 mt-6">

          <div className="flex justify-between py-2">

            <span className="text-slate-500">
              File
            </span>

            <span className="font-semibold">
              {filename}
            </span>

          </div>


          <div className="flex justify-between py-2">

            <span className="text-slate-500">
              Records detected
            </span>

            <span className="font-semibold">
              {rows.length}
            </span>

          </div>

        </div>


        <button
          onClick={continueToIntelligence}
          disabled={loading}
          className="w-full mt-6 bg-[#173B6C] text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
        >

          {loading ? (

            <>
              <Loader2
                size={18}
                className="animate-spin"
              />

              Opening Intelligence...

            </>

          ) : (

            <>
              Analyze With SKUL Intelligence

              <ArrowRight size={18} />

            </>

          )}

        </button>

      </div>

    </div>
  );
}


export default StudentMatching;