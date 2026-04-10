// src/middleware/apikey.middleware.js
export const verifyApiKey = (req, res, next) => {
  const key = req.headers["x-api-key"];

  if (!key || key !== process.env.API_KEY) {
    return res.status(401).json({ mensaje: "No autorizado" });
  }

  next();
};
