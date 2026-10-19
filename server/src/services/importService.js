
const Papa = require('papaparse');
const { validateLink, createLink } = require('./linkService');
const { query } = require('../db');

async function importLinksFromCsv(userId, { csv, rows: inputRows, dryRun = true }) {
  let parsedRows = [];

  if (Array.isArray(inputRows) && inputRows.length > 0) {
    parsedRows = inputRows;
  } else if (typeof csv === 'string' && csv.trim()) {
    const parsed = Papa.parse(csv, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: h => h.trim().toLowerCase().replace(/[\s_-]+/g, '_'),
    });
    if (parsed.errors?.length && !parsed.data?.length) {
      const err = new Error(`CSV Parsing error: ${parsed.errors[0]?.message || 'Invalid CSV'}`);
      err.status = 400;
      throw err;
    }
    parsedRows = parsed.data;
  } else {
    const err = new Error('No CSV content or rows provided');
    err.status = 400;
    throw err;
  }

  const validRows = [];
  const errorRows = [];
  const seenAliasesInCsv = new Set();
  let duplicateCount = 0;

  for (let idx = 0; idx < parsedRows.length; idx++) {
    const raw = parsedRows[idx];
    const lineNumber = idx + 2; 

    const destination_url = (raw.destination_url || raw.url || raw.destination || '').trim();
    const alias = (raw.alias || raw.short_code || raw.custom_alias || '').trim() || undefined;
    const campaignName = (raw.campaign || raw.campaign_name || '').trim() || undefined;
    const expires_at_raw = (raw.expires_at || raw.expiry || raw.expires || '').trim() || undefined;

    const tagsRaw = raw.tags || raw.tag || '';
    const tags = typeof tagsRaw === 'string'
      ? tagsRaw.split(/[,;]+/).map(t => t.trim()).filter(Boolean)
      : Array.isArray(tagsRaw) ? tagsRaw : [];

    let expires_at = null;
    let expiryError = null;
    if (expires_at_raw) {
      const d = new Date(expires_at_raw);
      if (isNaN(d.getTime())) {
        expiryError = `Invalid date format for expires_at: "${expires_at_raw}"`;
      } else if (d < new Date()) {
        expiryError = `Expiry date "${expires_at_raw}" is in the past`;
      } else {
        expires_at = d.toISOString();
      }
    }

    const rowErrors = [];
    if (!destination_url) {
      rowErrors.push('Missing destination_url');
    }

    if (expiryError) {
      rowErrors.push(expiryError);
    }

    if (alias) {
      const lowerAlias = alias.toLowerCase();
      if (seenAliasesInCsv.has(lowerAlias)) {
        rowErrors.push(`Duplicate alias "${alias}" found within the CSV file`);
        duplicateCount += 1;
      } else {
        seenAliasesInCsv.add(lowerAlias);
      }
    }

    if (destination_url) {
      try {
        const valRes = await validateLink({ destination_url, alias });
        if (!valRes.valid) {
          rowErrors.push(...valRes.errors);
          if (valRes.errors.some(e => e.toLowerCase().includes('already taken'))) {
            duplicateCount += 1;
          }
        }
      } catch (err) {
        rowErrors.push(err.message);
      }
    }

    const normalizedRow = {
      line: lineNumber,
      destination_url,
      alias: alias || null,
      campaign: campaignName || null,
      tags,
      expires_at,
    };

    if (rowErrors.length > 0) {
      errorRows.push({
        ...normalizedRow,
        errors: rowErrors,
      });
    } else {
      validRows.push(normalizedRow);
    }
  }

  if (dryRun) {
    return {
      dryRun: true,
      summary: {
        total: parsedRows.length,
        valid: validRows.length,
        errors: errorRows.length,
        duplicates: duplicateCount,
      },
      validRows,
      errorRows,
      imported: [],
    };
  }

  const imported = [];
  const campaignCache = new Map(); 

  for (const item of validRows) {
    let campaign_id = null;

    if (item.campaign) {
      const campKey = item.campaign.toLowerCase();
      if (campaignCache.has(campKey)) {
        campaign_id = campaignCache.get(campKey);
      } else {
        
        const { rows: campRows } = await query(
          'SELECT id FROM campaigns WHERE user_id = $1 AND LOWER(name) = $2',
          [userId, campKey]
        );
        if (campRows.length) {
          campaign_id = campRows[0].id;
        } else {
          const { rows: newCamp } = await query(
            'INSERT INTO campaigns (user_id, name) VALUES ($1, $2) RETURNING id',
            [userId, item.campaign]
          );
          campaign_id = newCamp[0].id;
        }
        campaignCache.set(campKey, campaign_id);
      }
    }

    try {
      const created = await createLink(userId, {
        destination_url: item.destination_url,
        alias: item.alias || undefined,
        campaign_id: campaign_id || undefined,
        tags: item.tags,
        expires_at: item.expires_at || undefined,
      });
      imported.push({
        line: item.line,
        id: created.id,
        short_code: created.short_code,
        destination_url: created.destination_url,
      });
    } catch (err) {
      errorRows.push({
        ...item,
        errors: [err.message],
      });
    }
  }

  return {
    dryRun: false,
    summary: {
      total: parsedRows.length,
      valid: validRows.length,
      errors: errorRows.length,
      duplicates: duplicateCount,
      imported: imported.length,
    },
    validRows,
    errorRows,
    imported,
  };
}

module.exports = {
  importLinksFromCsv,
};
