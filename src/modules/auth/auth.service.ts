import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private generateRefreshToken(): string {
    return randomBytes(40).toString('hex');
  }

  private getRefreshTokenExpiry(): Date {
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d');
    const match = expiresIn.match(/^(\d+)([dhm])$/);
    if (!match) return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'd': return new Date(Date.now() + value * 24 * 60 * 60 * 1000);
      case 'h': return new Date(Date.now() + value * 60 * 60 * 1000);
      case 'm': return new Date(Date.now() + value * 60 * 1000);
      default: return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const roles = user.userRoles.map((ur) => ur.role.name);

    const payload = {
      sub: user.id,
      email: user.email,
      outletId: user.outletId,
    };

    const accessToken = this.jwtService.sign(payload);

    // Generate refresh token
    const refreshToken = this.generateRefreshToken();
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: this.getRefreshTokenExpiry(),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        outletId: user.outletId,
        roles,
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { include: { userRoles: { include: { role: true } } } } },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (tokenRecord.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = tokenRecord.user;
    if (!user.isActive) {
      await this.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
      throw new UnauthorizedException('Account is inactive');
    }

    // Delete old refresh token
    await this.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });

    // Generate new tokens
    const payload = {
      sub: user.id,
      email: user.email,
      outletId: user.outletId,
    };

    const newAccessToken = this.jwtService.sign(payload);
    const newRefreshToken = this.generateRefreshToken();

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: newRefreshToken,
        expiresAt: this.getRefreshTokenExpiry(),
      },
    });

    const roles = user.userRoles.map((ur) => ur.role.name);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        outletId: user.outletId,
        roles,
      },
    };
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
    return { success: true };
  }

  async registerUser(dto: RegisterUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const role = await this.prisma.role.findUnique({
      where: { name: dto.roleName },
    });

    if (!role) {
      throw new NotFoundException(`Role ${dto.roleName} not found`);
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const newUser = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        outletId: dto.outletId,
        userRoles: {
          create: {
            roleId: role.id,
          },
        },
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      outletId: newUser.outletId,
      roles: newUser.userRoles.map((ur) => ur.role.name),
    };
  }

  async findAllUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        outletId: true,
        createdAt: true,
        updatedAt: true,
        userRoles: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      isActive: u.isActive,
      outletId: u.outletId,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      roles: u.userRoles.map((ur) => ur.role.name),
    }));
  }

  async updateUser(id: string, dto: { name?: string; email?: string; isActive?: boolean; password?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.email !== undefined) {
      if (dto.email !== user.email) {
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing) throw new ConflictException('Email is already in use');
      }
      data.email = dto.email;
    }
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        outletId: true,
        userRoles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      isActive: updated.isActive,
      outletId: updated.outletId,
      roles: updated.userRoles.map((ur) => ur.role.name),
    };
  }

  async updateUserRoles(id: string, roleNames: string[]) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    // Verify all roles exist
    const roles = await this.prisma.role.findMany({
      where: { name: { in: roleNames } },
    });

    if (roles.length !== roleNames.length) {
      throw new NotFoundException('One or more roles not found');
    }

    // Replace user roles inside transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId: id } });
      await tx.userRole.createMany({
        data: roles.map((r) => ({
          userId: id,
          roleId: r.id,
        })),
      });
    });

    return this.findAllUsers().then((users) => users.find((u) => u.id === id));
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    // Soft delete by setting isActive to false
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { success: true, message: 'User deactivated successfully' };
  }
}
