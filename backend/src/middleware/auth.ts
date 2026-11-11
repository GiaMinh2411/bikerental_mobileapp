import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../services/rentals.js";
export function secret() {
  const key = process.env.JWT_SECRET;
  if (!key || key.length < 32)
    throw new Error("JWT_SECRET phải có ít nhất 32 ký tự.");
  return key;
}
export const auth: RequestHandler = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace(/^Bearer /, "");
    if (!token) throw new Error();
    const data = jwt.verify(token, secret()) as jwt.JwtPayload;
    if (!data.sub || !/^\d+$/.test(data.sub)) throw new Error();
    res.locals.user = Number(data.sub);
    next();
  } catch {
    next(new AppError(401, "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại."));
  }
};
