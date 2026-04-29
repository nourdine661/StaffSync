import { query } from '../db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const listEmployees = async (req, res) => {
  try {
    const result = await query(
      `SELECT e.id, e.first_name, e.last_name, e.email, e.photo_url, e.role_id, r.name AS role, e.created_at
       FROM employee e
       LEFT JOIN roles r ON r.id = e.role_id
       ORDER BY e.id ASC`
    );
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const loginEmployee = async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const result = await query(
      `SELECT e.id, e.first_name, e.last_name, e.email, e.photo_url, e.password_hash, e.role_id, r.name AS role
       FROM employee e
       LEFT JOIN roles r ON r.id = e.role_id
       WHERE e.email = $1
       LIMIT 1`,
      [email]
    );

    if (result.rowCount === 0 || result.rows[0].password_hash !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const employee = result.rows[0];
    const token = jwt.sign(
      { id: employee.id, role: employee.role || 'employee' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password_hash, ...safeEmployee } = employee;
    return res.json({ token, user: safeEmployee });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getEmployeeById = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  try {
    const result = await query('SELECT * FROM employee WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'employee not found' });
    }
    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getMyInfo = async (req, res) => {
  if (req.user?.id) {
    try {
      const result = await query(
        `SELECT e.id, e.first_name, e.last_name, e.email, e.photo_url, e.role_id, r.name AS role, e.created_at
         FROM employee e
         LEFT JOIN roles r ON r.id = e.role_id
         WHERE e.id = $1
         LIMIT 1`,
        [req.user.id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'employee not found' });
      }

      return res.json(result.rows[0]);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  const email = req.query.email ?? req.body?.email;
  const password = req.query.password ?? req.body?.password;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const result = await query(
      `SELECT e.id, e.first_name, e.last_name, e.email, e.photo_url, e.password_hash, e.role_id, r.name AS role, e.created_at
       FROM employee e
       LEFT JOIN roles r ON r.id = e.role_id
       WHERE e.email = $1
       LIMIT 1`,
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const employee = result.rows[0];

    // Plain-text comparison by request: password is stored as-is in DB.
    if (employee.password_hash !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { password_hash, ...safeEmployee } = employee;
    return res.json(safeEmployee);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const createEmployee = async (req, res) => {
  const { first_name, last_name, email, password_hash, role_id, photo_url } = req.body || {};

  if (!first_name || !last_name || !email || !password_hash) {
    return res.status(400).json({ error: 'Missing required fields: first_name, last_name, email, password_hash' });
  }

  try {
    const result = await query(
      'INSERT INTO employee (first_name, last_name, email, password_hash, role_id, photo_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [first_name, last_name, email, password_hash, role_id ?? null, photo_url ?? null]
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateEmployee = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  const { first_name, last_name, email, password_hash, role_id, photo_url } = req.body || {};

  try {
    const result = await query(
      `UPDATE employee
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           email = COALESCE($3, email),
           password_hash = COALESCE($4, password_hash),
           role_id = COALESCE($5, role_id),
           photo_url = COALESCE($6, photo_url)
       WHERE id = $7
       RETURNING *`,
      [first_name ?? null, last_name ?? null, email ?? null, password_hash ?? null, role_id ?? null, photo_url ?? null, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'employee not found' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteEmployee = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  try {
    const result = await query('DELETE FROM employee WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'employee not found' });
    }
    return res.json({ message: 'employee deleted', data: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateMyProfile = async (req, res) => {
  const id = req.user?.id;
  if (!id) {
    return res.status(401).json({ error: 'Not authorized' });
  }

  const { first_name, last_name, email, password_hash, photo_url } = req.body || {};

  if (!first_name && !last_name && !email && !password_hash && !photo_url) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  try {
    const result = await query(
      `UPDATE employee
       SET first_name = COALESCE($1, first_name),
         last_name = COALESCE($2, last_name),
         email = COALESCE($3, email),
         password_hash = COALESCE($4, password_hash),
         photo_url = COALESCE($5, photo_url)
       WHERE id = $6
       RETURNING id, first_name, last_name, email, photo_url, role_id, created_at`,
      [first_name ?? null, last_name ?? null, email ?? null, password_hash ?? null, photo_url ?? null, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'employee not found' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


