const AuditLog = require("../models/AuditLog");

async function createAuditLog({
  req,
  action,
  actor,actorRole,
  collectionName,
  targetId,
  targetUserId,
  before,
  after
}) {
  const changedFields = getChangedFields(before, after);

  await AuditLog.create({
    actorUserId: req.user?.id,
    action,
    actor,
    actorRole,
    collectionName,
    targetId,
    targetUserId,
    before,
    after,
    changedFields,
    request: {
      ip: req.ip,
      userAgent: req.get("user-agent"),
      method: req.method,
      path: req.originalUrl
    }
  });
}

function getChangedFields(before = {}, after = {}) {
  const changes = {};

  for (const key of Object.keys(after || {})) {
    const beforeValue = before?.[key];
    const afterValue = after?.[key];

    if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
      changes[key] = {
        from: beforeValue,
        to: afterValue
      };
    }
  }

  return changes;
}

module.exports = createAuditLog;