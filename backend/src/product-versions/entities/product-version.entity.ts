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
import { Project } from '../../projects/entities/project.entity';
import { Design } from '../../designs/entities/design.entity';

@Entity('product_versions')
export class ProductVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Project;

  @Column()
  version: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => Design, (design) => design.productVersion)
  designs: Design[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
