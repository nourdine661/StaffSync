import jwt from 'jsonwebtoken';
import { query } from './db.js';

const JWT_SECRET ='dev_secret_change_me';

export const protect = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization || '';
		if (!authHeader.startsWith('Bearer ')) {
			return res.status(401).json({ error: 'Not authorized, token missing' });
		}

		const token = authHeader.split(' ')[1];
		const decoded = jwt.verify(token, JWT_SECRET);
		const userId = decoded.id || decoded.userId;

		if (!userId) {
			return res.status(401).json({ error: 'Not authorized, invalid token payload' });
		}

		const result = await query(
			`SELECT e.id, e.first_name, e.last_name, e.email, e.role_id, r.name AS role
			 FROM employee e
			 LEFT JOIN roles r ON r.id = e.role_id
			 WHERE e.id = $1
			 LIMIT 1`,
			[userId]
		);

		if (result.rowCount === 0) {
			return res.status(401).json({ error: 'Not authorized, user not found' });
		}

		req.user = result.rows[0];
		next();
	} catch (error) {
		return res.status(401).json({ error: 'Not authorized, token failed' });
	}
};

export const authorize = (...roles) => {
	return (req, res, next) => {
		if (!req.user) {
			return res.status(401).json({ error: 'Not authorized' });
		}

		const userRole = req.user.role || 'employee';
		if (!roles.includes(userRole)) {
			return res.status(403).json({ error: 'Forbidden: insufficient role' });
		}

		next();
	};
};
