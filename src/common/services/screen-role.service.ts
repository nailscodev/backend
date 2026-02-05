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
}