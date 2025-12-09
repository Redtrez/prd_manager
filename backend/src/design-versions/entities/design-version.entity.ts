import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Design } from '../../designs/entities/design.entity';

@Entity('design_versions')
export class DesignVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'design_id' })
  designId: string;

  @ManyToOne(() => Design, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'design_id' })
  design: Design;

  @Column()
  version: string;

  @Column()
  path: string;

  @Column({ default: 'axure' })
  type: 'axure' | 'html';

  @Column({ nullable: true })
  entry: string;

  @CreateDateColumn()
  created_at: Date;
}
