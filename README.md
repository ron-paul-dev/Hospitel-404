# Hospital 404

A hospital management web app I built with Node.js, Express and MySQL. It has three separate portals (patient, clinician and admin) behind a single login.

## Features

- One login for all three roles. Each dashboard checks the user's role from their token and redirects them if they're in the wrong place.
- Patients can see their appointments, vitals and notes from their clinician, and leave feedback.
- Clinicians can see appointments and patients, read feedback, and add or remove notes on a patient.
- Admins can add, edit, disable and delete users, and see some basic stats plus live CPU, RAM and storage usage of the server.
- Passwords are hashed with bcrypt and sessions use JWTs that expire after 8 hours.

## Built with

- Frontend: HTML, CSS, plain JavaScript, Chart.js
- Backend: Node.js, Express
- Database: MySQL (mysql2)
- Auth: jsonwebtoken, bcryptjs

## Running it locally

You'll need Node.js 20 or newer and MySQL.

```bash
npm install
mysql -u root -p < hospital404_db.sql
cp .env.example .env      # then put your MySQL password and a JWT secret in it
node --env-file=.env server.js
```

Then go to http://localhost:3000.

The SQL file adds some test accounts, all with the password `password`:

- Admin: admin@hospital404.com
- Clinician: smith@hospital404.com
- Patient: john@mail.com

## Project layout

```
server.js            Express server, API routes and auth
hospital404_db.sql   Database schema and test data
HTML/                Pages
CSS/                 Styles
JS/                  Front-end scripts
FILES/               Images
```

## API

Auth (public)
- POST /api/auth/login
- POST /api/auth/register/patient
- POST /api/auth/register/clinician

Admin
- GET /api/stats, GET /api/system
- GET, POST /api/users
- PUT, DELETE /api/users/:id
- PATCH /api/users/:id/disable

Clinician
- GET /api/appointments, /api/patients, /api/feedback
- GET, POST /api/comments/:ref
- DELETE /api/comments/:ref/:id

Patient
- GET /api/my/appointments, /api/my/vitals, /api/my/comments
- POST /api/my/feedback

## Testing

I tested it manually with 30+ test cases across the three roles and ran an OWASP ZAP scan, which came back with no high-severity issues.
