const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error.errors) {
      const issueMessages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return res.status(400).json({
        success: false,
        message: `Validation Error: ${issueMessages}`,
        errors: error.errors,
      });
    }
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = validate;
