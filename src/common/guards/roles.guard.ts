import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (
      (!requiredRoles || requiredRoles.length === 0) &&
      (!requiredPermissions || requiredPermissions.length === 0)
    ) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.roles) {
      return false;
    }

    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.some((role) => user.roles.includes(role));
      if (!hasRole) return false;
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      const userRoles = user.roles as string[];
      const roleRecords = await this.prisma.role.findMany({
        where: { name: { in: userRoles } },
        select: { id: true },
      });
      const roleIds = roleRecords.map((r) => r.id);

      const permissionRecords = await this.prisma.rolePermission.findMany({
        where: {
          roleId: { in: roleIds },
          permission: { name: { in: requiredPermissions } },
        },
        select: { permissionId: true },
      });

      if (permissionRecords.length === 0) return false;
    }

    return true;
  }
}
