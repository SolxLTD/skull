import {
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  School,
} from "lucide-react";

import AdminLayout from "./AdminLayout";

function ClassesSubjects() {
  const sections = [
    {
      title: "Kindergarten",
      classes: [
        "Kindergarten 1",
        "Kindergarten 2",
        "Kindergarten 3",
      ],
    },
    {
      title: "Nursery",
      classes: [
        "Nursery 1",
        "Nursery 2",
        "Nursery 3",
      ],
    },
    {
      title: "Primary",
      classes: [
        "Primary 1",
        "Primary 2",
        "Primary 3",
        "Primary 4",
        "Primary 5",
        "Primary 6",
      ],
    },
    {
      title: "Secondary",
      classes: [
        "JSS 1",
        "JSS 2",
        "JSS 3",
        "SS 1",
        "SS 2",
        "SS 3",
      ],
    },
  ];

  return (
    <AdminLayout
      title="Classes & Subjects"
      breadcrumb="SKUL / Classes & Subjects"
    >
      <div className="module-header">
        <div>
          <h2>Classes & Subjects</h2>
          <p>
            Manage the school's classes, subjects and curriculum.
          </p>
        </div>

        <div className="module-actions">
          <button className="secondary-button">
            <BookOpen size={17} />
            Add Subject
          </button>

          <button className="primary-button">
            <Plus size={17} />
            Add Class
          </button>
        </div>
      </div>

      <div className="curriculum-grid">
        {sections.map((section) => (
          <div className="curriculum-card" key={section.title}>
            <div className="curriculum-header">
              <div>
                <h3>{section.title}</h3>
                <span>
                  {section.classes.length} classes
                </span>
              </div>

              <School size={22} />
            </div>

            <div className="class-list">
              {section.classes.map((className) => (
                <div className="class-row" key={className}>
                  <span>{className}</span>

                  <div className="row-actions">
                    <button title="Edit">
                      <Pencil size={15} />
                    </button>

                    <button title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="table-card curriculum-subjects">
        <div className="card-header">
          <div className="card-title">
            <div className="card-icon">
              <BookOpen size={21} />
            </div>

            <div>
              <h3>School Subjects</h3>
              <p>Subjects configured for the school.</p>
            </div>
          </div>
        </div>

        <div className="empty-module-small">
          No subjects have been configured yet.
        </div>
      </div>
    </AdminLayout>
  );
}

export default ClassesSubjects;