import { Request, Response, NextFunction } from "express";
import { get, run } from "../db/dbClient";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; name: string };
    }
  }
}

export async function demoAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const userId = req.header("X-Demo-UserId");

  if (!userId) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Відсутній заголовок X-Demo-UserId" },
    });
    return;
  }

  if (typeof userId !== "string" || userId.trim() === "" || userId.length > 64) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Невалідний X-Demo-UserId" },
    });
    return;
  }

  const cleanUserId = userId.trim();

  let user = await get<{ id: string; name: string }>(
    "SELECT id, name FROM Users WHERE id = ?",
    [cleanUserId]
  );

  if (!user) {
    try {
      await run("INSERT INTO Users (id, name) VALUES (?, ?)", [cleanUserId, "Демо Користувач"]);
      user = { id: cleanUserId, name: "Демо Користувач" };
    } catch (err) {
      console.error("Помилка при автостворенні юзера:", err);
      res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Користувача не знайдено і не вдалося створити" },
      });
      return;
    }
  }

  req.user = user;
  next();
}