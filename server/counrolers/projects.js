import { query } from '../db.js';

const parseId = (value) => {
	const id = Number(value);
	return Number.isInteger(id) && id > 0 ? id : null;
};

export const listProjects = async (req, res) => {
	try {
		const result = await query('SELECT * FROM project ORDER BY id ASC');
		return res.json(result.rows);
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};

export const getMyProjects = async (req, res) => {
	const employeeId = req.user?.id;

	if (!employeeId) {
		return res.status(401).json({ error: 'Not authorized, user missing' });
	}

	try {
		const result = await query(
			`SELECT DISTINCT p.*
			 FROM project p
			 LEFT JOIN employee_project ep ON ep.project_id = p.id
			 WHERE p.employee_id = $1 OR ep.employee_id = $1
			 ORDER BY p.id ASC`,
			[employeeId]
		);
		return res.json(result.rows);
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};

export const getMyProjectById = async (req, res) => {
	const employeeId = req.user?.id;
	const id = parseId(req.params.id);

	if (!employeeId) {
		return res.status(401).json({ error: 'Not authorized, user missing' });
	}

	if (!id) return res.status(400).json({ error: 'Invalid id' });

	try {
		const result = await query(
			`SELECT DISTINCT p.*
			 FROM project p
			 LEFT JOIN employee_project ep ON ep.project_id = p.id
			 WHERE p.id = $1 AND (p.employee_id = $2 OR ep.employee_id = $2)
			 LIMIT 1`,
			[id, employeeId]
		);

		if (result.rowCount === 0) return res.status(404).json({ error: 'project not found' });
		return res.json(result.rows[0]);
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};

export const getProjectById = async (req, res) => {
	const id = parseId(req.params.id);
	if (!id) return res.status(400).json({ error: 'Invalid id' });

	try {
		const result = await query('SELECT * FROM project WHERE id = $1', [id]);
		if (result.rowCount === 0) return res.status(404).json({ error: 'project not found' });
		return res.json(result.rows[0]);
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};

export const createProject = async (req, res) => {
	const { employee_id, department_name, description, start_date, end_date, budget, status } = req.body || {};

	if (!department_name || !start_date) {
		return res.status(400).json({ error: 'Missing required fields: department_name, start_date' });
	}

	try {
		const result = await query(
			`INSERT INTO project (employee_id, department_name, description, start_date, end_date, budget, status)
			 VALUES ($1, $2, $3, $4, $5, $6, $7)
			 RETURNING *`,
			[employee_id ?? null, department_name, description ?? null, start_date, end_date ?? null, budget ?? 0, status ?? true]
		);
		return res.status(201).json(result.rows[0]);
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};

export const updateProject = async (req, res) => {
	const id = parseId(req.params.id);
	if (!id) return res.status(400).json({ error: 'Invalid id' });

	const { employee_id, department_name, description, start_date, end_date, budget, status } = req.body || {};

	try {
		const result = await query(
			`UPDATE project
			 SET employee_id = COALESCE($1, employee_id),
					 department_name = COALESCE($2, department_name),
				 description = COALESCE($3, description),
				 start_date = COALESCE($4, start_date),
				 end_date = COALESCE($5, end_date),
				 budget = COALESCE($6, budget),
				 status = COALESCE($7, status)
			 WHERE id = $8
			 RETURNING *`,
			[
				employee_id ?? null,
				department_name ?? null,
				description ?? null,
				start_date ?? null,
				end_date ?? null,
				budget ?? null,
				status ?? null,
				id
			]
		);

		if (result.rowCount === 0) return res.status(404).json({ error: 'project not found' });
		return res.json(result.rows[0]);
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};

export const deleteProject = async (req, res) => {
	const id = parseId(req.params.id);
	if (!id) return res.status(400).json({ error: 'Invalid id' });

	try {
		const result = await query('DELETE FROM project WHERE id = $1 RETURNING *', [id]);
		if (result.rowCount === 0) return res.status(404).json({ error: 'project not found' });
		return res.json({ message: 'project deleted', data: result.rows[0] });
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};
