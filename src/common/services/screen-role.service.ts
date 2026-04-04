import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ScreenRoleEntity } from '../entities/screen-role.entity';
import { UserRole } from '../entities/user.entity';

@Injectable()
export class ScreenRoleService {
  private readonly logger = new Logger(ScreenRoleService.name);

  constructor(
    @InjectModel(ScreenRoleEntity)
    private screenRoleModel: typeof ScreenRoleEntity,
  ) {}

  async getScreenIdsByRole(role: UserRole): Promise<string[]> {
    this.logger.debug(`Searching for screen roles with role: ${role} type: ${typeof role}`);
    
    // Let's also check what roles exist in the database
    const allRoles = await this.screenRoleModel.findAll({
      attributes: ['role'],
      group: ['role']
    });
    this.logger.debug(`Available roles in database: ${allRoles.map(r => r.role).join(', ')}`);
    
    const screenRoles = await this.screenRoleModel.findAll({
      where: { role },
      attributes: ['screenId'],
    });

    this.logger.debug(`Screen roles found for role ${role}: ${screenRoles.length}`);
    this.logger.debug(`First few screen roles: ${JSON.stringify(screenRoles.slice(0, 3).map(sr => ({ id: sr.id, screenId: sr.screenId, role: sr.role })))}`);

    return screenRoles
      .map(screenRole => screenRole.screenId)
      .filter(screenId => screenId !== null && screenId !== undefined);
  }

  async getAllScreenRoles(): Promise<ScreenRoleEntity[]> {
    const allRoles = await this.screenRoleModel.findAll();
    this.logger.debug(`Total screen roles in database: ${allRoles.length}`);
    this.logger.debug(`Sample roles: ${JSON.stringify(allRoles.slice(0, 5).map(sr => ({ id: sr.id, screenId: sr.screenId, role: sr.role })))}`);
    return allRoles;
  }

  async setScreenPermissionsForRole(role: UserRole, screenIds: string[]): Promise<void> {
    this.logger.debug(`Setting permissions for role: ${role} screens: ${screenIds.join(', ')}`);
    
    // Remove existing permissions for this role
    await this.screenRoleModel.destroy({
      where: { role }
    });

    // Add new permissions
    if (screenIds.length > 0) {
      const screenRoles = screenIds.map(screenId => ({
        role,
        screenId
      }));
      
      await this.screenRoleModel.bulkCreate(screenRoles as any);
    }
    
    this.logger.debug(`Permissions updated for role: ${role}`);
  }

  async getAllPermissionsByRole(): Promise<Record<string, string[]>> {
    const allRoles = await this.screenRoleModel.findAll();
    
    const permissionsByRole: Record<string, string[]> = {};
    
    allRoles.forEach(screenRole => {
      if (!permissionsByRole[screenRole.role]) {
        permissionsByRole[screenRole.role] = [];
      }
      permissionsByRole[screenRole.role].push(screenRole.screenId);
    });
    
    return permissionsByRole;
  }
}