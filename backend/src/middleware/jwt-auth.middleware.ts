import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";

export function jwtAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.header("Authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Відсутній токен" } });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; name: string };
    req.user = { id: decoded.id, name: decoded.name };
    next();
  } catch (err) {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Невалідний токен" } });
  }
}