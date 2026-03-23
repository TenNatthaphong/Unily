import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // ===========================================================================
  // AUTH ACTIONS
  // ===========================================================================

  async login(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(pass, user.password))) {
      throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async refreshTokens(userId: string, rt: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.refreshToken || !(await bcrypt.compare(rt, user.refreshToken))) {
      throw new ForbiddenException('Access Denied');
    }

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private async updateRefreshToken(userId: string, rt: string) {
    const hashed = await bcrypt.hash(rt, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { refreshToken: hashed } });
  }

  private async getTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET || 'at-secret',
        expiresIn: '1h', // Extended for better UX during dev
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET || 'rt-secret',
        expiresIn: '7d',
      }),
    ]);
    return { accessToken: at, refreshToken: rt };
  }
}