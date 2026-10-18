-- Initial schema for the SLIATE study-bot extension.
-- Apply through a migration process after reviewing the deployment database.

CREATE TABLE IF NOT EXISTS sliate_students (
  id BIGSERIAL PRIMARY KEY,
  whatsapp_number TEXT NOT NULL UNIQUE,
  course_code TEXT NOT NULL CHECK (course_code IN ('IT','THM','M','A','BA')),
  semester TEXT,
  opted_in_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sliate_resources (
  id BIGSERIAL PRIMARY KEY,
  course_code TEXT NOT NULL CHECK (course_code IN ('IT','THM','M','A','BA')),
  module_name TEXT NOT NULL,
  title TEXT NOT NULL,
  source_url TEXT,
  stored_path TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('official_link','uploaded_pdf','notes')),
  source_version TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sliate_questions (
  id BIGSERIAL PRIMARY KEY,
  course_code TEXT NOT NULL CHECK (course_code IN ('IT','THM','M','A','BA')),
  module_name TEXT NOT NULL,
  semester TEXT,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option TEXT NOT NULL,
  explanation TEXT NOT NULL,
  resource_id BIGINT REFERENCES sliate_resources(id) ON DELETE SET NULL,
  source_locator TEXT,
  reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sliate_quiz_attempts (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES sliate_students(id) ON DELETE CASCADE,
  question_id BIGINT NOT NULL REFERENCES sliate_questions(id) ON DELETE CASCADE,
  selected_option TEXT,
  is_correct BOOLEAN,
  sent_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ,
  UNIQUE(student_id, question_id)
);

CREATE TABLE IF NOT EXISTS sliate_delivery_log (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT REFERENCES sliate_students(id) ON DELETE SET NULL,
  course_code TEXT NOT NULL CHECK (course_code IN ('IT','THM','M','A','BA')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sliate_questions_course_module_idx
  ON sliate_questions(course_code, module_name, semester)
  WHERE active = TRUE AND reviewed = TRUE;

CREATE INDEX IF NOT EXISTS sliate_attempts_student_idx
  ON sliate_quiz_attempts(student_id, answered_at DESC);

-- Prevent duplicate scheduled batches after process restarts.
CREATE UNIQUE INDEX IF NOT EXISTS sliate_delivery_once_per_student_batch_idx
  ON sliate_delivery_log(student_id, course_code, scheduled_for);
