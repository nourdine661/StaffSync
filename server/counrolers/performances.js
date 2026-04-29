import { query } from '../db.js';

const parseId = (value) => {
	const id = Number(value);
	return Number.isInteger(id) && id > 0 ? id : null;
};

export const listPerformances = async (req, res) => {
	try {
		const result = await query('SELECT * FROM performance ORDER BY id ASC');
		return res.json(result.rows);
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};

export const getMyPerformances = async (req, res) => {
	const employeeId = req.user?.id;

	if (!employeeId) {
		return res.status(401).json({ error: 'Not authorized, user missing' });
	}

	try {
		const result = await query('SELECT * FROM performance WHERE employee_id = $1 ORDER BY id ASC', [employeeId]);
		return res.json(result.rows);
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};

export const getPerformanceById = async (req, res) => {
	const id = parseId(req.params.id);
	if (!id) return res.status(400).json({ error: 'Invalid id' });

	try {
		const result = await query('SELECT * FROM performance WHERE id = $1', [id]);
		if (result.rowCount === 0) return res.status(404).json({ error: 'performance not found' });
		return res.json(result.rows[0]);
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};

export const createPerformance = async (req, res) => {
	const { employee_id, month_date, augmentation, tasks_count, deadlines_met } = req.body || {};

	if (!employee_id || !month_date) {
		return res.status(400).json({ error: 'Missing required fields: employee_id, month_date' });
	}

	try {
		const result = await query(
			`INSERT INTO performance (employee_id, month_date, augmentation, tasks_count, deadlines_met)
			 VALUES ($1, $2, $3, $4, $5)
			 RETURNING *`,
			[employee_id, month_date, augmentation ?? 0, tasks_count ?? 0, deadlines_met ?? 0]
		);
		return res.status(201).json(result.rows[0]);
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};

export const updatePerformance = async (req, res) => {
	const id = parseId(req.params.id);
	if (!id) return res.status(400).json({ error: 'Invalid id' });

	const { employee_id, month_date, augmentation, tasks_count, deadlines_met } = req.body || {};

	try {
		const result = await query(
			`UPDATE performance
			 SET employee_id = COALESCE($1, employee_id),
					 month_date = COALESCE($2, month_date),
					 augmentation = COALESCE($3, augmentation),
					 tasks_count = COALESCE($4, tasks_count),
					 deadlines_met = COALESCE($5, deadlines_met)
			 WHERE id = $6
			 RETURNING *`,
			[employee_id ?? null, month_date ?? null, augmentation ?? null, tasks_count ?? null, deadlines_met ?? null, id]
		);

		if (result.rowCount === 0) return res.status(404).json({ error: 'performance not found' });
		return res.json(result.rows[0]);
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};

export const deletePerformance = async (req, res) => {
	const id = parseId(req.params.id);
	if (!id) return res.status(400).json({ error: 'Invalid id' });

	try {
		const result = await query('DELETE FROM performance WHERE id = $1 RETURNING *', [id]);
		if (result.rowCount === 0) return res.status(404).json({ error: 'performance not found' });
		return res.json({ message: 'performance deleted', data: result.rows[0] });
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};
