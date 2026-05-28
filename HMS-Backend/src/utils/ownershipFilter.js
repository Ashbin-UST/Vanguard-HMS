/**
 * OWNERSHIP FILTER UTILITY
 * 
 * Rules:
 *   ADMIN / OWNER  → empty filter (sees everything)
 *   Everyone else  → { [ownershipField]: user.id }
 *
 * Usage:
 *   const { buildOwnershipFilter } = require('../utils/ownershipFilter');
 *   const filter = { ...buildOwnershipFilter(req.user, 'registeredBy'), status: 'ACTIVE' };
 */

const ADMIN_ROLES = ['ADMIN', 'OWNER'];

const buildOwnershipFilter = (user, ownershipField) => {
    if (!user) return {};
    const userRoles = user.roles || [];
    if (userRoles.some((role) => ADMIN_ROLES.includes(role))) {
        return {};
    }
    return { [ownershipField]: user.id };
};

module.exports = { buildOwnershipFilter };