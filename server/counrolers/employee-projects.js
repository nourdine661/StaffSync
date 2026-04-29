import { query } from '../db.js';

const parseId = (value) => {
	const id = Number(value);
	return Number.isInteger(id) && id > 0 ? id : null;
};

export const listEmployeeProjects = async (req, res) => {
	try {
		const result = await query('SELECT * FROM employee_project ORDER BY id ASC');
		return res.json(result.rows);
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};

export const getEmployeeProjectById = async (req, res) => {
	const id = parseId(req.params.id);
	if (!id) return res.status(400).json({ error: 'Invalid id' });

	try {
		const result = await query('SELECT * FROM employee_project WHERE id = $1', [id]);
		if (result.rowCount === 0) return res.status(404).json({ error: 'employee_project not found' });
		return res.json(result.rows[0]);
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};

export const createEmployeeProject = async (req, res) => {
	const { project_id, employee_id } = req.body || {};

	if (!project_id || !employee_id) {
		return res.status(400).json({ error: 'Missing required fields: project_id, employee_id' });
	}

	try {
		const result = await query(
			'INSERT INTO employee_project (project_id, employee_id) VALUES ($1, $2) RETURNING *',
			[project_id, employee_id]
		);
		return res.status(201).json(result.rows[0]);
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};

export const updateEmployeeProject = async (req, res) => {
	const id = parseId(req.params.id);
	if (!id) return res.status(400).json({ error: 'Invalid id' });

	const { project_id, employee_id } = req.body || {};

	try {
		const result = await query(
			`UPDATE employee_project
			 SET project_id = COALESCE($1, project_id),
					 employee_id = COALESCE($2, employee_id)
			 WHERE id = $3
			 RETURNING *`,
			[project_id ?? null, employee_id ?? null, id]
		);

		if (result.rowCount === 0) return res.status(404).json({ error: 'employee_project not found' });
		return res.json(result.rows[0]);
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};

export const deleteEmployeeProject = async (req, res) => {
	const id = parseId(req.params.id);
	if (!id) return res.status(400).json({ error: 'Invalid id' });

	try {
		const result = await query('DELETE FROM employee_project WHERE id = $1 RETURNING *', [id]);
		if (result.rowCount === 0) return res.status(404).json({ error: 'employee_project not found' });
		return res.json({ message: 'employee_project deleted', data: result.rows[0] });
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};
