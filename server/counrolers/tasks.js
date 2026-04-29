import { query } from '../db.js';

const VALID_STATUSES = ['not_started', 'in_progress', 'done'];

const parseId = (value) => {
	const id = Number(value);
	return Number.isInteger(id) && id > 0 ? id : null;
};

const normalizeStatus = (raw) => {
	if (!raw || typeof raw !== 'string') return null;
	const value = raw.toLowerCase();
	return VALID_STATUSES.includes(value) ? value : null;
};

export const listTasks = async (req, res) => {
	try {
		const result = await query('SELECT * FROM task ORDER BY id ASC');
		return res.json(result.rows);
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};

export const getMyTasks = async (req, res) => {
	const employeeId = req.user?.id;

	if (!employeeId) {
		return res.status(401).json({ error: 'Not authorized, user missing' });
	}

	try {
		const result = await query('SELECT * FROM task WHERE employee_id = $1 ORDER BY id ASC', [employeeId]);
		return res.json(result.rows);
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};

export const getMyTaskById = async (req, res) => {
	const employeeId = req.user?.id;
	const id = parseId(req.params.id);

	if (!employeeId) {
		return res.status(401).json({ error: 'Not authorized, user missing' });
	}

	if (!id) return res.status(400).json({ error: 'Invalid id' });

	try {
		const result = await query('SELECT * FROM task WHERE id = $1 AND employee_id = $2 LIMIT 1', [id, employeeId]);
		if (result.rowCount === 0) return res.status(404).json({ error: 'task not found' });
		return res.json(result.rows[0]);
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};

export const getTaskById = async (req, res) => {
	const id = parseId(req.params.id);
	if (!id) return res.status(400).json({ error: 'Invalid id' });

	try {
		const result = await query('SELECT * FROM task WHERE id = $1', [id]);
		if (result.rowCount === 0) return res.status(404).json({ error: 'task not found' });
		return res.json(result.rows[0]);
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};

export const createTask = async (req, res) => {
	const { title, description, start_date, end_date, employee_id, status } = req.body || {};

	if (!title || !start_date) {
		return res.status(400).json({ error: 'Missing required fields: title, start_date' });
	}

	const normalizedStatus = normalizeStatus(status) || 'not_started';

	try {
		const result = await query(
			`INSERT INTO task (title, description, start_date, end_date, employee_id, status)
			 VALUES ($1, $2, $3, $4, $5, $6)
			 RETURNING *`,
			[title, description ?? null, start_date, end_date ?? null, employee_id ?? null, normalizedStatus]
		);
		return res.status(201).json(result.rows[0]);
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};

export const updateTask = async (req, res) => {
	const id = parseId(req.params.id);
	if (!id) return res.status(400).json({ error: 'Invalid id' });

	const { title, description, start_date, end_date, employee_id, status } = req.body || {};
	const normalizedStatus = normalizeStatus(status);

	try {
		const result = await query(
			`UPDATE task
			 SET title = COALESCE($1, title),
					 description = COALESCE($2, description),
					 start_date = COALESCE($3, start_date),
					 end_date = COALESCE($4, end_date),
					 employee_id = COALESCE($5, employee_id),
				 status = COALESCE($6, status)
			 WHERE id = $7
			 RETURNING *`,
			[
				title ?? null,
				description ?? null,
				start_date ?? null,
				end_date ?? null,
				employee_id ?? null,
				normalizedStatus ?? null,
				id
			]
		);

		if (result.rowCount === 0) return res.status(404).json({ error: 'task not found' });
		return res.json(result.rows[0]);
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};

export const updateMyTaskStatus = async (req, res) => {
	const employeeId = req.user?.id;
	const id = parseId(req.params.id);
	const { status } = req.body || {};
	const normalizedStatus = normalizeStatus(status);

	if (!employeeId) {
		return res.status(401).json({ error: 'Not authorized, user missing' });
	}

	if (!id) return res.status(400).json({ error: 'Invalid id' });
	if (!normalizedStatus) return res.status(400).json({ error: 'Invalid status' });

	try {
		const ownerCheck = await query('SELECT employee_id FROM task WHERE id = $1 LIMIT 1', [id]);
		if (ownerCheck.rowCount === 0) return res.status(404).json({ error: 'task not found' });
		if (Number(ownerCheck.rows[0].employee_id) !== Number(employeeId)) {
			return res.status(403).json({ error: 'Forbidden: not your task' });
		}

		const result = await query(
			`UPDATE task
			 SET status = $1
			 WHERE id = $2
			 RETURNING *`,
			[normalizedStatus, id]
		);

		return res.json(result.rows[0]);
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};

export const deleteTask = async (req, res) => {
	const id = parseId(req.params.id);
	if (!id) return res.status(400).json({ error: 'Invalid id' });

	try {
		const result = await query('DELETE FROM task WHERE id = $1 RETURNING *', [id]);
		if (result.rowCount === 0) return res.status(404).json({ error: 'task not found' });
		return res.json({ message: 'task deleted', data: result.rows[0] });
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};
