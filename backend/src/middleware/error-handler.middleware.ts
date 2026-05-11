import { Request, Response, NextFunction } from "express";
import { ApiError } from "../errors/api-error";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  console.error("[ErrorHandler]", err);

  const isDev = process.env.NODE_ENV !== "production";
  return res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Internal server error",
      ...(isDev && err instanceof Error ? { details: err.message } : {}),
    },
  });
};