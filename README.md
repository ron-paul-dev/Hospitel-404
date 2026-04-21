# 🏥 Hospital 404 — Full Stack Web Application

A complete hospital management system with Patient, Clinician, and Admin portals.

---

## 📁 Project Structure

```
hospital404/
├── server.js                    ← Node.js + Express backend (single server)
├── package.json
├── hospital404_db.sql           ← Run this FIRST to create the database
│
├── HTML/
│   ├── index.html               ← Landing page
│   ├── login.html               ← Login (Patient / Clinician / Admin)
│   ├── register.html            ← Register (Patient / Clinician)
│   ├── patient-dashboard.html   ← Patient portal
│   ├── Clinician_dashboard.html ← Clinician portal
│   └── admin.html               ← Admin portal
│
├── CSS/
│   ├── auth.css                 ← Login + Register styles
│   ├── index.css                ← Landing page styles
│   ├── patient-dashboard.css
│   ├── Clinician_dashboard.css
│   └── admin.css
│
├── JS/
│   ├── index.js
│   ├── patient-dashboard.js
│   ├── Clinician_dashboard.js
│   ├── admin.js
│   └── comments.js
│
└── FILES/
    ├── card1.png – card4.png    ← Feature card images
```

---

## 🚀 Setup Instructions

### Step 1 — Database Setup

Open MySQL and run:
```sql
SOURCE hospital404_db.sql;
```

Or via terminal:
```bash
mysql -u root -p < hospital404_db.sql
```

### Step 2 — Configure MySQL password

Open `server.js` and update line ~25:
```js
password: '',   // ← put your MySQL root password here
```

### Step 3 — Install dependencies

```bash
npm install
```

### Step 4 — Start the server

```bash
node server.js
# or for auto-reload during development:
npx nodemon server.js
```

### Step 5 — Open in browser

```
http://localhost:3000
```

---

## 🔐 Demo Login Credentials

All seed accounts use the password: **`password`**

| Role      | Email                        |
|-----------|------------------------------|
| Admin     | admin@hospital404.com        |
| Clinician | smith@hospital404.com        |
| Clinician | lee@hospital404.com          |
| Patient   | john@mail.com                |
| Patient   | emma@mail.com                |

> After registering a new account, use the actual password you set.

---

## 🔁 Routes & API

### Auth (Public)
| Method | Route                         | Description           |
|--------|-------------------------------|-----------------------|
| POST   | /api/auth/login               | Login all roles       |
| POST   | /api/auth/register/patient    | Register patient      |
| POST   | /api/auth/register/clinician  | Register clinician    |

### Admin (JWT required, role=admin)
| Method | Route               | Description         |
|--------|---------------------|---------------------|
| GET    | /api/stats          | Dashboard stats     |
| GET    | /api/users          | List all users      |
| POST   | /api/users          | Add user            |
| PUT    | /api/users/:id      | Edit user           |
| PATCH  | /api/users/:id/disable | Toggle status    |
| DELETE | /api/users/:id      | Delete user         |
| GET    | /api/system         | CPU/RAM/Storage     |

### Clinician (JWT required, role=clinician)
| Method | Route                     | Description           |
|--------|---------------------------|-----------------------|
| GET    | /api/appointments         | All appointments      |
| GET    | /api/patients             | All patients          |
| GET    | /api/feedback             | All feedback          |
| GET    | /api/comments/:ref        | Comments for patient  |
| POST   | /api/comments/:ref        | Add comment           |
| DELETE | /api/comments/:ref/:id    | Delete comment        |

### Patient (JWT required, role=patient)
| Method | Route                | Description             |
|--------|----------------------|-------------------------|
| GET    | /api/my/appointments | Own appointments        |
| GET    | /api/my/vitals       | Own vitals              |
| GET    | /api/my/comments     | Clinician notes for me  |
| POST   | /api/my/feedback     | Submit feedback         |

---

## 🛡️ Security

- Passwords hashed with **bcryptjs**
- Sessions managed via **JWT tokens** (8h expiry)
- Role-based access: each dashboard checks token role and redirects if wrong
- Tokens stored in `localStorage` under key `h404_token`

---

## 🧰 Tech Stack

| Layer     | Technology                  |
|-----------|-----------------------------|
| Frontend  | HTML5, CSS3, Vanilla JS     |
| Backend   | Node.js + Express           |
| Database  | MySQL (mysql2 driver)       |
| Auth      | JWT + bcryptjs              |
| Charts    | Chart.js (CDN)              |
| Fonts     | Google Fonts (DM Sans, Space Grotesk) |
