import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { get, run } from "../db/dbClient";
import { ApiError } from "../errors/api-error";
import { JWT_SECRET } from "../config";

export class AuthService {
  async register(name: string, passwordRaw: string) {
    if (!name || !passwordRaw || passwordRaw.length < 4) {
      throw new ApiError(400, "BAD_REQUEST", "Ім'я та пароль (мінімум 4 символи) обов'язкові");
    }

    const existing = await get("SELECT id FROM Users WHERE name = ?", [name]);
    if (existing) {
      throw new ApiError(409, "CONFLICT", "Користувач з таким ім'ям вже існує");
    }

    const id = uuid();
    const hash = await bcrypt.hash(passwordRaw, 10);
    
    await run("INSERT INTO Users (id, name, passwordHash) VALUES (?, ?, ?)", [id, name, hash]);
    
    return { message: "Реєстрація успішна", userId: id };
  }

  async login(name: string, passwordRaw: string) {
    const user = await get<{ id: string, name: string, passwordHash: string }>(
      "SELECT id, name, passwordHash FROM Users WHERE name = ?", [name]
    );

    if (!user || !user.passwordHash) {
      throw new ApiError(401, "UNAUTHORIZED", "Невірні облікові дані");
    }

    const isValid = await bcrypt.compare(passwordRaw, user.passwordHash);
    if (!isValid) {
      throw new ApiError(401, "UNAUTHORIZED", "Невірні облікові дані");
    }

    const token = jwt.sign({ id: user.id, name: user.name }, JWT_SECRET, { expiresIn: "2h" });
    
    return { token };
  }
}