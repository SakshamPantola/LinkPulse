
const { query } = require('../db');

async function getTags(userId, role) {
  const isAdmin = role === 'admin';
  const filter = isAdmin ? '' : 'WHERE t.user_id = $1';
  const params = isAdmin ? [] : [userId];

  const { rows } = await query(
    `SELECT t.id, t.name, t.created_at,
            COUNT(lt.link_id)::int AS link_count
     FROM tags t
     LEFT JOIN link_tags lt ON lt.tag_id = t.id
     ${filter}
     GROUP BY t.id, t.name, t.created_at
     ORDER BY t.name ASC`,
    params
  );
  return rows;
}

async function createTag(userId, { name }) {
  if (!name || !name.trim()) {
    const err = new Error('Tag name is required');
    err.status = 400;
    throw err;
  }
  const cleanName = name.trim();
  const { rows } = await query(
    `INSERT INTO tags (user_id, name)
     VALUES ($1, $2)
     ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id, name, created_at`,
    [userId, cleanName]
  );
  return { ...rows[0], link_count: 0 };
}

async function deleteTag(tagId, userId, role) {
  const { rows: existing } = await query('SELECT * FROM tags WHERE id = $1', [tagId]);
  if (!existing.length) {
    const err = new Error('Tag not found');
    err.status = 404;
    throw err;
  }
  if (role !== 'admin' && existing[0].user_id !== userId) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  await query('DELETE FROM tags WHERE id = $1', [tagId]);
  return { message: 'Tag deleted successfully' };
}

async function attachTagToLink(linkId, userId, role, { name, tag_id }) {
  
  const { rows: linkRows } = await query('SELECT user_id FROM links WHERE id = $1', [linkId]);
  if (!linkRows.length) {
    const err = new Error('Link not found');
    err.status = 404;
    throw err;
  }
  if (role !== 'admin' && linkRows[0].user_id !== userId) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }

  let finalTagId = tag_id;
  if (!finalTagId && name) {
    const { rows: tagRows } = await query(
      `INSERT INTO tags (user_id, name) VALUES ($1, $2)
       ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [userId, name.trim()]
    );
    finalTagId = tagRows[0].id;
  }

  if (!finalTagId) {
    const err = new Error('Tag name or tag_id is required');
    err.status = 400;
    throw err;
  }

  await query(
    `INSERT INTO link_tags (link_id, tag_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [linkId, finalTagId]
  );

  return { message: 'Tag attached successfully', tag_id: finalTagId };
}

async function detachTagFromLink(linkId, tagId, userId, role) {
  const { rows: linkRows } = await query('SELECT user_id FROM links WHERE id = $1', [linkId]);
  if (!linkRows.length) {
    const err = new Error('Link not found');
    err.status = 404;
    throw err;
  }
  if (role !== 'admin' && linkRows[0].user_id !== userId) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }

  await query('DELETE FROM link_tags WHERE link_id = $1 AND tag_id = $2', [linkId, tagId]);
  return { message: 'Tag detached successfully' };
}

module.exports = {
  getTags,
  createTag,
  deleteTag,
  attachTagToLink,
  detachTagFromLink,
};
