# MediCore HMS — Hospital Management System

A full-stack Hospital Management System.

- **Backend**: Node.js + Express + MongoDB (Mongoose)
- **Frontend**: React (Vite) + React Router + Recharts + lucide-react icons
- **Auth**: JWT, 11 roles with route-level + UI-level permission checks
- **Modules**: All 27 modules from the spec — every one is backed by real MongoDB CRUD, not placeholder UI.

---

## 1. Prerequisites

- **Node.js** v18+ (check with `node -v`)
- **MongoDB** running locally, OR a MongoDB Atlas connection string
- **MongoDB Compass** (optional, for viewing your data visually)

---

## 2. Install MongoDB locally (if you don't have it)

- Download & install MongoDB Community Server: https://www.mongodb.com/try/download/community
- Start it. On most systems it runs automatically as a service on `mongodb://127.0.0.1:27017`.
- Alternatively, use a free MongoDB Atlas cluster (cloud) and copy its connection string.

---

## 3. Connect MongoDB Compass (GUI to view your data)

1. Open MongoDB Compass.
2. In the connection box, paste: `mongodb://127.0.0.1:27017` (or your Atlas URI).
3. Click **Connect**.
4. Once the backend has run at least once (or you've run the seed script), you'll see a database called **`hospital_management`** in the left sidebar with collections like `users`, `patients`, `appointments`, etc.
5. You can browse, edit, or delete documents directly from Compass — handy for debugging.

---

## 4. Backend setup

```bash
cd hms-backend
npm install
cp .env.example .env
```

Open `.env` and confirm/edit:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/hospital_management
JWT_SECRET=change_this_to_a_long_random_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

> If you're using MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string (looks like `mongodb+srv://user:password@cluster.mongodb.net/hospital_management`).

**Seed the database** (creates a login for every role + sample departments, doctors, wards, beds, medicines, lab tests):

```bash
npm run seed
```

You'll see output listing all the demo logins, e.g.:

```
Super Admin  -> admin@hms.com / Admin@123
Doctor       -> doctor1@hms.com / Doctor@123
Receptionist -> reception@hms.com / Reception@123
...
```

**Start the backend:**

```bash
npm run dev
```

You should see:
```
MongoDB Connected: 127.0.0.1/hospital_management
HMS API server running on port 5000
```

Test it's alive: open `http://localhost:5000/api/health` in a browser — you should see `{"success":true,"message":"HMS API is running"}`.

---

## 5. Frontend setup

Open a **second terminal**:

```bash
cd hms-frontend
npm install
cp .env.example .env
npm run dev
```

Vite will print a local URL, typically `http://localhost:5173`. Open it in your browser.

---

## 6. Log in

Use any of the seeded accounts. Easiest to start with:

- **Email:** `admin@hms.com`
- **Password:** `Admin@123`

This is the Super Admin — you'll see every module in the sidebar, the full admin dashboard, and the Export buttons (export is restricted to Super Admin & Hospital Admin only, as requested).

Try other roles to see the sidebar and dashboard change — e.g. log out and log in as `doctor1@hms.com / Doctor@123` to see the doctor's queue-focused dashboard, or `reception@hms.com / Reception@123` to book appointments.

---

## 7. Day-to-day workflow to try end-to-end

1. Log in as **Receptionist** → Patients → Add a new patient.
2. Book an **Appointment** for that patient with a doctor.
3. Log in as **Doctor** → see the appointment on the Dashboard → open **OPD**, record diagnosis → create a **Prescription**.
4. Log in as **Pharmacist** → **Pharmacy** → "New Sale" → select that prescription's medicines → stock quantity automatically decreases.
5. Log in as **Cashier/Accountant** → **Billing** → create an invoice, record a payment.
6. Log in as **Super Admin** → **Settings** → create a new staff account, or reset someone's password → **Reports** → export any module to CSV.

---

## 8. Project structure

```
hms-backend/
  server.js                 — app entry point, registers all routes
  src/
    config/                 — roles, role groups, db connection
    models/                 — one Mongoose schema per module (25+ files)
    middleware/              — JWT auth, role guard, error handler
    controllers/
      crudFactory.js        — generic list/create/update/delete/export used by most modules
      *Controller.js        — hand-written business logic (appointments, admissions, pharmacy sales, invoices, dashboard, auth)
    routes/                 — one file per module, wired to role permissions
    seed/seed.js             — demo data generator

hms-frontend/
  src/
    theme/global.css         — design tokens: the ONLY 4 font sizes used app-wide
    config/modules.js        — single source of truth: every sidebar module, its icon, fields, and role permissions
    api/axios.js              — API client with JWT auto-attach + 401 handling
    context/AuthContext.jsx   — login/logout/profile state
    components/
      layout/                — Sidebar, Topbar, AppLayout (shell used on every page)
      common/                — DataTable, FormModal, StatCard, ProtectedRoute (shared across all module pages)
    pages/
      ModulePage.jsx          — generic page (table + add/edit modal) used by ~15 of the simpler modules
      Dashboard.jsx, Appointments.jsx, IPD.jsx, Pharmacy.jsx, Billing.jsx,
      Prescriptions.jsx, Staff.jsx, Reports.jsx, Documents.jsx, Profile.jsx, Settings.jsx
                               — hand-built pages for modules with real workflow logic beyond plain CRUD
```

### Why some modules share one generic page

Modules like Departments, Beds, Insurance, Surgery, Blood Bank, Ambulance, Inventory, Accounts, and Notifications all follow the exact same "table + add/edit form" shape. Rather than duplicating that UI 15 times, `ModulePage.jsx` renders it once, driven entirely by the config for each module in `config/modules.js`. This keeps the codebase small and consistent — to add a brand-new simple module later, you add one object to `modules.js` and one route file on the backend; no new UI code needed.

Modules with real multi-step logic (booking a slot, allocating a bed, deducting pharmacy stock, calculating an invoice) have their own hand-built page.

---

## 9. Security notes (per your requirements)

- **Export is restricted**: the `/export/csv` route on every module checks the user's role server-side (not just hidden in the UI) — only `super_admin` and `hospital_admin` can call it.
- **All API routes require a valid JWT** except `/api/auth/login`.
- **Role checks happen on the backend**, not just the frontend — hiding a button in the sidebar is a UX nicety, but every request is re-validated by the `authorize()` middleware server-side.
- **Passwords** are hashed with bcrypt before storage; the raw password is never returned by the API (`toJSON` strips it).
- **Activity logs**: logins, logouts, creates, updates, deletes, and exports are all written to the `ActivityLog` collection for audit purposes — viewable by admins under Reports/Activity.

---

## 10. Troubleshooting

- **"MongoDB connection error"** — make sure MongoDB is actually running (`mongod` process), or that your Atlas URI/IP allowlist is correct.
- **Frontend shows "Network Error" on login** — check the backend terminal is running on port 5000, and that `hms-frontend/.env`'s `VITE_API_URL` matches.
- **CORS errors** — confirm `CLIENT_URL` in `hms-backend/.env` matches the URL Vite printed (default `http://localhost:5173`).
- **"jwt malformed" / instantly logged out** — clear your browser's localStorage for the site and log in again (can happen if `JWT_SECRET` changed after a token was issued).
