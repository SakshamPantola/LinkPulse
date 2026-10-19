
const adminService = require('../services/adminService');

async function stats(req, res, next) {
  try {
    const data = await adminService.getPlatformAnalytics();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function listUsers(req, res, next) {
  try {
    const { page, limit, search } = req.query;
    const result = await adminService.getAllUsers({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 25,
      search,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function listLinks(req, res, next) {
  try {
    const { page, limit, search, status } = req.query;
    const result = await adminService.getAllLinks({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 25,
      search,
      status,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function disableLink(req, res, next) {
  try {
    const link = await adminService.setLinkStatus(req.params.id, 'disabled');
    res.json({ message: 'Link disabled successfully', link });
  } catch (err) {
    next(err);
  }
}

async function enableLink(req, res, next) {
  try {
    const link = await adminService.setLinkStatus(req.params.id, 'active');
    res.json({ message: 'Link enabled successfully', link });
  } catch (err) {
    next(err);
  }
}

async function listBlockedDomains(req, res, next) {
  try {
    const domains = await adminService.getBlockedDomains();
    res.json({ blockedDomains: domains });
  } catch (err) {
    next(err);
  }
}

async function createBlockedDomain(req, res, next) {
  try {
    const domain = await adminService.addBlockedDomain(req.body);
    res.status(201).json({ message: 'Domain added to blocklist', domain });
  } catch (err) {
    next(err);
  }
}

async function deleteBlockedDomain(req, res, next) {
  try {
    const result = await adminService.removeBlockedDomain(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  stats,
  listUsers,
  listLinks,
  disableLink,
  enableLink,
  listBlockedDomains,
  createBlockedDomain,
  deleteBlockedDomain,
};
