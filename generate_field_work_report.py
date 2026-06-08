#!/usr/bin/env python3
"""Generate CSE 4100 Field Work report in NUBTK guideline format."""

from docx import Document
from docx.shared import Pt, Inches, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.section import WD_ORIENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement


def set_document_defaults(doc):
    section = doc.sections[0]
    section.page_height = Cm(29.7)
    section.page_width = Cm(21.0)
    section.orientation = WD_ORIENT.PORTRAIT
    section.top_margin = Inches(1)
    section.bottom_margin = Inches(1)
    section.left_margin = Inches(1.25)
    section.right_margin = Inches(1.25)

    style = doc.styles["Normal"]
    font = style.font
    font.name = "Times New Roman"
    font.size = Pt(12)
    style._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
    pf = style.paragraph_format
    pf.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
    pf.space_after = Pt(6)


def add_paragraph(doc, text, *, bold=False, size=12, align=WD_ALIGN_PARAGRAPH.JUSTIFY, indent=0):
    p = doc.add_paragraph()
    p.alignment = align
    if indent:
        p.paragraph_format.left_indent = Inches(indent)
    run = p.add_run(text)
    run.bold = bold
    run.font.name = "Times New Roman"
    run.font.size = Pt(size)
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
    return p


def add_blank_lines(doc, count=1):
    for _ in range(count):
        doc.add_paragraph()


def add_page_break(doc):
    doc.add_page_break()


def add_centered_title(doc, text, size=14, bold=True, blanks_before=0, blanks_after=2):
    add_blank_lines(doc, blanks_before)
    add_paragraph(doc, text, bold=bold, size=size, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_blank_lines(doc, blanks_after)


def add_chapter(doc, number, title):
    add_page_break(doc)
    add_centered_title(doc, f"CHAPTER {number}", size=14, bold=True, blanks_before=0, blanks_after=2)
    add_centered_title(doc, title, size=14, bold=True, blanks_before=0, blanks_after=2)


def add_section(doc, text, level=1):
    indent = 0
    if level == 2:
        indent = 0.25
    elif level == 3:
        indent = 0.5
    add_paragraph(doc, text, bold=True, align=WD_ALIGN_PARAGRAPH.JUSTIFY, indent=indent)


def add_body(doc, text):
    add_paragraph(doc, text)


def build_report():
    doc = Document()
    set_document_defaults(doc)

    # ==================== TITLE PAGE ====================
    add_centered_title(
        doc,
        "Development of a Student Attendance Management System for University CSE Department",
        size=14,
        blanks_before=4,
        blanks_after=3,
    )
    add_paragraph(doc, "by", align=WD_ALIGN_PARAGRAPH.CENTER)
    add_blank_lines(doc, 1)
    add_paragraph(doc, "Md Mahamudul Islam Riad", bold=True, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_paragraph(doc, "ID: 11220320898", align=WD_ALIGN_PARAGRAPH.CENTER)
    add_blank_lines(doc, 2)
    add_paragraph(doc, "CSE 4100", align=WD_ALIGN_PARAGRAPH.CENTER)
    add_paragraph(doc, "Field Work / Industrial Training", align=WD_ALIGN_PARAGRAPH.CENTER)
    add_blank_lines(doc, 2)
    add_paragraph(doc, "Department of Computer Science and Engineering", align=WD_ALIGN_PARAGRAPH.CENTER)
    add_paragraph(doc, "Northern University of Business and Technology Khulna", align=WD_ALIGN_PARAGRAPH.CENTER)
    add_paragraph(doc, "Khulna 9100, Bangladesh", align=WD_ALIGN_PARAGRAPH.CENTER)
    add_blank_lines(doc, 1)
    add_paragraph(doc, "[Submission Month, Year]", bold=True, align=WD_ALIGN_PARAGRAPH.CENTER)

    # ==================== DECLARATION ====================
    add_page_break(doc)
    add_centered_title(doc, "Declaration", blanks_before=0, blanks_after=2)
    add_body(
        doc,
        'This is to certify that the Field Work / Industrial Training work entitled '
        '"Development of a Student Attendance Management System for University CSE Department" '
        "has been carried out by Md Mahamudul Islam Riad in the Department of Computer Science "
        "and Engineering, Northern University of Business and Technology Khulna, Khulna 9100, "
        "Bangladesh. The above Field Work / Industrial Training work or any part of this work "
        "has not been submitted anywhere for the award of any degree or diploma.",
    )
    add_blank_lines(doc, 2)
    add_paragraph(doc, "Signature of the Supervisor", align=WD_ALIGN_PARAGRAPH.LEFT)
    add_paragraph(doc, "Signature of the Student", align=WD_ALIGN_PARAGRAPH.LEFT)
    add_blank_lines(doc, 1)
    add_paragraph(doc, "[Name of the Supervisor]", align=WD_ALIGN_PARAGRAPH.LEFT)
    add_paragraph(doc, "[Designation]", align=WD_ALIGN_PARAGRAPH.LEFT)
    add_paragraph(doc, "Department of Computer Science and Engineering", align=WD_ALIGN_PARAGRAPH.LEFT)
    add_paragraph(doc, "Northern University of Business and Technology Khulna", align=WD_ALIGN_PARAGRAPH.LEFT)
    add_paragraph(doc, "Khulna 9100, Bangladesh", align=WD_ALIGN_PARAGRAPH.LEFT)
    add_blank_lines(doc, 1)
    add_paragraph(doc, "Md Mahamudul Islam Riad", align=WD_ALIGN_PARAGRAPH.LEFT)
    add_paragraph(doc, "11220320898", align=WD_ALIGN_PARAGRAPH.LEFT)
    add_paragraph(doc, "[Section]", align=WD_ALIGN_PARAGRAPH.LEFT)

    # ==================== ACKNOWLEDGEMENT ====================
    add_page_break(doc)
    add_centered_title(doc, "Acknowledgement", blanks_before=0, blanks_after=2)
    add_body(
        doc,
        "First of all, I would like to express my sincere gratitude to Almighty Allah for giving me "
        "the strength, patience, and opportunity to complete this field work report successfully.",
    )
    add_body(
        doc,
        "I am deeply thankful to my supervisor, [Name of the Supervisor], [Designation], Department of "
        "Computer Science and Engineering, Northern University of Business and Technology Khulna, for "
        "guiding me throughout this training period. Their valuable suggestions, continuous support, "
        "and constructive feedback helped me stay on the right track and improve the quality of my work.",
    )
    add_body(
        doc,
        "I would also like to thank the faculty members and staff of the CSE department for their "
        "cooperation during the development and testing phase of the attendance management system. "
        "Their practical insights about daily classroom operations made it easier for me to understand "
        "real problems and design useful solutions.",
    )
    add_body(
        doc,
        "Special thanks go to my classmates, especially the class representatives, who shared their "
        "experience with manual attendance tracking and helped me validate whether the system was "
        "actually usable in a real academic environment.",
    )
    add_body(
        doc,
        "Finally, I am grateful to my family and friends for their encouragement and moral support "
        "during this field work journey.",
    )
    add_blank_lines(doc, 2)
    add_paragraph(doc, "Md Mahamudul Islam Riad", align=WD_ALIGN_PARAGRAPH.RIGHT)
    add_paragraph(doc, "[Submission Month, Year]", align=WD_ALIGN_PARAGRAPH.RIGHT)

    # ==================== CONTENTS ====================
    add_page_break(doc)
    add_centered_title(doc, "Contents", blanks_before=0, blanks_after=2)

    contents = [
        ("Title Page", "i"),
        ("Declaration", "ii"),
        ("Acknowledgement", "iii"),
        ("Contents", "iv"),
        ("List of Tables", "v"),
        ("List of Figures", "vi"),
        ("List of Abbreviations", "vii"),
        ("CHAPTER I  Introduction", "1"),
        ("    1.1  Introduction", "1"),
        ("    1.2  Motivation", "2"),
        ("    1.3  Objectives and Specific Aims", "3"),
        ("    1.4  Organization of the Report", "4"),
        ("CHAPTER II  Procedure / Methodology", "5"),
        ("    2.1  Requirements Analysis", "5"),
        ("    2.2  System Architecture and Design", "7"),
        ("    2.3  Technology Stack", "8"),
        ("    2.4  Database Design", "10"),
        ("    2.5  Development and Implementation Process", "11"),
        ("CHAPTER III  Results and Discussion", "14"),
        ("    3.1  Implemented System Modules", "14"),
        ("    3.2  Role-Based Features and Workflows", "16"),
        ("    3.3  Testing and Validation", "18"),
        ("    3.4  Challenges and Limitations", "19"),
        ("CHAPTER IV  Conclusions and Recommendations", "21"),
        ("    4.1  Conclusion", "21"),
        ("    4.2  Learning Outcomes", "22"),
        ("    4.3  Recommendations", "23"),
        ("References", "25"),
    ]
    for left, right in contents:
        p = doc.add_paragraph()
        p.paragraph_format.tab_stops.add_tab_stop(Inches(6.0))
        run_l = p.add_run(left)
        run_l.font.name = "Times New Roman"
        run_l.font.size = Pt(12)
        run_l.bold = left.startswith("CHAPTER")
        run_r = p.add_run("\t" + right)
        run_r.font.name = "Times New Roman"
        run_r.font.size = Pt(12)

    # ==================== LIST OF TABLES ====================
    add_page_break(doc)
    add_centered_title(doc, "List of Tables", blanks_before=0, blanks_after=2)
    tables_list = [
        ("2.1", "Technology Stack Summary", "8"),
        ("2.2", "User Roles and Permission Matrix", "9"),
        ("3.1", "Core System Modules and Description", "14"),
        ("3.2", "Attendance Status Types", "17"),
    ]
    for num, desc, page in tables_list:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r1 = p.add_run(f"{num}\t{desc}\t{page}")
        r1.font.name = "Times New Roman"
        r1.font.size = Pt(12)

    # ==================== LIST OF FIGURES ====================
    add_page_break(doc)
    add_centered_title(doc, "List of Figures", blanks_before=0, blanks_after=2)
    figures_list = [
        ("2.1", "Three-Tier System Architecture", "7"),
        ("2.2", "Authentication and Session Flow", "10"),
        ("3.1", "Attendance Marking Workflow", "16"),
        ("3.2", "Student Portal Dashboard Overview", "18"),
    ]
    for num, desc, page in figures_list:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r1 = p.add_run(f"{num}\t{desc}\t{page}")
        r1.font.name = "Times New Roman"
        r1.font.size = Pt(12)

    # ==================== LIST OF ABBREVIATIONS ====================
    add_page_break(doc)
    add_centered_title(doc, "List of Abbreviations", blanks_before=0, blanks_after=2)
    abbrevs = [
        ("API", "Application Programming Interface"),
        ("CR", "Class Representative"),
        ("CSE", "Computer Science and Engineering"),
        ("CRUD", "Create, Read, Update, Delete"),
        ("JWT", "JSON Web Token"),
        ("NUBTK", "Northern University of Business and Technology Khulna"),
        ("ORM", "Object-Relational Mapping"),
        ("REST", "Representational State Transfer"),
        ("UI", "User Interface"),
        ("UX", "User Experience"),
    ]
    for short, full in abbrevs:
        p = doc.add_paragraph()
        r1 = p.add_run(f"{short}\t\t{full}")
        r1.font.name = "Times New Roman"
        r1.font.size = Pt(12)

    # ==================== CHAPTER I ====================
    add_chapter(doc, "I", "Introduction")

    add_section(doc, "1.1 Introduction")
    add_body(
        doc,
        "In most universities, class attendance is still one of the most important academic requirements. "
        "It is directly connected with exam eligibility, academic monitoring, and overall student discipline. "
        "However, in many CSE departments, attendance is still managed through paper registers, Excel sheets, "
        "or informal group messages. These methods may work for a short time, but they become difficult to "
        "maintain when the number of students, courses, and sections increases.",
    )
    add_body(
        doc,
        "During my field work, I worked on developing a full-stack Student Attendance Management System "
        "for the Computer Science and Engineering department. The system is designed to support daily "
        "attendance marking, course enrollment, class routines, announcements, reports, and public student "
        "lookup. It also supports role-based access for administrators, class representatives (CRs), teachers, "
        "and students. The project was developed with practical academic use in mind, especially for "
        "department-level operations at Northern University of Business and Technology Khulna (NUBTK).",
    )
    add_body(
        doc,
        "This report presents the complete journey of the project — from problem identification and system "
        "planning to implementation, testing, and final observations. The goal is not only to describe what "
        "was built, but also to explain why each part of the system was necessary and how it can help improve "
        "attendance management in a real university environment.",
    )

    add_section(doc, "1.2 Motivation")
    add_body(
        doc,
        "The main motivation behind this project came from the everyday problems faced by students, CRs, and "
        "faculty members. In manual systems, attendance records are often delayed, misplaced, or inconsistently "
        "updated. Sometimes a student cannot easily check their own attendance percentage before an exam. "
        "Similarly, teachers and CRs waste valuable class time collecting attendance on paper instead of "
        "starting the lecture on time.",
    )
    add_body(
        doc,
        "Another important issue is transparency. When attendance data is stored in separate notebooks or "
        "private spreadsheets, students may not get quick access to their own records. This creates confusion "
        "and increases the number of complaints near exam periods. A centralized digital system can reduce "
        "these problems by keeping all attendance records in one place and making them available based on user role.",
    )
    add_body(
        doc,
        "I was also motivated by the need for a system that matches real university structure. A CSE department "
        "does not only need a simple present/absent list. It needs semester-wise sections, course-based sessions, "
        "routine management, CR-level access, reporting tools, and student self-service features. This field work "
        "gave me the opportunity to build a solution that is closer to real institutional needs rather than a "
        "generic classroom demo application.",
    )

    add_section(doc, "1.3 Objectives and Specific Aims")
    add_body(
        doc,
        "The general objective of this field work was to design and implement a reliable web-based attendance "
        "management system for a university CSE department. The system should reduce manual work, improve data "
        "accuracy, and provide useful attendance insights to both staff and students.",
    )

    add_section(doc, "1.3.1 Specific Aims", level=2)
    aims = [
        "To analyze the attendance management workflow of a CSE department and identify its major limitations.",
        "To design a role-based system for admin, teacher/CR, student, and public users.",
        "To develop a secure authentication system using JWT access tokens and refresh cookies.",
        "To implement attendance marking by class session with support for present, absent, late, and excused statuses.",
        "To build student, course, routine, announcement, and reporting modules in one integrated platform.",
        "To support NUBTK academic structures such as semesters, sections, faculty data, and CR accounts.",
        "To test the system in a development environment and evaluate its usability for real academic use.",
    ]
    for aim in aims:
        add_body(doc, f"• {aim}")

    add_section(doc, "1.4 Organization of the Report")
    add_body(
        doc,
        "This report is organized into four main chapters. Chapter I introduces the background, motivation, "
        "and objectives of the project. Chapter II explains the methodology used during requirements analysis, "
        "system design, technology selection, and implementation. Chapter III discusses the developed features, "
        "workflows, testing results, and limitations. Chapter IV concludes the field work, summarizes learning "
        "outcomes, and provides recommendations for future improvement.",
    )

    # ==================== CHAPTER II ====================
    add_chapter(doc, "II", "Procedure / Methodology")

    add_section(doc, "2.1 Requirements Analysis")
    add_body(
        doc,
        "The first step of the project was to understand how attendance is actually managed in a CSE department. "
        "I studied the existing process used by class representatives and faculty members. From this study, "
        "the following major requirements were identified:",
    )
    reqs = [
        "Staff should be able to mark attendance quickly during or after class.",
        "CR accounts should only access their own semester and section.",
        "Students should be able to view their attendance history and percentage.",
        "Admins should be able to manage students, courses, routines, and reports.",
        "Attendance data should be stored course-wise and session-wise.",
        "The system should support announcements and academic routine viewing.",
        "A public lookup feature should allow basic attendance checking by student ID.",
    ]
    for req in reqs:
        add_body(doc, f"• {req}")
    add_body(
        doc,
        "After collecting these requirements, they were grouped into functional requirements (attendance, "
        "enrollment, reports, announcements) and non-functional requirements (security, performance, usability, "
        "and maintainability). This helped create a clear development plan before coding started.",
    )

    add_section(doc, "2.2 System Architecture and Design")
    add_body(
        doc,
        "The system follows a three-tier architecture consisting of a React frontend, an Express backend, "
        "and a PostgreSQL database hosted on NeonDB. The frontend handles user interaction, the backend "
        "handles business logic and security, and the database stores academic and attendance data.",
    )
    add_paragraph(doc, "Fig. 2.1: Three-Tier System Architecture", align=WD_ALIGN_PARAGRAPH.CENTER)
    add_body(
        doc,
        "The frontend uses TanStack Query for server-state management and Zustand for authentication state. "
        "The backend is organized into routes, controllers, services, and middleware layers. This separation "
        "makes the codebase easier to maintain and allows each part of the system to be updated independently.",
    )
    add_body(
        doc,
        "The application also supports two UI modes: general mode and advanced mode. General mode is attendance-focused "
        "and suitable for quick daily use by CRs. Advanced mode provides the full admin and teacher dashboard with "
        "complete navigation for courses, routines, settings, and analytics.",
    )

    add_section(doc, "2.3 Technology Stack")
    add_body(
        doc,
        "Technology selection was done based on development speed, community support, scalability, and suitability "
        "for a full-stack academic project. Table 2.1 summarizes the main technologies used in this project.",
    )
    add_paragraph(doc, "Table 2.1: Technology Stack Summary", align=WD_ALIGN_PARAGRAPH.CENTER)
    stack_rows = [
        "Frontend | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui",
        "State Management | Zustand, TanStack Query",
        "Backend | Node.js, Express 5, TypeScript",
        "Database | PostgreSQL (NeonDB) with Drizzle ORM",
        "Authentication | JWT access token + HTTP-only refresh cookie",
        "Security | Helmet, CORS, bcrypt, express-rate-limit, Zod validation",
        "Optional Services | Cloudinary (avatars), Resend (password reset email)",
    ]
    for row in stack_rows:
        add_body(doc, f"• {row}")

    add_paragraph(doc, "Table 2.2: User Roles and Permission Matrix", align=WD_ALIGN_PARAGRAPH.CENTER)
    add_body(
        doc,
        "The system defines four main user groups: Admin, Teacher/CR, Student, and Public. Admin has full "
        "control over students, courses, attendance on any date, reports, and settings. Teacher and CR users "
        "can access the staff panel but only within their assigned scope. They can mark attendance only for "
        "the current date. Students can manage their profile, view attendance, enroll in courses, and read "
        "announcements. Public users can search students by roll number without logging in.",
    )

    add_section(doc, "2.4 Database Design")
    add_body(
        doc,
        "The database schema was designed to reflect real academic relationships. Main tables include users, "
        "students, teachers, courses, student_courses, class_sessions, attendance, announcements, class_routine, "
        "and system_settings. Supporting tables such as refresh_tokens, password_reset_tokens, notifications, "
        "academic_faculty, and section_representatives were also included.",
    )
    add_body(
        doc,
        "The attendance table stores one record per student per class session. This unique constraint prevents "
        "duplicate entries and keeps attendance data consistent. Course enrollment is handled through the "
        "student_courses table, which ensures that only enrolled students appear on a session attendance sheet.",
    )

    add_section(doc, "2.5 Development and Implementation Process")
    add_body(
        doc,
        "The development process was carried out in stages. First, the database schema and authentication flow "
        "were implemented. Then core modules such as student management, course management, and attendance "
        "marking were built. After that, secondary modules like announcements, routine, reports, and public "
        "lookup were added.",
    )
    add_paragraph(doc, "Fig. 2.2: Authentication and Session Flow", align=WD_ALIGN_PARAGRAPH.CENTER)
    add_body(
        doc,
        "During implementation, server-side validation and role checks were applied on every sensitive route. "
        "For example, a CR account cannot change system settings, delete students, or mark attendance for "
        "another section. These restrictions were enforced in middleware and service layers, not only in the UI.",
    )
    add_body(
        doc,
        "NUBTK-specific data such as course catalogs, class routines, faculty records, section representatives, "
        "and CR accounts were imported using seed scripts from parsed markdown sources. This made it possible "
        "to test the system with realistic academic data instead of dummy placeholders.",
    )
    add_body(
        doc,
        "The field work was conducted at [Organization / Training Location Name] from [Start Date] to [End Date]. "
        "Daily tasks included requirement review, feature implementation, debugging, interface improvement, "
        "and documentation of progress.",
    )

    # ==================== CHAPTER III ====================
    add_chapter(doc, "III", "Results and Discussion")

    add_section(doc, "3.1 Implemented System Modules")
    add_body(
        doc,
        "By the end of the field work period, a working full-stack attendance management platform was developed. "
        "Table 3.1 lists the major modules and their purpose.",
    )
    add_paragraph(doc, "Table 3.1: Core System Modules and Description", align=WD_ALIGN_PARAGRAPH.CENTER)
    modules = [
        "Authentication Module | Login, logout, token refresh, password reset, student registration",
        "Attendance Module | Session-based attendance sheets with calendar navigation",
        "Student Module | Profile management, attendance history, course enrollment",
        "Course Module | Course catalog, teacher assignment, enrollment management",
        "Routine Module | Weekly class schedule viewing and management",
        "Announcement Module | Targeted notices for all, department, or section",
        "Report Module | Attendance trends, defaulter lists, course-wise statistics",
        "Public Lookup Module | Student search and public attendance summary",
        "Settings Module | Attendance threshold, academic year, semester, app mode",
    ]
    for mod in modules:
        add_body(doc, f"• {mod}")

    add_section(doc, "3.2 Role-Based Features and Workflows")
    add_body(
        doc,
        "One of the most useful results of this project is the attendance marking workflow. Staff users select "
        "semester, section, course, and date, then mark each enrolled student as present, absent, late, or excused. "
        "In general mode, the attendance page is simplified for fast daily use with a calendar strip and quick toggles.",
    )
    add_paragraph(doc, "Fig. 3.1: Attendance Marking Workflow", align=WD_ALIGN_PARAGRAPH.CENTER)
    add_paragraph(doc, "Table 3.2: Attendance Status Types", align=WD_ALIGN_PARAGRAPH.CENTER)
    statuses = [
        "Present | Student attended the class",
        "Absent | Student did not attend the class",
        "Late | Student attended but after the allowed time",
        "Excused | Student was absent with valid approval",
    ]
    for st in statuses:
        add_body(doc, f"• {st}")

    add_body(
        doc,
        "The student portal provides a dashboard with attendance summary, enrolled courses, routine, and "
        "announcements. This gives students direct visibility into their academic standing without needing "
        "to contact the CR for every update.",
    )
    add_paragraph(doc, "Fig. 3.2: Student Portal Dashboard Overview", align=WD_ALIGN_PARAGRAPH.CENTER)
    add_body(
        doc,
        "The reporting module allows staff to filter attendance by course, section, semester, and date range. "
        "It can generate course-wise percentages, 30-day trend data, and a list of students below the attendance "
        "threshold. The default threshold is 75%, but it can be changed from system settings.",
    )

    add_section(doc, "3.3 Testing and Validation")
    add_body(
        doc,
        "Testing was performed through manual functional testing in the development environment. The main test "
        "areas included login and role redirection, attendance submission, CR scope restriction, student enrollment, "
        "announcement targeting, and public student lookup.",
    )
    add_body(
        doc,
        "Sample test results showed that the system correctly prevents a CR from marking attendance for another "
        "section, blocks teachers from submitting past-date attendance, and calculates attendance percentages "
        "based on session records. Seed data for NUBTK courses, routines, and section 8E students helped make "
        "the testing process more realistic.",
    )
    add_body(
        doc,
        "Although formal unit testing and production deployment testing were not fully completed within the "
        "field work period, the current implementation is stable enough for controlled academic pilot use. "
        "Further testing is recommended before full department-wide adoption.",
    )

    add_section(doc, "3.4 Challenges and Limitations")
    add_body(
        doc,
        "Several challenges appeared during development. One challenge was designing flexible role permissions "
        "that work for both admin and CR users without making the interface confusing. Another challenge was "
        "importing large academic datasets from markdown sources into structured database tables.",
    )
    add_body(
        doc,
        "Some limitations also remain. The system currently depends on manual attendance marking by staff rather "
        "than biometric or RFID integration. Email-based password reset requires external service configuration. "
        "Full mobile optimization and offline support were not completed in this phase. In addition, real deployment "
        "on production servers with complete user onboarding was outside the immediate scope of this field work.",
    )

    # ==================== CHAPTER IV ====================
    add_chapter(doc, "IV", "Conclusions and Recommendations")

    add_section(doc, "4.1 Conclusion")
    add_body(
        doc,
        "This field work successfully resulted in the development of a practical Student Attendance Management "
        "System for a university CSE department. The project addressed common problems of manual attendance tracking "
        "by providing a centralized, role-based, and web-accessible solution.",
    )
    add_body(
        doc,
        "The implemented system supports attendance marking, student and course management, routine scheduling, "
        "announcements, reporting, and public lookup. It is especially suitable for departments that operate "
        "with multiple semesters and sections, such as the CSE department at NUBTK. Overall, the project "
        "shows that a well-structured digital attendance platform can save time, improve transparency, and "
        "support better academic monitoring.",
    )

    add_section(doc, "4.2 Learning Outcomes")
    add_body(
        doc,
        "This field work gave me valuable hands-on experience in full-stack web development. I learned how to "
        "convert a real institutional problem into software requirements and then into working modules.",
    )
    outcomes = [
        "Practical experience in React, TypeScript, Express, and PostgreSQL development.",
        "Better understanding of authentication, authorization, and secure API design.",
        "Experience in database modeling for academic systems.",
        "Knowledge of role-based access control in real applications.",
        "Improved skill in debugging, code organization, and feature-based development.",
        "Greater awareness of how software should match actual user workflow in an academic setting.",
    ]
    for outcome in outcomes:
        add_body(doc, f"• {outcome}")

    add_section(doc, "4.3 Recommendations")
    add_body(
        doc,
        "Based on the work completed and the challenges observed, the following recommendations are suggested "
        "for future development:",
    )
    recs = [
        "Deploy the system on production hosting and run a pilot program with selected sections.",
        "Add biometric, QR code, or RFID-based attendance capture to reduce manual input.",
        "Develop a dedicated mobile application for CRs and students.",
        "Introduce automated email/SMS alerts for low attendance and important announcements.",
        "Add export options for PDF and Excel attendance reports.",
        "Conduct formal usability testing with faculty members and students before full rollout.",
        "Prepare complete user manuals and training sessions for admin and CR accounts.",
    ]
    for rec in recs:
        add_body(doc, f"• {rec}")

    # ==================== REFERENCES ====================
    add_page_break(doc)
    add_centered_title(doc, "References", size=12, bold=True, blanks_before=0, blanks_after=2)
    references = [
        'R. Fielding, "Architectural Styles and the Design of Network-based Software Architectures," Ph.D. dissertation, Univ. of California, Irvine, 2000.',
        'M. Fowler, Patterns of Enterprise Application Architecture. Boston, MA, USA: Addison-Wesley, 2002.',
        'I. Sommerville, Software Engineering, 10th ed. Boston, MA, USA: Pearson, 2016.',
        'D. Flanagan, JavaScript: The Definitive Guide, 7th ed. Sebastopol, CA, USA: O\'Reilly Media, 2020.',
        'PostgreSQL Global Development Group, "PostgreSQL Documentation," 2025. [Online]. Available: https://www.postgresql.org/docs/',
        'Drizzle Team, "Drizzle ORM Documentation," 2025. [Online]. Available: https://orm.drizzle.team/docs/overview',
        'Meta Open Source, "React Documentation," 2025. [Online]. Available: https://react.dev/',
        'OpenJS Foundation, "Express.js Guide," 2025. [Online]. Available: https://expressjs.com/',
    ]
    for ref in references:
        add_body(doc, ref)

    output_path = "/Users/captainx/Downloads/Attendence Management/CSE4100_Field_Work_Report_Md_Mahamudul_Islam_Riad.docx"
    doc.save(output_path)
    print(f"Report saved to: {output_path}")


if __name__ == "__main__":
    build_report()
