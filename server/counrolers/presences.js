import { query } from '../db.js';

const parseId = (value) => {
	const id = Number(value);
	return Number.isInteger(id) && id > 0 ? id : null;
};

const toHms = (secondsTotal) => {
	const total = Math.max(0, Math.min(Math.floor(secondsTotal), 24 * 3600 - 1));
	const h = String(Math.floor(total / 3600)).padStart(2, '0');
	const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
	const s = String(total % 60).padStart(2, '0');
	return `${h}:${m}:${s}`;
};

export const listPresences = async (req, res) => {
	try {
		const result = await query('SELECT * FROM presence ORDER BY id ASC');
		return res.json(result.rows);
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};

export const getMyPresences = async (req, res) => {
	const employeeId = req.user?.id;

	if (!employeeId) {
		return res.status(401).json({ error: 'Not authorized, user missing' });
	}

	try {
		const result = await query('SELECT * FROM presence WHERE employee_id = $1 ORDER BY id ASC', [employeeId]);
		return res.json(result.rows);
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};

export const startMyPresence = async (req, res) => {
	const employeeId = req.user?.id;

	if (!employeeId) {
		return res.status(401).json({ error: 'Not authorized, user missing' });
	}

	try {
		const open = await query('SELECT * FROM presence WHERE employee_id = $1 AND date_end IS NULL ORDER BY date_enter DESC LIMIT 1', [employeeId]);
		if (open.rowCount > 0) {
			return res.status(400).json({ error: 'Shift already started' });
		}

		const result = await query(
			`INSERT INTO presence (employee_id, date_enter, overtime, delay_min)
			 VALUES ($1, NOW(), '00:00:00', 0)
			 RETURNING *`,
			[employeeId]
		);

		return res.status(201).json(result.rows[0]);
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};

export const endMyPresence = async (req, res) => {
	const employeeId = req.user?.id;

	if (!employeeId) {
		return res.status(401).json({ error: 'Not authorized, user missing' });
	}

	try {
		const open = await query('SELECT * FROM presence WHERE employee_id = $1 AND date_end IS NULL ORDER BY date_enter DESC LIMIT 1', [employeeId]);
		if (open.rowCount === 0) {
			return res.status(400).json({ error: 'No active shift to end' });
		}

		const entry = open.rows[0];
		const start = new Date(entry.date_enter);
		let end = new Date();
		if (end < start) end = start;
		const scheduledStart = new Date(start);
		scheduledStart.setHours(8, 0, 0, 0);
		const scheduledEnd = new Date(start);
		scheduledEnd.setHours(16, 0, 0, 0);

		const delayMinutes = Math.max(0, Math.floor((start.getTime() - scheduledStart.getTime()) / 60000));
		const overtimeSeconds = Math.max(0, Math.floor((end.getTime() - scheduledEnd.getTime()) / 1000));
		const overtimeHms = toHms(overtimeSeconds);

		const result = await query('UPDATE presence SET date_end = NOW(), overtime = $1, delay_min = $2 WHERE id = $3 RETURNING *', [overtimeHms, delayMinutes, entry.id]);
		return res.json(result.rows[0]);
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};

export const getPresenceById = async (req, res) => {
	const id = parseId(req.params.id);
	if (!id) return res.status(400).json({ error: 'Invalid id' });

	try {
		const result = await query('SELECT * FROM presence WHERE id = $1', [id]);
		if (result.rowCount === 0) return res.status(404).json({ error: 'presence not found' });
		return res.json(result.rows[0]);
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};

export const createPresence = async (req, res) => {
	const { employee_id, date_enter, date_end, overtime, delay_min } = req.body || {};

	if (!employee_id || !date_enter) {
		return res.status(400).json({ error: 'Missing required fields: employee_id, date_enter' });
	}

	try {
		const result = await query(
			`INSERT INTO presence (employee_id, date_enter, date_end, overtime, delay_min)
			 VALUES ($1, $2, $3, $4, $5)
			 RETURNING *`,
			[employee_id, date_enter, date_end ?? null, overtime ?? '00:00:00', delay_min ?? 0]
		);
		return res.status(201).json(result.rows[0]);
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};

export const updatePresence = async (req, res) => {
	const id = parseId(req.params.id);
	if (!id) return res.status(400).json({ error: 'Invalid id' });

	const { employee_id, date_enter, date_end, overtime, delay_min } = req.body || {};

	try {
		const result = await query(
			`UPDATE presence
			 SET employee_id = COALESCE($1, employee_id),
					 date_enter = COALESCE($2, date_enter),
					 date_end = COALESCE($3, date_end),
					 overtime = COALESCE($4, overtime),
					 delay_min = COALESCE($5, delay_min)
			 WHERE id = $6
			 RETURNING *`,
			[employee_id ?? null, date_enter ?? null, date_end ?? null, overtime ?? null, delay_min ?? null, id]
		);

		if (result.rowCount === 0) return res.status(404).json({ error: 'presence not found' });
		return res.json(result.rows[0]);
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};

export const deletePresence = async (req, res) => {
	const id = parseId(req.params.id);
	if (!id) return res.status(400).json({ error: 'Invalid id' });

	try {
		const result = await query('DELETE FROM presence WHERE id = $1 RETURNING *', [id]);
		if (result.rowCount === 0) return res.status(404).json({ error: 'presence not found' });
		return res.json({ message: 'presence deleted', data: result.rows[0] });
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};
