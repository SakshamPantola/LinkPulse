
const tagService = require('../services/tagService');

async function list(req, res, next) {
  try {
    const tags = await tagService.getTags(req.user.id, req.user.role);
    res.json({ tags });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const tag = await tagService.createTag(req.user.id, req.body);
    res.status(201).json({ tag });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const result = await tagService.deleteTag(req.params.id, req.user.id, req.user.role);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function attach(req, res, next) {
  try {
    const result = await tagService.attachTagToLink(req.params.id, req.user.id, req.user.role, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function detach(req, res, next) {
  try {
    const result = await tagService.detachTagFromLink(req.params.id, req.params.tagId, req.user.id, req.user.role);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, remove, attach, detach };
