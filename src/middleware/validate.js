const {validationResult} = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.empty()});
  }
  next();
};

module.exports = {
  validate,
};