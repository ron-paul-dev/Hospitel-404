-- ═══════════════════════════════════════════════════════════
--  HOSPITAL 404 — UNIFIED DATABASE SCHEMA
--  Run this once to create the full database
-- ═══════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS hospital404;
USE hospital404;

-- ── USERS (login for all roles) ─────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('admin','patient','clinician') NOT NULL,
  status     ENUM('Active','Disabled') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── DOCTORS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctors (
  doctor_id      INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT,
  name           VARCHAR(100) NOT NULL,
  specialization VARCHAR(100),
  email          VARCHAR(150),
  phone          VARCHAR(20),
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ── PATIENTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  patient_id  INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT,
  name        VARCHAR(100) NOT NULL,
  age         INT,
  gender      ENUM('Male','Female','Other'),
  dob         DATE,
  phone       VARCHAR(20),
  address     TEXT,
  blood_group VARCHAR(5),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ── TREATMENTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS treatments (
  treatment_id   INT AUTO_INCREMENT PRIMARY KEY,
  treatment_name VARCHAR(100) NOT NULL
);

-- ── APPOINTMENTS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  appointment_id   INT AUTO_INCREMENT PRIMARY KEY,
  patient_id       INT NOT NULL,
  doctor_id        INT NOT NULL,
  treatment_id     INT,
  appointment_date DATE NOT NULL,
  status           ENUM('Scheduled','Completed','Cancelled') DEFAULT 'Scheduled',
  notes            TEXT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id)   REFERENCES patients(patient_id)   ON DELETE CASCADE,
  FOREIGN KEY (doctor_id)    REFERENCES doctors(doctor_id)     ON DELETE CASCADE,
  FOREIGN KEY (treatment_id) REFERENCES treatments(treatment_id) ON DELETE SET NULL
);

-- ── PATIENT FEEDBACK ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS patient_feedback (
  feedback_id    INT AUTO_INCREMENT PRIMARY KEY,
  patient_id     INT NOT NULL,
  doctor_id      INT NOT NULL,
  appointment_id INT,
  rating         ENUM('Good','Average','Poor','Very Poor') NOT NULL,
  comments       TEXT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id)     REFERENCES patients(patient_id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id)      REFERENCES doctors(doctor_id)   ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE SET NULL
);

-- ── CLINICIAN COMMENTS (on patients) ──────────────────────
CREATE TABLE IF NOT EXISTS clinician_comments (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  patient_ref  VARCHAR(50) NOT NULL,
  author       VARCHAR(100) NOT NULL,
  category     ENUM('General','Medication','Diet','Exercise','Follow-up','Emergency') DEFAULT 'General',
  priority     ENUM('Normal','High','Critical') DEFAULT 'Normal',
  comment_text TEXT NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── PATIENT VITALS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patient_vitals (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  patient_id   INT NOT NULL,
  recorded_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  heart_rate   INT,
  bp_systolic  INT,
  bp_diastolic INT,
  temperature  DECIMAL(4,1),
  spo2         INT,
  weight       DECIMAL(5,2),
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
);

-- ── FEEDBACK REPLIES ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback_replies (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  feedback_id    INT NOT NULL,
  clinician_name VARCHAR(100) NOT NULL,
  reply_text     TEXT NOT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (feedback_id) REFERENCES patient_feedback(feedback_id) ON DELETE CASCADE
);

-- ═══════════════════════════════════════════════════════════
--  SEED DATA
-- ═══════════════════════════════════════════════════════════

-- Admin user (password: password)
INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@hospital404.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Sample clinician users (password: password)
INSERT INTO users (name, email, password, role) VALUES
('Dr. Smith',  'smith@hospital404.com',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'clinician'),
('Dr. Lee',    'lee@hospital404.com',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'clinician'),
('Dr. Kumar',  'kumar@hospital404.com',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'clinician'),
('Dr. Brown',  'brown@hospital404.com',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'clinician'),
('Dr. Clark',  'clark@hospital404.com',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'clinician'),
('Dr. Adams',  'adams@hospital404.com',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'clinician'),
('Dr. Miller', 'miller@hospital404.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'clinician'),
('Dr. Wilson', 'wilson@hospital404.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'clinician'),
('Dr. Taylor', 'taylor@hospital404.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'clinician'),
('Dr. Thomas', 'thomas@hospital404.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'clinician');

-- Sample patient users (password: password)
INSERT INTO users (name, email, password, role) VALUES
('John',    'john@mail.com',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'patient'),
('Emma',    'emma@mail.com',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'patient'),
('Raj',     'raj@mail.com',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'patient'),
('Sophia',  'sophia@mail.com',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'patient'),
('Arun',    'arun@mail.com',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'patient'),
('Olivia',  'olivia@mail.com',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'patient'),
('David',   'david@mail.com',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'patient'),
('Mia',     'mia@mail.com',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'patient'),
('Karthik', 'karthik@mail.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'patient'),
('Liam',    'liam@mail.com',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'patient');

-- Doctors (linked to user ids 2-11)
INSERT INTO doctors (user_id, name, specialization, email) VALUES
(2,  'Dr. Smith',  'General Medicine', 'smith@hospital404.com'),
(3,  'Dr. Lee',    'ENT',              'lee@hospital404.com'),
(4,  'Dr. Kumar',  'Orthopaedics',     'kumar@hospital404.com'),
(5,  'Dr. Brown',  'Endocrinology',    'brown@hospital404.com'),
(6,  'Dr. Clark',  'General Medicine', 'clark@hospital404.com'),
(7,  'Dr. Adams',  'Dermatology',      'adams@hospital404.com'),
(8,  'Dr. Miller', 'Cardiology',       'miller@hospital404.com'),
(9,  'Dr. Wilson', 'Neurology',        'wilson@hospital404.com'),
(10, 'Dr. Taylor', 'Orthopaedics',     'taylor@hospital404.com'),
(11, 'Dr. Thomas', 'Pulmonology',      'thomas@hospital404.com');

-- Patients (linked to user ids 12-21)
INSERT INTO patients (user_id, name, age, gender) VALUES
(12, 'John',    25, 'Male'),
(13, 'Emma',    30, 'Female'),
(14, 'Raj',     28, 'Male'),
(15, 'Sophia',  40, 'Female'),
(16, 'Arun',    35, 'Male'),
(17, 'Olivia',  22, 'Female'),
(18, 'David',   45, 'Male'),
(19, 'Mia',     33, 'Female'),
(20, 'Karthik', 27, 'Male'),
(21, 'Liam',    29, 'Male');

-- Treatments
INSERT INTO treatments (treatment_name) VALUES
('Fever'),('Cold'),('Injury'),('Diabetes'),('Flu'),
('Allergy'),('BP'),('Migraine'),('Fracture'),('Asthma');

-- Appointments
INSERT INTO appointments (patient_id, doctor_id, treatment_id, appointment_date, status) VALUES
(1,1,1,'2026-03-10','Completed'),(2,2,2,'2026-03-11','Completed'),
(3,3,3,'2026-03-12','Completed'),(4,4,4,'2026-03-13','Completed'),
(5,5,5,'2026-03-14','Completed'),(6,6,6,'2026-03-15','Scheduled'),
(7,7,7,'2026-03-16','Scheduled'),(8,8,8,'2026-03-17','Scheduled'),
(9,9,9,'2026-03-18','Scheduled'),(10,10,10,'2026-03-19','Scheduled');

-- Feedback
INSERT INTO patient_feedback (patient_id, doctor_id, appointment_id, rating, comments) VALUES
(1,1,1,'Good','Doctor was very attentive and helpful.'),
(2,2,2,'Good','Great experience, felt well taken care of.'),
(3,3,3,'Average','Waiting time was long but treatment was fine.'),
(4,4,4,'Good','Very professional staff and clean environment.'),
(5,5,5,'Poor','Had to wait too long and felt rushed.'),
(6,6,6,'Good','Excellent service, highly recommend Dr. Adams.'),
(7,7,7,'Average','Treatment was okay, could be better communication.'),
(8,8,8,'Good','Dr. Wilson explained everything clearly.'),
(9,9,9,'Very Poor','Long waiting time and poor communication.'),
(10,10,10,'Good','Smooth experience from start to finish.');

-- Sample vitals for patient 1
INSERT INTO patient_vitals (patient_id, heart_rate, bp_systolic, bp_diastolic, temperature, spo2, weight) VALUES
(1,72,120,80,36.6,98,70.0),(1,75,122,82,36.8,97,70.2),
(1,70,118,78,36.5,99,69.8),(1,78,125,83,37.0,98,70.5);