# Candidate Task

## Problem

Model a folder & file structure where each folder and file has an owner.

### Requirements

- Folders can contain **files** and **other folders**
- Each **folder** can have one or more owners
- Each **file** can have one or more owners
- When clicking on a folder or file, show a **breadcrumb** showing the navigation path
- **Change parent** – When a folder or file is selected, allow the user to move it to a different parent folder (via a dropdown or similar control in the details panel)
- **CRUD** – Add, edit, and remove folders and files (e.g., via context menu)

Your implementation should support scenarios such as:
- Creating multiple levels of nesting (e.g., `Root > Documents > Projects > MyApp`)
- Moving folders and files between parents

### Notes

- **Database & queries** – We take care of database data and queries.
- **Scale** – Design for millions of files and folders.
- **Tree updates** – When the user changes parent, edits name, adds, or removes items, the tree view should update to reflect the change. We take care of this solution.

### Constraints

- Solve it in whatever way you think is best.
- Implement the full stack: schema, backend (GraphQL API), and frontend.
- **Do not use any extra libraries.** Use only what is already in the project.

### Deliverables

1. **Schema** – Prisma models in `backend/prisma/schema.prisma`
2. **Backend** – GraphQL resolvers to create, read, update, delete, and list folders/files (with owners); support for moving folders/files (updating parent)
3. **Frontend** – A minimal UI to browse the structure and see owners; breadcrumb when clicking a folder or file; details panel with change-parent control; add/edit/remove for folders and files

---

## Evaluation

You will be evaluated on:

- Data modeling choices
- Data load optimization
- Code clarity and structure
- Completeness of the implementation
