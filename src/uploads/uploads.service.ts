import { Injectable, BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';

@Injectable()
export class UploadsService {
  private readonly uploadPath = join(process.cwd(), 'uploads');

  constructor() {
    // Ensure upload directories exist
    this.ensureUploadDirs();
  }

  private ensureUploadDirs() {
    const dirs = [
      this.uploadPath,
      join(this.uploadPath, 'categories'),
      join(this.uploadPath, 'services'),
      join(this.uploadPath, 'staff'),
    ];

    dirs.forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Delete a file from the filesystem
   */
  deleteFile(filePath: string): void {
    try {
      const fullPath = join(process.cwd(), filePath);
      if (existsSync(fullPath)) {
        unlinkSync(fullPath);
      }
    } catch (error) {
      // Log but don't throw - file might already be deleted
      console.error('Error deleting file:', error);
    }
  }

  /**
   * Validate file is an image
   */
  validateImage(file: Express.Multer.File): void {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('File must be an image (JPEG, PNG, GIF, or WebP)');
    }

    // Max 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size must be less than 5MB');
    }
  }
}
