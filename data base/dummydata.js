/*
	Demo seed script for this project.
	It resets table data (except roles definitions) and inserts realistic dummy data.

	Run from workspace root:
	node "data base/dummydata.js"
*/

const { Pool } = require('../server/node_modules/pg');
const dotenv = require('../server/node_modules/dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: '../server/.env', quiet: true });

const pool = new Pool({
	host: process.env.DB_HOST || 'localhost',
	port: Number(process.env.DB_PORT || 5432),
	database: process.env.DB_NAME || 'employees2',
	user: process.env.DB_USER || 'postgres',
	password: process.env.DB_PASSWORD || 'postgres'
});

const firstNames = ['Liam', 'Noah', 'Maya', 'Nora', 'Adam', 'Sara', 'Omar', 'Leila', 'Yassine', 'Hana'];
const lastNames = ['Smith', 'Johnson', 'Brown', 'Miller', 'Davis', 'Wilson', 'Taylor', 'Anderson', 'Thomas', 'Moore'];
const departments = ['Engineering', 'Product', 'Finance', 'Operations', 'HR', 'Marketing'];
const taskTitles = ['Client Report', 'Feature Delivery', 'Weekly Planning', 'Data Cleanup', 'Release Prep', 'UI Review'];

function randomItem(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

function dateOffset(days) {
	const d = new Date();
	d.setDate(d.getDate() + days);
	return d;
}

function toTimeString(hours, minutes = 0, seconds = 0) {
	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

async function seed() {
	const client = await pool.connect();

	try {
		const initSqlPath = path.join(__dirname, 'init_database.sql');
		const initSql = fs.readFileSync(initSqlPath, 'utf8');
		await client.query(initSql);

		await client.query('BEGIN');

		await client.query("INSERT INTO roles (name) VALUES ('admin'), ('employee') ON CONFLICT (name) DO NOTHING");

		const rolesResult = await client.query('SELECT id, name FROM roles');
		const roleMap = new Map(rolesResult.rows.map((r) => [r.name, r.id]));

		// Reset data so script can be re-run safely.
		await client.query('TRUNCATE TABLE employee_project, performance, presence, task, project, employee RESTART IDENTITY CASCADE');

		const employees = [];

		// Main admin account for testing admin dashboard.
		const adminResult = await client.query(
			`INSERT INTO employee (first_name, last_name, email, password_hash, role_id)
			 VALUES ($1, $2, $3, $4, $5)
			 RETURNING id, first_name, last_name, email`,
			['Boss', 'Admin', 'boss@company.com', 'boss123', roleMap.get('admin')]
		);
		employees.push(adminResult.rows[0]);

		// Employee accounts for testing /me and /my endpoints.
		for (let i = 0; i < 8; i += 1) {
			const first = firstNames[i % firstNames.length];
			const last = lastNames[i % lastNames.length];
			const email = `${first.toLowerCase()}.${last.toLowerCase()}${i + 1}@company.com`;
			const password = `emp${100 + i}`;

			const result = await client.query(
				`INSERT INTO employee (first_name, last_name, email, password_hash, role_id)
				 VALUES ($1, $2, $3, $4, $5)
				 RETURNING id, first_name, last_name, email`,
				[first, last, email, password, roleMap.get('employee')]
			);

			employees.push(result.rows[0]);
		}

		const projects = [];
		for (let i = 0; i < 10; i += 1) {
			const owner = employees[1 + (i % (employees.length - 1))];
			const start = dateOffset(-(80 - i * 5));
			const end = dateOffset(20 + i * 3);
			const budget = 12000 + i * 3500;

			const result = await client.query(
				`INSERT INTO project (employee_id, department_name, description, start_date, end_date, budget, status)
				 VALUES ($1, $2, $3, $4, $5, $6, $7)
				 RETURNING id, employee_id`,
				[
					owner.id,
					randomItem(departments),
					`Initiative ${i + 1} covering department objectives and milestones.`,
					start,
					end,
					budget,
					i % 4 !== 0
				]
			);

			projects.push(result.rows[0]);
		}

		for (let i = 0; i < 30; i += 1) {
			const assignee = employees[1 + (i % (employees.length - 1))];
			const start = dateOffset(-(30 - i));
			const end = dateOffset(i % 3 === 0 ? -1 : 10 + (i % 7));

			await client.query(
				`INSERT INTO task (title, description, start_date, end_date, employee_id, status)
				 VALUES ($1, $2, $3, $4, $5, $6)`,
				[
					`${randomItem(taskTitles)} #${i + 1}`,
					`Task ${i + 1} generated for demo dashboards and CRUD checks.`,
					start,
					end,
					assignee.id,
					i % 3 === 0 ? 'done' : 'in_progress'
				]
			);
		}

		for (let i = 0; i < 36; i += 1) {
			const employee = employees[1 + (i % (employees.length - 1))];
			const enter = dateOffset(-(i % 15));
			enter.setHours(8, (i % 4) * 5, 0, 0);

			const end = new Date(enter);
			end.setHours(17, (i % 3) * 10, 0, 0);

			await client.query(
				`INSERT INTO presence (employee_id, date_enter, date_end, overtime, delay_min)
				 VALUES ($1, $2, $3, $4, $5)`,
				[employee.id, enter, end, toTimeString(i % 3, (i % 2) * 15), i % 5 === 0 ? 10 : 0]
			);
		}

		const months = ['2026-01-01', '2026-02-01', '2026-03-01'];
		for (const monthDate of months) {
			for (let i = 1; i < employees.length; i += 1) {
				const employee = employees[i];
				await client.query(
					`INSERT INTO performance (employee_id, month_date, augmentation, tasks_count, deadlines_met)
					 VALUES ($1, $2, $3, $4, $5)
					 ON CONFLICT (employee_id, month_date) DO UPDATE
					 SET augmentation = EXCLUDED.augmentation,
							 tasks_count = EXCLUDED.tasks_count,
							 deadlines_met = EXCLUDED.deadlines_met`,
					[employee.id, monthDate, 100 + i * 12, 8 + i, 6 + (i % 4)]
				);
			}
		}

		for (const project of projects) {
			const ownerId = project.employee_id;
			const teammateA = employees[1 + (project.id % (employees.length - 1))].id;
			const teammateB = employees[1 + ((project.id + 2) % (employees.length - 1))].id;

			const uniqueIds = [...new Set([ownerId, teammateA, teammateB])];

			for (const employeeId of uniqueIds) {
				await client.query(
					`INSERT INTO employee_project (project_id, employee_id)
					 VALUES ($1, $2)
					 ON CONFLICT (project_id, employee_id) DO NOTHING`,
					[project.id, employeeId]
				);
			}
		}

		await client.query('COMMIT');

		console.log('Dummy data inserted successfully.');
		console.log('Admin login: boss@company.com / boss123');
		console.log('Employee login samples:');
		console.log('- liam.smith1@company.com / emp100');
		console.log('- noah.johnson2@company.com / emp101');
		console.log('- maya.brown3@company.com / emp102');
	} catch (error) {
		await client.query('ROLLBACK');
		console.error('Seeding failed:', error.message);
		process.exitCode = 1;
	} finally {
		client.release();
		await pool.end();
	}
}

seed();
