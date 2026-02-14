import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ContactStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('contact_requests')
export class ContactRequest {
  @PrimaryGeneratedColumn()
  id!: number;

  /**
   * Unique session ID associated with the contact request.
   * Indexed for fast lookups.
   */
  @Column({ unique: true })
  sessionId!: string;

  @Column({ nullable: true })
  name!: string;

  @Column({ nullable: true })
  phone!: string;

  @Column({ nullable: true })
  email!: string;

  @Column({ nullable: true })
  contactDate!: string;

  @Column({ nullable: true })
  message?: string;

  @Column({
    type: 'simple-enum',
    enum: ContactStatus,
    default: ContactStatus.PENDING,
  })
  status!: ContactStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
