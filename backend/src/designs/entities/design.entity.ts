import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ProductVersion } from '../../product-versions/entities/product-version.entity';
import { DesignVersion } from '../../design-versions/entities/design-version.entity';

@Entity('designs')
export class Design {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'product_version_id' })
  productVersionId: string;

  @ManyToOne(() => ProductVersion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_version_id' })
  productVersion: ProductVersion;

  @OneToMany(() => DesignVersion, (designVersion) => designVersion.design)
  versions: DesignVersion[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
