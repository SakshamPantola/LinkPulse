
const campaignService = require('../services/campaignService');

async function list(req, res, next) {
  try {
    const campaigns = await campaignService.getCampaigns(req.user.id, req.user.role);
    res.json({ campaigns });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const campaign = await campaignService.getCampaignById(req.params.id, req.user.id, req.user.role);
    res.json({ campaign });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const campaign = await campaignService.createCampaign(req.user.id, req.body);
    res.status(201).json({ campaign });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const campaign = await campaignService.updateCampaign(req.params.id, req.user.id, req.user.role, req.body);
    res.json({ campaign });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const result = await campaignService.deleteCampaign(req.params.id, req.user.id, req.user.role);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, remove };
