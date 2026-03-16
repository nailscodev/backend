import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ScreenRoleEntity } from '../entities/screen-role.entity';
import { UserRole } from '../entities/user.entity';

@Injectable()
export class ScreenRoleService {
  constructor(
    @InjectModel(ScreenRoleEntity)
    private screenRoleModel: typeof ScreenRoleEntity,
  ) {}

  async getScreenIdsByRole(role: UserRole): Promise<string[]> {
    console.log('🔍 Searching for screen roles with role:', role, 'type:', typeof role);
    
    // Let's also check what roles exist in the database
    const allRoles = await this.screenRoleModel.findAll({
      attributes: ['role'],
      group: ['role']
    });
    console.log('📊 Available roles in database:', allRoles.map(r => r.role));
    
    const screenRoles = await this.screenRoleModel.findAll({
      where: { role },
      attributes: ['screenId'],
    });

    console.log('🔍 Screen roles found for role', role, ':', screenRoles.length);
    console.log('📋 First few screen roles:', screenRoles.slice(0, 3).map(sr => ({
      id: sr.id,
      screenId: sr.screenId,
      role: sr.role
    })));

    return screenRoles
      .map(screenRole => screenRole.screenId)
      .filter(screenId => screenId !== null && screenId !== undefined);
  }

  async getAllScreenRoles(): Promise<ScreenRoleEntity[]> {
    const allRoles = await this.screenRoleModel.findAll();
    console.log('🗃️ Total screen roles in database:', allRoles.length);
    console.log('📊 Sample roles:', allRoles.slice(0, 5).map(sr => ({
      id: sr.id,
      screenId: sr.screenId,
      role: sr.role
    })));
    return allRoles;
  }

  async setScreenPermissionsForRole(role: UserRole, screenIds: string[]): Promise<void> {
    console.log('🔧 Setting permissions for role:', role, 'screens:', screenIds);
    
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
      
      await this.screenRoleModel.bulkCreate(screenRoles);
    }
    
    console.log('✅ Permissions updated for role:', role);
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