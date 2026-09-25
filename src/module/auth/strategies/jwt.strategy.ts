import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

// Interface định nghĩa Payload của JWT Token
export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Trích xuất JWT từ Authorization Header dạng 'Bearer <token>'
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Bắt buộc kiểm tra thời gian hết hạn (exp)
      secretOrKey: process.env.jwtSecret|| 'ACCESS_TOKEN_SECRET',
    });
  }

  // Hàm validate tự động chạy sau khi Token được Passport giải mã thành công
  async validate(payload: JwtPayload) {
    // Giá trị trả về ở đây sẽ được NestJS tự động gán vào biến req.user
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}