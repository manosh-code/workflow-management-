import { ApiError } from "../utils/ApiError.js";

export function notFound(_req, _res, next) {
  next(new ApiError(404, "Resource not found"));
}

export function errorHandler(err, _req, res, _next) {
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];
    const message = field === "email" ? "Email is already registered" : "That record already exists";
    return res.status(409).json({ message });
  }

  if (err?.name === "CastError") {
    return res.status(400).json({ message: "Validation failed" });
  }

  const status = err.statusCode || 500;
  if (status >= 500) {
    console.error(err);
  }

  const body = {
    message: status >= 500 ? "Something went wrong" : err.message || "Request failed",
  };
  if (status < 500 && err.details) {
    body.details = err.details;
  }
  return res.status(status).json(body);
}
