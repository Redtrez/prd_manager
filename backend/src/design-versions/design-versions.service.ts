import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DesignVersion } from './entities/design-version.entity';
import { CreateDesignVersionDto } from './dto/create-design-version.dto';
import { DesignsService } from '../designs/designs.service';
import { ProductVersionsService } from '../product-versions/product-versions.service';
import { FontReplacer } from '../utils/font-replacer.util';
import * as AdmZip from 'adm-zip';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DesignVersionsService {
  private uploadDir: string;

  constructor(
    @InjectRepository(DesignVersion)
    private designVersionsRepository: Repository<DesignVersion>,
    private designsService: DesignsService,
    private productVersionsService: ProductVersionsService,
    private configService: ConfigService,
  ) {
    this.uploadDir =
      this.configService.get<string>('UPLOAD_DIR') || './data/prototypes';
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async create(
    designId: string,
    createDesignVersionDto: CreateDesignVersionDto,
    file: Express.Multer.File,
  ): Promise<DesignVersion> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Get design and productVersion info
    const design = await this.designsService.findOne(designId);
    const productVersion = await this.productVersionsService.findOne(
      design.productVersionId,
    );

    const versionPath = path.join(
      this.uploadDir,
      productVersion.productId,
      productVersion.id,
      designId,
      createDesignVersionDto.version,
    );

    console.log('[DesignVersion] Creating version:', {
      productId: productVersion.productId,
      productVersionId: productVersion.id,
      designId,
      version: createDesignVersionDto.version,
      versionPath,
    });

    if (fs.existsSync(versionPath)) {
      throw new BadRequestException('Version already exists');
    }

    // Unzip file: prefer disk path, fallback to in-memory buffer for compatibility
    const zipPath = (file as any)?.path as string | undefined;
    try {
      fs.mkdirSync(versionPath, { recursive: true });
      const zip = zipPath && fs.existsSync(zipPath)
        ? new AdmZip(zipPath)
        : file.buffer
        ? new AdmZip(file.buffer)
        : undefined;
      if (!zip) {
        throw new BadRequestException('Upload tmp file not found');
      }
      zip.extractAllTo(versionPath, true);
      console.log('[DesignVersion] Successfully extracted to:', versionPath);
    } catch (error) {
      console.error('[DesignVersion] Failed to extract zip:', error);
      throw new BadRequestException('Invalid zip file');
    } finally {
      try {
        if (zipPath && fs.existsSync(zipPath)) {
          fs.unlinkSync(zipPath);
        }
      } catch {}
    }

    const type = createDesignVersionDto.type ?? 'axure';

    if (type === 'axure') {
      try {
        const processedCount = FontReplacer.processDirectory(versionPath);
        console.log(
          `[DesignVersion] Processed ${processedCount} files for font replacement`,
        );
      } catch (error) {
        console.warn('[DesignVersion] Font replacement warning:', error);
      }
    }

    let entryFile: string | null = null;
    if (type === 'axure') {
      entryFile = this.findEntryFile(versionPath);
      if (!entryFile) {
        throw new BadRequestException('No index.html or start.html found in zip file');
      }
    } else {
      const entry = (createDesignVersionDto.entry || 'index.html').trim();
      const candidate = path.join(versionPath, entry);
      if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) {
        throw new BadRequestException('Entry file not found for HTML Demo');
      }
      entryFile = candidate;
    }

    // Calculate relative path for preview
    // versionPath is absolute, entryFile is absolute
    // We need path relative to UPLOAD_DIR
    // e.g. /data/prototypes/pid/pvid/did/ver/subdir/index.html -> /prototypes/pid/pvid/did/ver/subdir/index.html

    const relativePath = path.relative(this.uploadDir, entryFile);
    const previewPath = `/prototypes/${relativePath}`;

    console.log('[DesignVersion] Generated preview path:', previewPath);

    const designVersion = this.designVersionsRepository.create({
      designId,
      version: createDesignVersionDto.version,
      path: previewPath,
      type,
      entry: type === 'html' ? (createDesignVersionDto.entry || 'index.html').trim() : null,
    });

    return this.designVersionsRepository.save(designVersion);
  }

  private findEntryFile(dir: string): string | null {
    const files = fs.readdirSync(dir);

    // Priority 1: Check for index.html or start.html in current directory
    for (const file of files) {
      if (file.toLowerCase() === 'index.html' || file.toLowerCase() === 'start.html') {
        return path.join(dir, file);
      }
    }

    // Priority 2: Check subdirectories
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        // Avoid traversing __MACOSX or other hidden folders if necessary, but for now simple recursion
        if (file === '__MACOSX') continue;

        const found = this.findEntryFile(fullPath);
        if (found) return found;
      }
    }

    return null;
  }

  async findAll(designId: string): Promise<DesignVersion[]> {
    return this.designVersionsRepository.find({
      where: { designId },
      order: { created_at: 'DESC' },
    });
  }

  async remove(id: string): Promise<void> {
    const designVersion = await this.designVersionsRepository.findOne({
      where: { id },
      relations: ['design'],
    });
    if (!designVersion) {
      throw new NotFoundException('Design version not found');
    }

    const design = await this.designsService.findOne(designVersion.designId);
    const productVersion = await this.productVersionsService.findOne(
      design.productVersionId,
    );

    // Delete files
    const fullPath = path.join(
      this.uploadDir,
      productVersion.productId,
      productVersion.id,
      designVersion.designId,
      designVersion.version,
    );
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    }

    await this.designVersionsRepository.remove(designVersion);
  }
}
