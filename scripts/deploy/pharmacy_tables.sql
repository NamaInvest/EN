CREATE TABLE IF NOT EXISTS pharmacy_drugs (
  id SERIAL PRIMARY KEY,
  product_id INT UNIQUE NOT NULL REFERENCES products(id),
  sfda_number TEXT NOT NULL,
  generic_name TEXT NOT NULL,
  generic_name_en TEXT DEFAULT '',
  drug_class TEXT DEFAULT 'OTC',
  manufacturer TEXT,
  country_of_origin TEXT,
  storage_temp TEXT DEFAULT 'room',
  moh_max_price FLOAT DEFAULT 0,
  requires_rx BOOLEAN DEFAULT FALSE,
  is_controlled BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pharmacy_patients (
  id SERIAL PRIMARY KEY,
  national_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_en TEXT,
  date_of_birth TEXT,
  gender TEXT,
  phone TEXT,
  allergies TEXT,
  insurance_company TEXT,
  insurance_card_no TEXT,
  copay_percent FLOAT DEFAULT 20,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id SERIAL PRIMARY KEY,
  patient_id INT NOT NULL REFERENCES pharmacy_patients(id),
  wasfaty_ref TEXT,
  doctor_name TEXT,
  doctor_license TEXT,
  clinic_name TEXT,
  prescription_date TEXT NOT NULL,
  expiry_date TEXT,
  source TEXT DEFAULT 'wasfaty',
  status TEXT DEFAULT 'pending',
  image_url TEXT,
  pharmacist_id INT REFERENCES users(id),
  dispensed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prescription_items (
  id SERIAL PRIMARY KEY,
  prescription_id INT NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  drug_id INT NOT NULL REFERENCES pharmacy_drugs(id),
  drug_name TEXT NOT NULL,
  dosage TEXT,
  duration_days INT,
  quantity FLOAT NOT NULL,
  dispensed_qty FLOAT DEFAULT 0,
  status TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS insurance_claims (
  id SERIAL PRIMARY KEY,
  patient_id INT NOT NULL REFERENCES pharmacy_patients(id),
  prescription_id INT REFERENCES prescriptions(id),
  sales_invoice_id INT,
  insurance_company TEXT NOT NULL,
  claim_ref TEXT UNIQUE,
  total_amount FLOAT NOT NULL,
  insurance_amount FLOAT NOT NULL,
  patient_amount FLOAT NOT NULL,
  status TEXT DEFAULT 'submitted',
  rejection_reason TEXT,
  submitted_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS controlled_drug_logs (
  id SERIAL PRIMARY KEY,
  drug_id INT NOT NULL REFERENCES pharmacy_drugs(id),
  patient_national_id TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  doctor_license TEXT NOT NULL,
  pharmacist_id INT NOT NULL REFERENCES users(id),
  quantity FLOAT NOT NULL,
  batch_no TEXT,
  dispensed_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medication_logs (
  id SERIAL PRIMARY KEY,
  patient_id INT NOT NULL REFERENCES pharmacy_patients(id),
  drug_name TEXT NOT NULL,
  dosage TEXT,
  quantity FLOAT NOT NULL,
  pharmacist_id INT REFERENCES users(id),
  dispensed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_drugs_sfda ON pharmacy_drugs(sfda_number);
CREATE INDEX IF NOT EXISTS idx_pharmacy_drugs_generic ON pharmacy_drugs(generic_name);
CREATE INDEX IF NOT EXISTS idx_pharmacy_patients_nid ON pharmacy_patients(national_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_status ON insurance_claims(status);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_patient ON insurance_claims(patient_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_patient ON medication_logs(patient_id);
