const jwt = require("jsonwebtoken");
function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Please log in first." });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "dev_secret_change_me");
    next();
  } catch {
    return res.status(401).json({ error: "Session expired. Please log in again." });
  }
}
function allowRoles(...roles) {
  return (req, res, next) => roles.includes(req.user.role)
    ? next() : res.status(403).json({ error: "You do not have permission for this action." });
}
module.exports = { authenticate, allowRoles };
