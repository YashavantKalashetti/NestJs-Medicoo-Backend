import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ROLES_KEY } from '../customDecorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    const requiredRoles = this.reflector.getAllAndOverride(ROLES_KEY, [ context.getHandler(), context.getClass() ]);

    const userRole = request.user.role;

    // console.log('requiredRoles', requiredRoles);
    // console.log('userRole', userRole);

    if(!requiredRoles.includes(userRole)){
      throw new ForbiddenException('You do not have permission to access this resource');
    }
    
    return true;
  }
}