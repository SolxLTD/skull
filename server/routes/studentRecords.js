import express from "express";
import multer from "multer";
import XLSX from "xlsx";

import pool from "../db.js";

const router = express.Router();

const SCHOOL_ID = 1;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

const SKUL_FIELDS = {
  student_id: [
    "student id",
    "student_id",
    "studentid",
    "id",
    "admission number",
    "admission no",
    "admission_number",
  ],

  student_name: [
    "student name",
    "student_name",
    "studentname",
    "name",
    "full name",
    "full_name",
  ],

  first_name: [
    "first name",
    "first_name",
    "firstname",
  ],

  last_name: [
    "last name",
    "last_name",
    "lastname",
    "surname",
  ],

  gender: [
    "gender",
    "sex",
  ],

  date_of_birth: [
    "date of birth",
    "dob",
    "birth date",
    "birthdate",
  ],

  enrollment_date: [
    "enrollment date",
    "enrolment date",
    "registration date",
    "admission date",
    "date registered",
  ],

  academic_year: [
    "academic year",
    "academic_year",
    "school year",
    "session",
    "year",
  ],

  term: [
    "term",
    "semester",
    "school term",
  ],

  class_name: [
    "class",
    "class name",
    "class_name",
    "grade",
    "level",
    "class level",
  ],

  subject: [
    "subject",
    "subject name",
    "subject_name",
  ],

  score: [
    "score",
    "mark",
    "marks",
    "total score",
    "total_score",
    "average score",
    "average_score",
  ],

  grade: [
    "grade",
    "overall grade",
    "overall_grade",
  ],

  result_status: [
    "result status",
    "result_status",
    "performance status",
  ],

  days_present: [
    "days present",
    "days_present",
    "present",
  ],

  days_absent: [
    "days absent",
    "days_absent",
    "absent",
  ],

  total_school_days: [
    "total school days",
    "total_school_days",
    "school days",
  ],

  attendance_percentage: [
    "attendance percentage",
    "attendance_percentage",
    "attendance %",
    "attendance",
  ],
};

const KNOWN_SUBJECTS = [
  "english",
  "english language",
  "mathematics",
  "math",
  "maths",
  "basic science",
  "basic technology",
  "social studies",
  "civic education",
  "computer studies",
  "computer science",
  "biology",
  "chemistry",
  "physics",
  "economics",
  "government",
  "literature",
  "geography",
  "agricultural science",
  "commerce",
  "accounting",
  "french",
  "religious studies",
  "christian religious studies",
  "islamic religious studies",
];

async function ensureDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS skul_imports (
      id BIGSERIAL PRIMARY KEY,
      school_id INTEGER NOT NULL DEFAULT 1,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size BIGINT NOT NULL DEFAULT 0,
      original_file BYTEA,
      row_count INTEGER NOT NULL DEFAULT 0,
      column_count INTEGER NOT NULL DEFAULT 0,
      student_count INTEGER NOT NULL DEFAULT 0,
      mappings JSONB NOT NULL DEFAULT '[]'::jsonb,
      status TEXT NOT NULL DEFAULT 'analyzed',
      error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS skul_import_rows (
      id BIGSERIAL PRIMARY KEY,
      import_id BIGINT NOT NULL REFERENCES skul_imports(id) ON DELETE CASCADE,
      row_number INTEGER NOT NULL,
      raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
      normalized_data JSONB NOT NULL DEFAULT '{}'::jsonb,
      match_status TEXT NOT NULL DEFAULT 'pending',
      match_student_id BIGINT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS skul_students (
      id BIGSERIAL PRIMARY KEY,
      school_id INTEGER NOT NULL DEFAULT 1,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      date_of_birth DATE,
      gender TEXT,
      enrollment_date DATE,
      status TEXT NOT NULL DEFAULT 'active',
      raw_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (school_id, student_id)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_skul_students_name
    ON skul_students (school_id, LOWER(student_name));
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS skul_enrollments (
      id BIGSERIAL PRIMARY KEY,
      school_id INTEGER NOT NULL DEFAULT 1,
      student_pk BIGINT NOT NULL REFERENCES skul_students(id) ON DELETE CASCADE,
      academic_year TEXT,
      term TEXT,
      class_name TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (
        school_id,
        student_pk,
        academic_year,
        term,
        class_name
      )
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS skul_academic_records (
      id BIGSERIAL PRIMARY KEY,
      school_id INTEGER NOT NULL DEFAULT 1,
      student_pk BIGINT NOT NULL REFERENCES skul_students(id) ON DELETE CASCADE,
      academic_year TEXT,
      term TEXT,
      class_name TEXT,
      subject TEXT,
      assessment TEXT,
      score NUMERIC,
      grade TEXT,
      result_status TEXT,
      source_import_id BIGINT REFERENCES skul_imports(id),
      raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (
        school_id,
        student_pk,
        academic_year,
        term,
        class_name,
        subject,
        assessment
      )
    );
  `);
}

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function cleanName(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function toNumber(value) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return null;
  }

  const cleaned = String(value)
    .replace("%", "")
    .replace(/,/g, "")
    .trim();

  const number = Number(cleaned);

  return Number.isFinite(number) ? number : null;
}

function toDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const text = String(value).trim();

  if (!text) {
    return null;
  }

  const parsed = new Date(text);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}

function confidenceForColumn(source, aliases) {
  const normalizedSource = normalize(source);

  let best = 0;

  for (const alias of aliases) {
    const normalizedAlias = normalize(alias);

    if (normalizedSource === normalizedAlias) {
      return 1;
    }

    if (
      normalizedSource.includes(normalizedAlias) ||
      normalizedAlias.includes(normalizedSource)
    ) {
      best = Math.max(best, 0.85);
    }
  }

  const sourceWords = new Set(normalizedSource.split(" "));

  for (const alias of aliases) {
    const aliasWords = normalize(alias).split(" ");

    const matches = aliasWords.filter((word) =>
      sourceWords.has(word)
    );

    if (matches.length > 0) {
      const score =
        matches.length /
        Math.max(sourceWords.length, aliasWords.length);

      best = Math.max(best, Math.min(score, 0.79));
    }
  }

  return best;
}

function mapColumns(columns) {
  return columns.map((column) => {
    let target = "unmapped";
    let confidence = 0;

    for (const [field, aliases] of Object.entries(SKUL_FIELDS)) {
      const currentConfidence =
        confidenceForColumn(column, aliases);

      if (currentConfidence > confidence) {
        confidence = currentConfidence;
        target = field;
      }
    }

    return {
      source: column,
      target,
      confidence: Number(confidence.toFixed(2)),
    };
  });
}

function mappingFor(mappings, target) {
  return mappings.find(
    (mapping) => mapping.target === target
  );
}

function valueFromMapping(row, mappings, target) {
  const mapping = mappingFor(mappings, target);

  if (!mapping) {
    return "";
  }

  return row[mapping.source] ?? "";
}

function normalizeRow(row, mappings) {
  let studentName = cleanName(
    valueFromMapping(
      row,
      mappings,
      "student_name"
    )
  );

  const firstName = cleanName(
    valueFromMapping(
      row,
      mappings,
      "first_name"
    )
  );

  const lastName = cleanName(
    valueFromMapping(
      row,
      mappings,
      "last_name"
    )
  );

  if (!studentName) {
    studentName = [firstName, lastName]
      .filter(Boolean)
      .join(" ");
  }

  return {
    student_id: cleanName(
      valueFromMapping(
        row,
        mappings,
        "student_id"
      )
    ),

    student_name: studentName,

    first_name: firstName,

    last_name: lastName,

    date_of_birth: toDate(
      valueFromMapping(
        row,
        mappings,
        "date_of_birth"
      )
    ),

    gender: cleanName(
      valueFromMapping(
        row,
        mappings,
        "gender"
      )
    ),

    enrollment_date: toDate(
      valueFromMapping(
        row,
        mappings,
        "enrollment_date"
      )
    ),

    academic_year: cleanName(
      valueFromMapping(
        row,
        mappings,
        "academic_year"
      )
    ),

    term: cleanName(
      valueFromMapping(
        row,
        mappings,
        "term"
      )
    ),

    class_name: cleanName(
      valueFromMapping(
        row,
        mappings,
        "class_name"
      )
    ),

    subject: cleanName(
      valueFromMapping(
        row,
        mappings,
        "subject"
      )
    ),

    score: toNumber(
      valueFromMapping(
        row,
        mappings,
        "score"
      )
    ),

    grade: cleanName(
      valueFromMapping(
        row,
        mappings,
        "grade"
      )
    ),

    result_status: cleanName(
      valueFromMapping(
        row,
        mappings,
        "result_status"
      )
    ),

    days_present: toNumber(
      valueFromMapping(
        row,
        mappings,
        "days_present"
      )
    ),

    days_absent: toNumber(
      valueFromMapping(
        row,
        mappings,
        "days_absent"
      )
    ),

    total_school_days: toNumber(
      valueFromMapping(
        row,
        mappings,
        "total_school_days"
      )
    ),

    attendance_percentage: toNumber(
      valueFromMapping(
        row,
        mappings,
        "attendance_percentage"
      )
    ),
  };
}

function extractWorkbook(buffer) {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,
  });

  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error(
      "The uploaded workbook has no worksheet."
    );
  }

  const sheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json(sheet, {
    defval: "",
    raw: false,
  });

  return rows;
}

function fileTypeFromName(fileName) {
  const extension = fileName
    .split(".")
    .pop()
    .toLowerCase();

  if (extension === "xlsx") {
    return "Excel XLSX";
  }

  if (extension === "xls") {
    return "Excel XLS";
  }

  if (extension === "csv") {
    return "CSV";
  }

  if (extension === "pdf") {
    return "PDF";
  }

  return extension.toUpperCase();
}

function generateStudentId(enrollmentDate, sequence) {
  const date =
    enrollmentDate || new Date();

  const yyyy = date
    .getFullYear()
    .toString();

  const mm = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const dd = String(
    date.getDate()
  ).padStart(2, "0");

  return `${yyyy}${mm}${dd}-${String(
    sequence
  ).padStart(3, "0")}`;
}

async function getNextStudentSequence(client) {
  const result = await client.query(`
    SELECT COUNT(*)::INTEGER AS count
    FROM skul_students
    WHERE school_id = $1
  `, [SCHOOL_ID]);

  return Number(result.rows[0].count) + 1;
}

async function findExistingStudent(client, normalized) {
  if (normalized.student_id) {
    const result = await client.query(
      `
        SELECT *
        FROM skul_students
        WHERE school_id = $1
        AND student_id = $2
        LIMIT 1
      `,
      [
        SCHOOL_ID,
        normalized.student_id,
      ]
    );

    if (result.rows[0]) {
      return result.rows[0];
    }
  }

  if (!normalized.student_name) {
    return null;
  }

  if (normalized.date_of_birth) {
    const result = await client.query(
      `
        SELECT *
        FROM skul_students
        WHERE school_id = $1
        AND LOWER(student_name) = LOWER($2)
        AND date_of_birth = $3
        LIMIT 1
      `,
      [
        SCHOOL_ID,
        normalized.student_name,
        normalized.date_of_birth,
      ]
    );

    if (result.rows[0]) {
      return result.rows[0];
    }
  }

  const result = await client.query(
    `
      SELECT *
      FROM skul_students
      WHERE school_id = $1
      AND LOWER(student_name) = LOWER($2)
      ORDER BY id ASC
      LIMIT 1
    `,
    [
      SCHOOL_ID,
      normalized.student_name,
    ]
  );

  return result.rows[0] || null;
}

function detectSubjectColumns(row, mappings) {
  const known = [];

  for (const key of Object.keys(row)) {
    const normalizedKey = normalize(key);

    const alreadyMapped = mappings.some(
      (mapping) =>
        mapping.source === key &&
        mapping.target !== "unmapped"
    );

    if (alreadyMapped) {
      continue;
    }

    if (
      KNOWN_SUBJECTS.includes(normalizedKey)
    ) {
      known.push({
        subject: cleanName(key),
        score: toNumber(row[key]),
      });
    }
  }

  return known.filter(
    (item) => item.score !== null
  );
}

async function saveAcademicRecord(
  client,
  student,
  normalized,
  sourceImportId,
  subject,
  score,
  rawData
) {
  if (!subject) {
    return;
  }

  await client.query(
    `
      INSERT INTO skul_academic_records (
        school_id,
        student_pk,
        academic_year,
        term,
        class_name,
        subject,
        assessment,
        score,
        grade,
        result_status,
        source_import_id,
        raw_data
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
      )
      ON CONFLICT (
        school_id,
        student_pk,
        academic_year,
        term,
        class_name,
        subject,
        assessment
      )
      DO UPDATE SET
        score = EXCLUDED.score,
        grade = EXCLUDED.grade,
        result_status = EXCLUDED.result_status,
        source_import_id = EXCLUDED.source_import_id,
        raw_data = EXCLUDED.raw_data,
        updated_at = NOW()
    `,
    [
      SCHOOL_ID,
      student.id,
      normalized.academic_year || null,
      normalized.term || null,
      normalized.class_name || null,
      subject,
      "General",
      score,
      normalized.grade || null,
      normalized.result_status || null,
      sourceImportId,
      rawData,
    ]
  );
}

/*
|--------------------------------------------------------------------------
| GET STUDENTS
|--------------------------------------------------------------------------
*/

router.get("/", async (req, res) => {
  try {
    await ensureDatabase();

    const search =
      String(req.query.search || "").trim();

    const result = await pool.query(
      `
        SELECT
          s.id,
          s.student_id,
          s.student_name,
          s.first_name,
          s.last_name,
          s.date_of_birth,
          s.gender,
          s.enrollment_date,
          s.status,

          (
            SELECT e.class_name
            FROM skul_enrollments e
            WHERE e.student_pk = s.id
            ORDER BY e.id DESC
            LIMIT 1
          ) AS class_name,

          (
            SELECT ROUND(AVG(a.score), 1)
            FROM skul_academic_records a
            WHERE a.student_pk = s.id
            AND a.score IS NOT NULL
          ) AS average_score

        FROM skul_students s

        WHERE s.school_id = $1

        AND (
          $2 = ''
          OR LOWER(s.student_name)
             LIKE LOWER('%' || $2 || '%')
          OR LOWER(s.student_id)
             LIKE LOWER('%' || $2 || '%')
        )

        ORDER BY s.student_name ASC
      `,
      [
        SCHOOL_ID,
        search,
      ]
    );

    res.json({
      success: true,
      students: result.rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Unable to load student records.",
      error: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| DASHBOARD / STUDENT STATS
|--------------------------------------------------------------------------
*/

router.get("/stats", async (req, res) => {
  try {
    await ensureDatabase();

    const students = await pool.query(
      `
        SELECT COUNT(*)::INTEGER AS total
        FROM skul_students
        WHERE school_id = $1
      `,
      [SCHOOL_ID]
    );

    const active = await pool.query(
      `
        SELECT COUNT(*)::INTEGER AS total
        FROM skul_students
        WHERE school_id = $1
        AND status = 'active'
      `,
      [SCHOOL_ID]
    );

    const classes = await pool.query(
      `
        SELECT COUNT(DISTINCT class_name)::INTEGER AS total
        FROM skul_enrollments
        WHERE school_id = $1
        AND class_name IS NOT NULL
        AND class_name <> ''
      `,
      [SCHOOL_ID]
    );

    res.json({
      success: true,
      totalStudents: Number(
        students.rows[0].total
      ),
      activeStudents: Number(
        active.rows[0].total
      ),
      classes: Number(
        classes.rows[0].total
      ),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Unable to load student statistics.",
    });
  }
});

/*
|--------------------------------------------------------------------------
| IMPORT HISTORY
|--------------------------------------------------------------------------
*/

router.get("/imports", async (req, res) => {
  try {
    await ensureDatabase();

    const result = await pool.query(`
      SELECT
        id,
        file_name,
        file_type,
        file_size,
        row_count,
        column_count,
        student_count,
        status,
        created_at
      FROM skul_imports
      WHERE school_id = ${SCHOOL_ID}
      ORDER BY created_at DESC
      LIMIT 25
    `);

    res.json({
      success: true,
      imports: result.rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Unable to load import history.",
    });
  }
});

/*
|--------------------------------------------------------------------------
| UPLOAD + ANALYZE + SAVE IMPORT
|--------------------------------------------------------------------------
*/

router.post(
  "/upload",
  upload.single("file"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      await ensureDatabase();

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Please select a file to upload.",
        });
      }

      const fileName =
        req.file.originalname;

      const extension =
        fileName
          .split(".")
          .pop()
          .toLowerCase();

      const fileType =
        fileTypeFromName(fileName);

      if (extension === "pdf") {
        const importResult =
          await client.query(
            `
              INSERT INTO skul_imports (
                school_id,
                file_name,
                file_type,
                file_size,
                original_file,
                status
              )
              VALUES ($1,$2,$3,$4,$5,$6)
              RETURNING id
            `,
            [
              SCHOOL_ID,
              fileName,
              fileType,
              req.file.size,
              req.file.buffer,
              "awaiting_ocr",
            ]
          );

        return res.json({
          success: true,
          importId:
            importResult.rows[0].id,
          fileName,
          fileType,
          requiresOCR: true,
          message:
            "PDF saved successfully. It is ready for the OCR processing stage.",
        });
      }

      if (
        extension !== "xlsx" &&
        extension !== "xls" &&
        extension !== "csv"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Only CSV, XLS, XLSX and PDF files are supported.",
        });
      }

      const rows =
        extractWorkbook(req.file.buffer);

      const columns =
        rows.length > 0
          ? Object.keys(rows[0])
          : [];

      if (columns.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "The uploaded file contains no readable columns.",
        });
      }

      const mappings =
        mapColumns(columns);

      const normalizedRows =
        rows.map((row) =>
          normalizeRow(row, mappings)
        );

      const uniqueNames =
        new Set(
          normalizedRows
            .map(
              (row) =>
                normalize(
                  row.student_name
                )
            )
            .filter(Boolean)
        );

      await client.query("BEGIN");

      const importResult =
        await client.query(
          `
            INSERT INTO skul_imports (
              school_id,
              file_name,
              file_type,
              file_size,
              original_file,
              row_count,
              column_count,
              student_count,
              mappings,
              status
            )
            VALUES (
              $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
            )
            RETURNING id
          `,
          [
            SCHOOL_ID,
            fileName,
            fileType,
            req.file.size,
            req.file.buffer,
            rows.length,
            columns.length,
            uniqueNames.size,
            JSON.stringify(mappings),
            "analyzed",
          ]
        );

      const importId =
        importResult.rows[0].id;

      for (
        let index = 0;
        index < rows.length;
        index += 1
      ) {
        await client.query(
          `
            INSERT INTO skul_import_rows (
              import_id,
              row_number,
              raw_data,
              normalized_data
            )
            VALUES ($1,$2,$3,$4)
          `,
          [
            importId,
            index + 2,
            JSON.stringify(rows[index]),
            JSON.stringify(
              normalizedRows[index]
            ),
          ]
        );
      }

      await client.query("COMMIT");

      res.json({
        success: true,
        importId,
        fileName,
        fileType,
        totalRows: rows.length,
        totalColumns: columns.length,
        studentsDetected:
          uniqueNames.size,
        mappedColumns: mappings,
        sampleRows: rows.slice(0, 5),
        message:
          "File saved, analyzed and mapped successfully.",
      });
    } catch (error) {
      await client.query("ROLLBACK");

      console.error(
        "Upload error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "SKUL could not process the uploaded file.",
        error: error.message,
      });
    } finally {
      client.release();
    }
  }
);

/*
|--------------------------------------------------------------------------
| CONFIRM IMPORT
|--------------------------------------------------------------------------
*/

router.post(
  "/imports/:importId/confirm",
  async (req, res) => {
    const client = await pool.connect();

    try {
      await ensureDatabase();

      const importId =
        Number(req.params.importId);

      if (!Number.isInteger(importId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid import ID.",
        });
      }

      const importResult =
        await client.query(
          `
            SELECT *
            FROM skul_imports
            WHERE id = $1
            AND school_id = $2
          `,
          [
            importId,
            SCHOOL_ID,
          ]
        );

      const importRecord =
        importResult.rows[0];

      if (!importRecord) {
        return res.status(404).json({
          success: false,
          message:
            "Import record was not found.",
        });
      }

      if (
        importRecord.status === "imported"
      ) {
        return res.json({
          success: true,
          message:
            "This import has already been saved.",
        });
      }

      const rowsResult =
        await client.query(
          `
            SELECT *
            FROM skul_import_rows
            WHERE import_id = $1
            ORDER BY row_number ASC
          `,
          [importId]
        );

      await client.query("BEGIN");

      let sequence =
        await getNextStudentSequence(
          client
        );

      let createdStudents = 0;
      let updatedStudents = 0;
      let academicRecords = 0;

      for (const importRow of rowsResult.rows) {
        const normalized =
          importRow.normalized_data;

        if (!normalized.student_name) {
          continue;
        }

        let student =
          await findExistingStudent(
            client,
            normalized
          );

        let enrollmentDate =
          normalized.enrollment_date;

        if (!enrollmentDate) {
          enrollmentDate =
            new Date()
              .toISOString()
              .slice(0, 10);
        }

        if (!student) {
          let studentId =
            normalized.student_id;

          if (!studentId) {
            studentId =
              generateStudentId(
                new Date(
                  enrollmentDate
                ),
                sequence
              );

            sequence += 1;
          }

          const studentResult =
            await client.query(
              `
                INSERT INTO skul_students (
                  school_id,
                  student_id,
                  student_name,
                  first_name,
                  last_name,
                  date_of_birth,
                  gender,
                  enrollment_date,
                  status,
                  raw_profile
                )
                VALUES (
                  $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
                )
                RETURNING *
              `,
              [
                SCHOOL_ID,
                studentId,
                normalized.student_name,
                normalized.first_name || null,
                normalized.last_name || null,
                normalized.date_of_birth || null,
                normalized.gender || null,
                enrollmentDate,
                "active",
                JSON.stringify(
                  normalized
                ),
              ]
            );

          student =
            studentResult.rows[0];

          createdStudents += 1;
        } else {
          const updated =
            await client.query(
              `
                UPDATE skul_students
                SET
                  student_name =
                    COALESCE(NULLIF($1,''), student_name),
                  first_name =
                    COALESCE(NULLIF($2,''), first_name),
                  last_name =
                    COALESCE(NULLIF($3,''), last_name),
                  date_of_birth =
                    COALESCE($4, date_of_birth),
                  gender =
                    COALESCE(NULLIF($5,''), gender),
                  enrollment_date =
                    COALESCE($6, enrollment_date),
                  raw_profile = $7,
                  updated_at = NOW()
                WHERE id = $8
                RETURNING *
              `,
              [
                normalized.student_name,
                normalized.first_name || "",
                normalized.last_name || "",
                normalized.date_of_birth || null,
                normalized.gender || "",
                normalized.enrollment_date || null,
                JSON.stringify(
                  normalized
                ),
                student.id,
              ]
            );

          student =
            updated.rows[0];

          updatedStudents += 1;
        }

        await client.query(
          `
            UPDATE skul_import_rows
            SET
              match_status = 'matched',
              match_student_id = $1
            WHERE id = $2
          `,
          [
            student.id,
            importRow.id,
          ]
        );

        if (
          normalized.academic_year ||
          normalized.term ||
          normalized.class_name
        ) {
          await client.query(
            `
              INSERT INTO skul_enrollments (
                school_id,
                student_pk,
                academic_year,
                term,
                class_name
              )
              VALUES ($1,$2,$3,$4,$5)
              ON CONFLICT (
                school_id,
                student_pk,
                academic_year,
                term,
                class_name
              )
              DO NOTHING
            `,
            [
              SCHOOL_ID,
              student.id,
              normalized.academic_year || null,
              normalized.term || null,
              normalized.class_name || null,
            ]
          );
        }

        if (
          normalized.subject &&
          normalized.score !== null
        ) {
          await saveAcademicRecord(
            client,
            student,
            normalized,
            importId,
            normalized.subject,
            normalized.score,
            importRow.raw_data
          );

          academicRecords += 1;
        }

        const subjectColumns =
          detectSubjectColumns(
            importRow.raw_data,
            importRecord.mappings
          );

        for (const subject of subjectColumns) {
          await saveAcademicRecord(
            client,
            student,
            normalized,
            importId,
            subject.subject,
            subject.score,
            importRow.raw_data
          );

          academicRecords += 1;
        }
      }

      await client.query(
        `
          UPDATE skul_imports
          SET status = 'imported'
          WHERE id = $1
        `,
        [importId]
      );

      await client.query("COMMIT");

      res.json({
        success: true,
        message:
          "Student records have been saved to PostgreSQL.",
        importId,
        createdStudents,
        updatedStudents,
        academicRecords,
      });
    } catch (error) {
      await client.query("ROLLBACK");

      console.error(
        "Import confirmation error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "The student records could not be saved.",
        error: error.message,
      });
    } finally {
      client.release();
    }
  }
);

/*
|--------------------------------------------------------------------------
| ADD STUDENT
|--------------------------------------------------------------------------
*/

router.post("/", async (req, res) => {
  const client = await pool.connect();

  try {
    await ensureDatabase();

    const {
      studentName,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      enrollmentDate,
      className,
      academicYear,
      term,
    } = req.body;

    if (!studentName?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Student name is required.",
      });
    }

    await client.query("BEGIN");

    const sequence =
      await getNextStudentSequence(
        client
      );

    const finalEnrollmentDate =
      enrollmentDate ||
      new Date()
        .toISOString()
        .slice(0, 10);

    const studentId =
      generateStudentId(
        new Date(finalEnrollmentDate),
        sequence
      );

    const result =
      await client.query(
        `
          INSERT INTO skul_students (
            school_id,
            student_id,
            student_name,
            first_name,
            last_name,
            date_of_birth,
            gender,
            enrollment_date,
            status
          )
          VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,'active'
          )
          RETURNING *
        `,
        [
          SCHOOL_ID,
          studentId,
          studentName.trim(),
          firstName || null,
          lastName || null,
          dateOfBirth || null,
          gender || null,
          finalEnrollmentDate,
        ]
      );

    const student =
      result.rows[0];

    if (
      className ||
      academicYear ||
      term
    ) {
      await client.query(
        `
          INSERT INTO skul_enrollments (
            school_id,
            student_pk,
            academic_year,
            term,
            class_name
          )
          VALUES ($1,$2,$3,$4,$5)
        `,
        [
          SCHOOL_ID,
          student.id,
          academicYear || null,
          term || null,
          className || null,
        ]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      student,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Unable to add student.",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

/*
|--------------------------------------------------------------------------
| EDIT STUDENT
|--------------------------------------------------------------------------
*/

router.put("/:id", async (req, res) => {
  try {
    await ensureDatabase();

    const studentId =
      Number(req.params.id);

    const {
      studentName,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      enrollmentDate,
      status,
      className,
      academicYear,
      term,
    } = req.body;

    const result =
      await pool.query(
        `
          UPDATE skul_students
          SET
            student_name = $1,
            first_name = $2,
            last_name = $3,
            date_of_birth = $4,
            gender = $5,
            enrollment_date = $6,
            status = $7,
            updated_at = NOW()
          WHERE id = $8
          AND school_id = $9
          RETURNING *
        `,
        [
          studentName,
          firstName || null,
          lastName || null,
          dateOfBirth || null,
          gender || null,
          enrollmentDate || null,
          status || "active",
          studentId,
          SCHOOL_ID,
        ]
      );

    if (!result.rows[0]) {
      return res.status(404).json({
        success: false,
        message:
          "Student was not found.",
      });
    }

    if (
      className ||
      academicYear ||
      term
    ) {
      await pool.query(
        `
          INSERT INTO skul_enrollments (
            school_id,
            student_pk,
            academic_year,
            term,
            class_name
          )
          VALUES ($1,$2,$3,$4,$5)
          ON CONFLICT (
            school_id,
            student_pk,
            academic_year,
            term,
            class_name
          )
          DO NOTHING
        `,
        [
          SCHOOL_ID,
          studentId,
          academicYear || null,
          term || null,
          className || null,
        ]
      );
    }

    res.json({
      success: true,
      student: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Unable to update student.",
      error: error.message,
    });
  }
});

export default router;