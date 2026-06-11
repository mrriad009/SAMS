# New Features to Develop

Planned additions to the Student Attendance Management System (SAMS). Each item below describes what will be built, how it works, and why it matters for the department.

---

## 1. Mobile Access

**Summary:** Phone-friendly app / PWA so CRs can mark attendance in class easily.

**Details:**
- Installable Progressive Web App (PWA) — works from the home screen like a native app
- Layouts optimized for small screens: attendance sheet, student list, routine, notifications
- Faster daily workflow for CRs — large buttons, quick present/absent toggles
- Students can check attendance, routine, and announcements on the go



---

## 2. Offline Mode

**Summary:** Mark attendance without internet; sync when connection returns.

**Details:**
- Download today’s session and student roster while online
- Mark present, absent, late, or excused with no connection
- Pending records stored locally and uploaded automatically when back online
- Clear indicator when data is saved locally vs. synced to the server



---

## 3. Push / SMS / Email Alerts

**Summary:** Low attendance warnings and announcements delivered outside the app.

**Details:**
- **Push notifications** — instant alerts on phone (low attendance, new announcements, class reminders)
- **Email alerts** — weekly defaulter summaries, leave request updates, important notices
- **SMS alerts** — critical messages for users who may not check the app regularly
- User preferences to control which alert types they receive



---

## 4. Leave Request Workflow

**Summary:** Students apply for leave; staff approve as excused.

**Details:**
- Student submits leave request: date(s), course(s), reason, optional supporting note
- Request status: pending → approved or rejected
- Staff (CR/teacher/admin) review requests from a filtered inbox by section/semester
- Approved absences automatically marked as **excused** in attendance records
- Student notified when a decision is made


---

## 5. QR Attendance

**Summary:** Quick check-in via session QR codes.

**Details:**
- CR or teacher generates a time-limited QR code for the current class session
- Students scan with their phone to register attendance
- QR expires after a set window (e.g. 10–15 minutes) to prevent misuse
- Manual marking remains available as a fallback
- Admin can view which attendance was QR-based vs. manually marked



---

## 6. PDF / Excel Export

**Summary:** Reports for department records and meetings.

**Details:**
- **PDF export** — formatted reports with filters applied (date range, section, course, defaulters)
- **Excel export** — raw data and summary sheets for further analysis
- Includes student name, roll, course, attendance %, and defaulter status
- Suitable for department meetings, accreditation records, and offline archives



---

## 7. Multi-Department Support

**Summary:** Scale beyond CSE if needed.

**Details:**
- Support multiple departments (e.g. CSE, EEE, BBA) in one system
- Each department has its own courses, routines, sections, and staff scope
- Filters and dashboards scoped by department
- Super-admin role to manage all departments from one panel



---


