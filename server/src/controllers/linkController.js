
const linkService = require('../services/linkService');

async function validate(req, res, next) {
  try {
    const result = await linkService.validateLink(req.body);
    res.json(result);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const link = await linkService.createLink(req.user.id, req.body);
    res.status(201).json({ link });
  } catch (err) { next(err); }
}

async function list(req, res, next) {
  try {
    const { page, limit, search, tag } = req.query;
    const result = await linkService.getLinks(req.user.id, req.user.role, {
      page:   parseInt(page, 10) || 1,
      limit:  parseInt(limit, 10) || 20,
      search: search || '',
      tag:    tag || '',
    });
    res.json(result);
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const link = await linkService.getLinkById(req.params.id, req.user.id, req.user.role);
    res.json({ link });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const link = await linkService.updateLink(req.params.id, req.user.id, req.user.role, req.body);
    res.json({ link });
  } catch (err) { next(err); }
}

async function disable(req, res, next) {
  try {
    const result = await linkService.disableLink(req.params.id, req.user.id, req.user.role);
    res.json(result);
  } catch (err) { next(err); }
}

const qrService = require('../services/qrService');
const importService = require('../services/importService');

async function getQr(req, res, next) {
  try {
    const { format, size, dark, light, download } = req.query;
    const result = await qrService.generateQr(req.params.id, req.user.id, req.user.role, {
      format,
      size,
      darkColor: dark,
      lightColor: light,
    });
    res.setHeader('Content-Type', result.contentType);
    if (download === 'true') {
      const ext = format === 'svg' ? 'svg' : 'png';
      res.setHeader('Content-Disposition', `attachment; filename="linkpulse-${result.shortCode}-qr.${ext}"`);
    }
    res.send(result.data);
  } catch (err) { next(err); }
}

async function getQrInfo(req, res, next) {
  try {
    const info = await qrService.getQrDetails(req.params.id, req.user.id, req.user.role);
    res.json(info);
  } catch (err) { next(err); }
}

async function importCsv(req, res, next) {
  try {
    const { csv, rows, dryRun } = req.body;
    const isDryRun = dryRun === true || dryRun === 'true' || dryRun === undefined;
    const result = await importService.importLinksFromCsv(req.user.id, {
      csv,
      rows,
      dryRun: isDryRun,
    });
    res.status(isDryRun ? 200 : 201).json(result);
  } catch (err) { next(err); }
}

module.exports = {
  validate,
  create,
  list,
  getOne,
  update,
  disable,
  getQr,
  getQrInfo,
  importCsv,
};
