BEGIN;

CREATE SCHEMA IF NOT EXISTS public;
SET search_path TO public;

CREATE TABLE IF NOT EXISTS roles (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS employee (
	id BIGSERIAL PRIMARY KEY,
	first_name VARCHAR(100) NOT NULL,
	last_name VARCHAR(100) NOT NULL,
	email VARCHAR(255) NOT NULL UNIQUE,
	password_hash VARCHAR(255) NOT NULL,
	photo_url TEXT,
	role_id BIGINT REFERENCES roles(id) ON DELETE SET NULL,
	created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project (
	id BIGSERIAL PRIMARY KEY,
	employee_id BIGINT REFERENCES employee(id) ON DELETE SET NULL,
	department_name VARCHAR(255) NOT NULL,
	description TEXT,
	start_date TIMESTAMP NOT NULL,
	end_date TIMESTAMP,
	budget NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (budget >= 0),
	status BOOLEAN NOT NULL DEFAULT TRUE,
	CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS task (
	id BIGSERIAL PRIMARY KEY,
	title VARCHAR(100) NOT NULL,
	description TEXT,
	start_date TIMESTAMP NOT NULL,
	end_date TIMESTAMP,
	employee_id BIGINT REFERENCES employee(id) ON DELETE SET NULL,
	status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'done')),
	CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS presence (
	id BIGSERIAL PRIMARY KEY,
	employee_id BIGINT NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
	date_enter TIMESTAMP NOT NULL,
	date_end TIMESTAMP,
	overtime TIME NOT NULL DEFAULT '00:00:00',
	delay_min INT NOT NULL DEFAULT 0 CHECK (delay_min >= 0),
	CHECK (date_end IS NULL OR date_end >= date_enter)
);

CREATE TABLE IF NOT EXISTS performance (
	id BIGSERIAL PRIMARY KEY,
	employee_id BIGINT NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
	month_date DATE NOT NULL,
	augmentation NUMERIC(10, 2) NOT NULL DEFAULT 0,
	tasks_count INT NOT NULL DEFAULT 0 CHECK (tasks_count >= 0),
	deadlines_met INT NOT NULL DEFAULT 0 CHECK (deadlines_met >= 0),
	UNIQUE (employee_id, month_date)
);

CREATE TABLE IF NOT EXISTS employee_project (
	id BIGSERIAL PRIMARY KEY,
	project_id BIGINT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
	employee_id BIGINT NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
	UNIQUE (project_id, employee_id)
);

INSERT INTO roles (name)
VALUES ('admin'), ('employee')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE employee
ADD COLUMN IF NOT EXISTS role_id BIGINT;

-- Backfill new optional profile image field
ALTER TABLE employee
ADD COLUMN IF NOT EXISTS photo_url TEXT;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'employee_role_id_fkey'
	) THEN
		ALTER TABLE employee
		ADD CONSTRAINT employee_role_id_fkey
		FOREIGN KEY (role_id)
		REFERENCES roles(id)
		ON DELETE SET NULL;
	END IF;
END $$;

UPDATE employee e
SET role_id = r.id
FROM roles r
WHERE e.role_id IS NULL
AND r.name = 'employee';

-- Task status support for non-binary states
ALTER TABLE task
ADD COLUMN IF NOT EXISTS status TEXT;

-- Constrain and default the status column if it exists (idempotent safe guards)
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'task_status_check'
	) THEN
		ALTER TABLE task
			ADD CONSTRAINT task_status_check CHECK (status IN ('not_started', 'in_progress', 'done'));
	END IF;
END $$;

ALTER TABLE task ALTER COLUMN status SET DEFAULT 'not_started';
ALTER TABLE task ALTER COLUMN status SET NOT NULL;

-- Remove deprecated is_completed column
ALTER TABLE task
DROP COLUMN IF EXISTS is_completed;

-- Project description support
ALTER TABLE project
ADD COLUMN IF NOT EXISTS description TEXT;

CREATE INDEX IF NOT EXISTS idx_presence_employee_id ON presence(employee_id);
CREATE INDEX IF NOT EXISTS idx_task_employee_id ON task(employee_id);
CREATE INDEX IF NOT EXISTS idx_project_employee_id ON project(employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_employee_id ON performance(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_project_project_id ON employee_project(project_id);
CREATE INDEX IF NOT EXISTS idx_employee_project_employee_id ON employee_project(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_role_id ON employee(role_id);

COMMIT;
