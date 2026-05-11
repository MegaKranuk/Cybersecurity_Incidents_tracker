import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, password } = req.body;
      const result = await this.authService.register(name, password);
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, password } = req.body;
      const result = await this.authService.login(name, password);
      res.json(result);
    } catch (e) {
      next(e);
    }
  };
}