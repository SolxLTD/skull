import express from "express";

import cors from "cors";

import pool from "./db.js";

const app = express();

const PORT = 5000;

app.use(cors());

app.use(
  express.json({
    limit: "100mb",
  })
);

// ============================================================
// BASIC API
// ============================================================

app.get("/", (req, res) => {
  res.json({
    message: "School Intelligence API is running",
  });
});

app.get("/api/database-test", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT NOW() AS current_time"
    );

    res.json({
      success: true,
      message: "PostgreSQL database connected successfully",
      database: "School-Intelligence",
      time: result.rows[0].current_time,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Unable to connect to PostgreSQL",
      error: error.message,
    });
  }
});

// ============================================================
// STUDENTS
// ============================================================

app.get("/api/students", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM students
      ORDER BY id DESC
      `
    );

    res.json({
      success: true,
      students: result.rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve students",
      error: error.message,
    });
  }
});

// ============================================================
// INTELLIGENCE HELPERS
// ============================================================

function cleanHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s\-\/]+/g, "_")
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9_]/g, "");
}

function normalizeText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .trim()
    .replace(/\s+/g, " ");
}

function findColumn(columns, aliases) {
  const cleanedColumns = columns.map((column) => ({
    original: column,
    cleaned: cleanHeader(column),
  }));

  for (const alias of aliases) {
    const cleanedAlias = cleanHeader(alias);

    const exact = cleanedColumns.find(
      (column) => column.cleaned === cleanedAlias
    );

    if (exact) {
      return {
        column: exact.original,
        confidence: 100,
      };
    }
  }

  for (const alias of aliases) {
    const cleanedAlias = cleanHeader(alias);

    const partial = cleanedColumns.find(
      (column) =>
        column.cleaned.includes(cleanedAlias) ||
        cleanedAlias.includes(column.cleaned)
    );

    if (partial) {
      return {
        column: partial.original,
        confidence: 85,
      };
    }
  }

  return null;
}

function detectMappings(columns) {
  const definitions = [
    {
      target: "student_id",
      aliases: [
        "student_id",
        "student id",
        "studentid",
        "admission number",
        "admission_no",
        "admission id",
        "learner id",
        "pupil id",
        "registration number",
      ],
    },

    {
      target: "student_name",
      aliases: [
        "student_name",
        "student name",
        "name",
        "learner name",
        "pupil name",
        "full name",
        "student fullname",
      ],
    },

    {
      target: "gender",
      aliases: [
        "gender",
        "sex",
      ],
    },

    {
      target: "academic_year",
      aliases: [
        "academic year",
        "academic_year",
        "year",
        "school year",
        "session",
        "school session",
      ],
    },

    {
      target: "class_name",
      aliases: [
        "class",
        "class name",
        "class_name",
        "grade",
        "level",
        "form",
        "year group",
      ],
    },

    {
      target: "days_present",
      aliases: [
        "days present",
        "days_present",
        "present days",
        "attendance days",
      ],
    },

    {
      target: "total_school_days",
      aliases: [
        "total school days",
        "total_school_days",
        "school days",
        "total days",
      ],
    },

    {
      target: "attendance_percentage",
      aliases: [
        "attendance percentage",
        "attendance_percentage",
        "attendance %",
        "attendance",
      ],
    },

    {
      target: "average_score",
      aliases: [
        "average score",
        "average_score",
        "average",
        "overall score",
        "overall average",
        "mean score",
      ],
    },

    {
      target: "test_score",
      aliases: [
        "test score",
        "test_score",
        "test",
        "continuous assessment",
        "ca score",
        "assessment score",
      ],
    },

    {
      target: "exam_score",
      aliases: [
        "exam score",
        "exam_score",
        "exam",
        "examination score",
        "final exam",
      ],
    },

    {
      target: "total_score",
      aliases: [
        "total score",
        "total_score",
        "total mark",
        "total marks",
      ],
    },

    {
      target: "overall_grade",
      aliases: [
        "overall grade",
        "overall_grade",
        "grade",
        "final grade",
        "result grade",
      ],
    },

    {
      target: "result_status",
      aliases: [
        "result status",
        "result_status",
        "status",
        "result",
        "promotion status",
      ],
    },

    {
      target: "subject",
      aliases: [
        "subject",
        "subject name",
        "course",
        "course name",
        "learning area",
      ],
    },

    {
      target: "teacher",
      aliases: [
        "teacher",
        "teacher name",
        "teacher_id",
        "teacher id",
      ],
    },

    {
      target: "parent_name",
      aliases: [
        "parent",
        "parent name",
        "guardian",
        "guardian name",
      ],
    },

    {
      target: "parent_phone",
      aliases: [
        "parent phone",
        "parent_phone",
        "guardian phone",
        "guardian_phone",
        "phone",
      ],
    },

    {
      target: "fee_amount",
      aliases: [
        "fee",
        "fee amount",
        "amount due",
        "fees due",
      ],
    },

    {
      target: "amount_paid",
      aliases: [
        "amount paid",
        "amount_paid",
        "payment",
        "fees paid",
      ],
    },

    {
      target: "balance",
      aliases: [
        "balance",
        "fee balance",
        "outstanding",
        "outstanding balance",
      ],
    },

    {
      target: "event",
      aliases: [
        "event",
        "event name",
        "activity",
        "school event",
      ],
    },

    {
      target: "participation",
      aliases: [
        "participation",
        "participated",
        "event participation",
      ],
    },

    {
      target: "participation_outcome",
      aliases: [
        "performance",
        "outcome",
        "event performance",
        "participation performance",
      ],
    },
  ];

  const mappings = [];

  for (const definition of definitions) {
    const match = findColumn(
      columns,
      definition.aliases
    );

    if (match) {
      mappings.push({
        source_column: match.column,
        target_field: definition.target,
        confidence: match.confidence,
      });
    } else {
      mappings.push({
        source_column: null,
        target_field: definition.target,
        confidence: 0,
      });
    }
  }

  return mappings;
}

function getMappedColumn(mappings, target) {
  const mapping = mappings.find(
    (item) => item.target_field === target
  );

  return mapping?.source_column || null;
}

function valueFromRow(row, column) {
  if (!column) {
    return null;
  }

  return row[column];
}

function normalizeNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const cleaned = String(value)
    .replace(/,/g, "")
    .replace("%", "")
    .trim();

  const number = Number(cleaned);

  return Number.isFinite(number)
    ? number
    : null;
}

function detectCountry(rows, columns) {
  const text = JSON.stringify({
    columns,
    sample: rows.slice(0, 20),
  }).toLowerCase();

  if (
    text.includes("waec") ||
    text.includes("neco") ||
    text.includes("jss") ||
    text.includes("ss1") ||
    text.includes("ss2") ||
    text.includes("ss3") ||
    text.includes("primary 1") ||
    text.includes("primary 2")
  ) {
    return {
      country: "Nigeria",
      confidence: 72,
      reason:
        "Class naming patterns such as JSS, SS1, SS2 and SS3 are commonly used in Nigerian schools.",
    };
  }

  if (
    text.includes("ghana") ||
    text.includes("bece") ||
    text.includes("wassce")
  ) {
    return {
      country: "Ghana",
      confidence: 80,
      reason:
        "The uploaded data contains Ghana-specific education terminology.",
    };
  }

  if (
    text.includes("france") ||
    text.includes("collège") ||
    text.includes("lycée")
  ) {
    return {
      country: "France",
      confidence: 80,
      reason:
        "The uploaded data contains French education terminology.",
    };
  }

  return {
    country: null,
    confidence: 0,
    reason:
      "There is not enough reliable country-specific information in the file.",
  };
}

function normalizeAcademicYear(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  return String(value).trim();
}

function normalizeStudentId(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  return String(value).trim();
}

function normalizeStudentName(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  return String(value)
    .trim()
    .replace(/\s+/g, " ");
}

function getColumns(rows) {
  const columns = new Set();

  for (const row of rows) {
    if (!row || typeof row !== "object") {
      continue;
    }

    for (const key of Object.keys(row)) {
      columns.add(key);
    }
  }

  return [...columns];
}

function detectRequiredFields(mappings) {
  const required = [
    "student_id",
    "student_name",
    "academic_year",
    "class_name",
  ];

  return required.filter(
    (field) => !getMappedColumn(mappings, field)
  );
}

function detectUnavailableInformation(mappings) {
  const optionalFields = [
    "gender",
    "days_present",
    "total_school_days",
    "attendance_percentage",
    "average_score",
    "test_score",
    "exam_score",
    "total_score",
    "overall_grade",
    "result_status",
    "subject",
    "teacher",
    "parent_name",
    "parent_phone",
    "fee_amount",
    "amount_paid",
    "balance",
    "event",
    "participation",
    "participation_outcome",
  ];

  return optionalFields
    .filter(
      (field) => !getMappedColumn(mappings, field)
    )
    .map((field) => ({
      field,
      message:
        "This information was not found in the uploaded file.",
    }));
}

// ============================================================
// IMPORT INTELLIGENCE - ANALYZE
// ============================================================

app.post(
  "/api/import/analyze",
  async (req, res) => {
    try {
      const {
        filename,
        rows,
      } = req.body;

      if (!Array.isArray(rows)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid import data. Rows must be an array.",
        });
      }

      if (rows.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "The uploaded file contains no records.",
        });
      }

      const columns = getColumns(rows);

      const mappings =
        detectMappings(columns);

      const country =
        detectCountry(
          rows,
          columns
        );

      const missingFields =
        detectRequiredFields(
          mappings
        );

      const unavailableInformation =
        detectUnavailableInformation(
          mappings
        );

      const studentIdColumn =
        getMappedColumn(
          mappings,
          "student_id"
        );

      const studentNameColumn =
        getMappedColumn(
          mappings,
          "student_name"
        );

      const academicYearColumn =
        getMappedColumn(
          mappings,
          "academic_year"
        );

      const classColumn =
        getMappedColumn(
          mappings,
          "class_name"
        );

      const uniqueStudents =
        new Set();

      const uniqueClasses =
        new Set();

      const uniqueYears =
        new Set();

      const duplicateStudentIds =
        [];

      const seenStudentIds =
        new Set();

      const issues = [];

      for (
        let index = 0;
        index < rows.length;
        index++
      ) {
        const row = rows[index];

        const studentId =
          normalizeStudentId(
            valueFromRow(
              row,
              studentIdColumn
            )
          );

        const studentName =
          normalizeStudentName(
            valueFromRow(
              row,
              studentNameColumn
            )
          );

        const academicYear =
          normalizeAcademicYear(
            valueFromRow(
              row,
              academicYearColumn
            )
          );

        const className =
          normalizeText(
            valueFromRow(
              row,
              classColumn
            )
          );

        if (studentId) {
          uniqueStudents.add(
            studentId
          );

          if (
            seenStudentIds.has(
              studentId
            )
          ) {
            duplicateStudentIds.push(
              studentId
            );

            issues.push({
              row: index + 2,
              type:
                "duplicate_student_id",
              severity: "warning",
              field:
                "student_id",
              message:
                `Student ID "${studentId}" appears more than once. This may represent historical academic records rather than a duplicate student.`,
            });
          }

          seenStudentIds.add(
            studentId
          );
        } else {
          issues.push({
            row: index + 2,
            type:
              "missing_student_id",
            severity: "warning",
            field:
              "student_id",
            message:
              "Student ID is missing from this record.",
          });
        }

        if (!studentName) {
          issues.push({
            row: index + 2,
            type:
              "missing_student_name",
            severity: "error",
            field:
              "student_name",
            message:
              "Student name is missing from this record.",
          });
        }

        if (academicYear) {
          uniqueYears.add(
            academicYear
          );
        }

        if (className) {
          uniqueClasses.add(
            className
          );
        }
      }

      const analysis = {
        file: {
          filename,
          total_rows:
            rows.length,
          columns,
        },

        structure: {
          unique_students:
            uniqueStudents.size,

          unique_classes:
            uniqueClasses.size,

          unique_years:
            uniqueYears.size,

          classes:
            [
              ...uniqueClasses,
            ].sort(),

          years:
            [
              ...uniqueYears,
            ].sort(),
        },

        country_detection:
          country,

        mappings,

        missing_required_fields:
          missingFields,

        unavailable_information:
          unavailableInformation,

        duplicate_students:
          duplicateStudentIds,

        issues:
          issues.slice(0, 500),

        interpretation: {
          historical_data:
            uniqueStudents.size >
              0 &&
            rows.length >
              uniqueStudents.size,

          repeated_student_records:
            rows.length -
            uniqueStudents.size,

          recommendation:
            "Treat repeated Student IDs across academic years as historical records, not duplicate students.",
        },
      };

      const client =
        await pool.connect();

      try {
        await client.query(
          "BEGIN"
        );

        const batchResult =
          await client.query(
            `
            INSERT INTO import_batches (
              original_filename,
              file_type,
              detected_country,
              country_confidence,
              total_rows,
              unique_students,
              detected_classes,
              detected_years,
              status,
              analysis_summary
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              $7,
              $8,
              'analyzed',
              $9
            )
            RETURNING id
            `,
            [
              filename ||
                "uploaded_file",

              filename
                ?.split(".")
                .pop() ||
                null,

              country.country,

              country.confidence,

              rows.length,

              uniqueStudents.size,

              uniqueClasses.size,

              uniqueYears.size,

              JSON.stringify(
                analysis
              ),
            ]
          );

        const batchId =
          batchResult.rows[0].id;

        // ------------------------------------------------------
        // SAVE ONLY REAL SOURCE-COLUMN MAPPINGS
        // ------------------------------------------------------
        //
        // import_column_mappings.source_column is NOT NULL.
        // Unmapped target fields remain available inside the
        // analysis response but are not inserted into this table.
        // ------------------------------------------------------

        for (
          const mapping of mappings
        ) {
          if (
            !mapping.source_column
          ) {
            continue;
          }

          await client.query(
            `
            INSERT INTO import_column_mappings (
              import_batch_id,
              source_column,
              target_field,
              confidence,
              mapping_status
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5
            )
            `,
            [
              batchId,

              mapping.source_column,

              mapping.target_field,

              mapping.confidence,

              mapping.confidence >=
              85
                ? "suggested"
                : "unmapped",
            ]
          );
        }

        // ------------------------------------------------------
        // SAVE ISSUES
        // ------------------------------------------------------

        for (
          const issue of
          issues.slice(0, 500)
        ) {
          await client.query(
            `
            INSERT INTO import_issues (
              import_batch_id,
              source_row_number,
              issue_type,
              severity,
              field_name,
              message,
              resolution_status
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              'open'
            )
            `,
            [
              batchId,

              issue.row,

              issue.type,

              issue.severity,

              issue.field,

              issue.message,
            ]
          );
        }

        // ------------------------------------------------------
        // SAVE RAW + NORMALIZED IMPORT ROWS
        // ------------------------------------------------------

        for (
          let index = 0;
          index < rows.length;
          index++
        ) {
          const row =
            rows[index];

          const studentId =
            normalizeStudentId(
              valueFromRow(
                row,
                studentIdColumn
              )
            );

          const studentName =
            normalizeStudentName(
              valueFromRow(
                row,
                studentNameColumn
              )
            );

          const academicYear =
            normalizeAcademicYear(
              valueFromRow(
                row,
                academicYearColumn
              )
            );

          const className =
            normalizeText(
              valueFromRow(
                row,
                classColumn
              )
            );

          const normalized = {
            student_id:
              studentId,

            student_name:
              studentName,

            gender:
              normalizeText(
                valueFromRow(
                  row,
                  getMappedColumn(
                    mappings,
                    "gender"
                  )
                )
              ) || null,

            academic_year:
              academicYear,

            class_name:
              className || null,

            days_present:
              normalizeNumber(
                valueFromRow(
                  row,
                  getMappedColumn(
                    mappings,
                    "days_present"
                  )
                )
              ),

            total_school_days:
              normalizeNumber(
                valueFromRow(
                  row,
                  getMappedColumn(
                    mappings,
                    "total_school_days"
                  )
                )
              ),

            attendance_percentage:
              normalizeNumber(
                valueFromRow(
                  row,
                  getMappedColumn(
                    mappings,
                    "attendance_percentage"
                  )
                )
              ),

            average_score:
              normalizeNumber(
                valueFromRow(
                  row,
                  getMappedColumn(
                    mappings,
                    "average_score"
                  )
                )
              ),

            test_score:
              normalizeNumber(
                valueFromRow(
                  row,
                  getMappedColumn(
                    mappings,
                    "test_score"
                  )
                )
              ),

            exam_score:
              normalizeNumber(
                valueFromRow(
                  row,
                  getMappedColumn(
                    mappings,
                    "exam_score"
                  )
                )
              ),

            total_score:
              normalizeNumber(
                valueFromRow(
                  row,
                  getMappedColumn(
                    mappings,
                    "total_score"
                  )
                )
              ),

            overall_grade:
              normalizeText(
                valueFromRow(
                  row,
                  getMappedColumn(
                    mappings,
                    "overall_grade"
                  )
                )
              ) || null,

            result_status:
              normalizeText(
                valueFromRow(
                  row,
                  getMappedColumn(
                    mappings,
                    "result_status"
                  )
                )
              ) || null,

            subject:
              normalizeText(
                valueFromRow(
                  row,
                  getMappedColumn(
                    mappings,
                    "subject"
                  )
                )
              ) || null,
          };

          await client.query(
            `
            INSERT INTO import_rows (
              import_batch_id,
              source_row_number,
              raw_data,
              normalized_data,
              student_id,
              student_name,
              academic_year,
              class_name
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              $7,
              $8
            )
            `,
            [
              batchId,

              index + 2,

              JSON.stringify(row),

              JSON.stringify(
                normalized
              ),

              studentId,

              studentName,

              academicYear,

              className || null,
            ]
          );
        }

        await client.query(
          "COMMIT"
        );

        res.json({
          success: true,
          batch_id: batchId,
          analysis,
        });
      } catch (error) {
        await client.query(
          "ROLLBACK"
        );

        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message:
          "Import intelligence analysis failed.",
        error:
          error.message,
      });
    }
  }
);

// ============================================================
// GET IMPORT ANALYSIS
// ============================================================

app.get(
  "/api/import/:id",
  async (req, res) => {
    const batchId =
      Number(req.params.id);

    if (
      !Number.isInteger(batchId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid import ID.",
      });
    }

    try {
      const batch =
        await pool.query(
          `
          SELECT *
          FROM import_batches
          WHERE id = $1
          `,
          [batchId]
        );

      if (
        batch.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Import batch not found.",
        });
      }

      const mappings =
        await pool.query(
          `
          SELECT *
          FROM import_column_mappings
          WHERE import_batch_id = $1
          ORDER BY id
          `,
          [batchId]
        );

      const issues =
        await pool.query(
          `
          SELECT *
          FROM import_issues
          WHERE import_batch_id = $1
          ORDER BY id
          `,
          [batchId]
        );

      res.json({
        success: true,
        batch:
          batch.rows[0],
        mappings:
          mappings.rows,
        issues:
          issues.rows,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message:
          "Unable to retrieve import analysis.",
        error:
          error.message,
      });
    }
  }
);

// ============================================================
// COMMIT APPROVED IMPORT
// ============================================================

app.post(
  "/api/import/:id/commit",
  async (req, res) => {
    const batchId =
      Number(req.params.id);

    if (
      !Number.isInteger(batchId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid import ID.",
      });
    }

    const client =
      await pool.connect();

    try {
      await client.query(
        "BEGIN"
      );

      const batch =
        await client.query(
          `
          SELECT *
          FROM import_batches
          WHERE id = $1
          FOR UPDATE
          `,
          [batchId]
        );

      if (
        batch.rows.length === 0
      ) {
        throw new Error(
          "Import batch not found."
        );
      }

      if (
        batch.rows[0].status ===
        "committed"
      ) {
        throw new Error(
          "This import has already been committed."
        );
      }

      const rows =
        await client.query(
          `
          SELECT *
          FROM import_rows
          WHERE import_batch_id = $1
          ORDER BY source_row_number
          `,
          [batchId]
        );

      let studentsCreated = 0;
      let enrollmentsCreated = 0;
      let academicRecordsCreated = 0;
      let attendanceRecordsCreated = 0;

      for (
        const importRow of
        rows.rows
      ) {
        const data =
          importRow.normalized_data;

        if (
          !data.student_id ||
          !data.student_name
        ) {
          continue;
        }

        // ------------------------------------------------------
        // STUDENT MASTER
        // ------------------------------------------------------

        const student =
          await client.query(
            `
            INSERT INTO students (
              student_id,
              student_name,
              gender,
              class_name,
              academic_year,
              days_present,
              total_school_days,
              attendance_percentage,
              average_score,
              overall_grade,
              result_status
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              $7,
              $8,
              $9,
              $10,
              $11
            )
            ON CONFLICT (student_id)
            DO NOTHING
            RETURNING id
            `,
            [
              data.student_id,

              data.student_name,

              data.gender ||
                null,

              data.class_name ||
                null,

              data.academic_year ||
                null,

              data.days_present ||
                0,

              data.total_school_days ||
                0,

              data.attendance_percentage ||
                0,

              data.average_score ||
                0,

              data.overall_grade ||
                null,

              data.result_status ||
                null,
            ]
          );

        if (
          student.rows.length >
          0
        ) {
          studentsCreated++;
        }

        // ------------------------------------------------------
        // ENROLLMENT HISTORY
        // ------------------------------------------------------

        const enrollment =
          await client.query(
            `
            INSERT INTO student_enrollments (
              student_id,
              academic_year,
              term,
              class_name,
              enrollment_status
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              'Completed'
            )
            ON CONFLICT DO NOTHING
            RETURNING id
            `,
            [
              data.student_id,

              data.academic_year,

              null,

              data.class_name,
            ]
          );

        if (
          enrollment.rows.length >
          0
        ) {
          enrollmentsCreated++;
        }

        // ------------------------------------------------------
        // OVERALL ACADEMIC RECORD
        // ------------------------------------------------------

        const academic =
          await client.query(
            `
            INSERT INTO academic_records (
              student_id,
              academic_year,
              term,
              class_name,
              subject,
              test_score,
              exam_score,
              total_score,
              average_score,
              grade,
              result_status,
              source_file,
              source_row_number,
              assessment_scope
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              $7,
              $8,
              $9,
              $10,
              $11,
              $12,
              $13,
              'overall'
            )
            ON CONFLICT DO NOTHING
            RETURNING id
            `,
            [
              data.student_id,

              data.academic_year,

              null,

              data.class_name,

              data.subject ||
                null,

              data.test_score,

              data.exam_score,

              data.total_score,

              data.average_score,

              data.overall_grade,

              data.result_status,

              batch.rows[0]
                .original_filename,

              importRow
                .source_row_number,
            ]
          );

        if (
          academic.rows.length >
          0
        ) {
          academicRecordsCreated++;
        }

        // ------------------------------------------------------
        // ATTENDANCE
        // ------------------------------------------------------

        if (
          data.days_present !==
            null ||
          data.total_school_days !==
            null ||
          data.attendance_percentage !==
            null
        ) {
          const attendance =
            await client.query(
              `
              INSERT INTO attendance_records (
                student_id,
                academic_year,
                term,
                class_name,
                days_present,
                total_school_days,
                attendance_percentage,
                remarks
              )
              VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8
              )
              ON CONFLICT DO NOTHING
              RETURNING id
              `,
              [
                data.student_id,

                data.academic_year,

                null,

                data.class_name,

                data.days_present ||
                  0,

                data.total_school_days ||
                  0,

                data.attendance_percentage ||
                  0,

                `Imported from ${batch.rows[0].original_filename}`,
              ]
            );

          if (
            attendance.rows.length >
            0
          ) {
            attendanceRecordsCreated++;
          }
        }
      }

      await client.query(
        `
        UPDATE import_rows
        SET processing_status = 'committed',
            match_status = 'matched'
        WHERE import_batch_id = $1
        `,
        [batchId]
      );

      await client.query(
        `
        UPDATE import_batches
        SET status = 'committed',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        `,
        [batchId]
      );

      await client.query(
        "COMMIT"
      );

      res.json({
        success: true,

        message:
          "School records successfully imported into SKUL.",

        statistics: {
          students_created:
            studentsCreated,

          enrollment_records_created:
            enrollmentsCreated,

          academic_records_created:
            academicRecordsCreated,

          attendance_records_created:
            attendanceRecordsCreated,
        },
      });
    } catch (error) {
      await client.query(
        "ROLLBACK"
      );

      console.error(error);

      res.status(500).json({
        success: false,

        message:
          "Import commit failed.",

        error:
          error.message,
      });
    } finally {
      client.release();
    }
  }
);

// ============================================================
// DASHBOARD
// ============================================================

app.get(
  "/api/dashboard",
  async (req, res) => {
    try {
      const studentCount =
        await pool.query(
          `
          SELECT COUNT(*) AS total_students
          FROM students
          `
        );

      const average =
        await pool.query(
          `
          SELECT AVG(average_score) AS average_score
          FROM students
          `
        );

      const classes =
        await pool.query(
          `
          SELECT COUNT(DISTINCT class_name) AS total_classes
          FROM students
          `
        );

      const attendance =
        await pool.query(
          `
          SELECT AVG(attendance_percentage)
          AS attendance_percentage
          FROM students
          `
        );

      const historical =
        await pool.query(
          `
          SELECT COUNT(*) AS historical_records
          FROM academic_records
          `
        );

      res.json({
        success: true,

        statistics: {
          total_students:
            Number(
              studentCount.rows[0]
                .total_students
            ),

          average_score:
            Number(
              average.rows[0]
                .average_score || 0
            ).toFixed(1),

          total_classes:
            Number(
              classes.rows[0]
                .total_classes
            ),

          attendance_percentage:
            Number(
              attendance.rows[0]
                .attendance_percentage ||
                0
            ).toFixed(1),

          historical_records:
            Number(
              historical.rows[0]
                .historical_records
            ),
        },
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,

        message:
          "Unable to retrieve dashboard statistics",

        error:
          error.message,
      });
    }
  }
);

// ============================================================
// SERVER
// ============================================================

app.listen(
  PORT,
  () => {
    console.log(
      `School Intelligence API running on http://localhost:${PORT}`
    );
  }
);