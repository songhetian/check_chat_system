import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';

@Entity('memos')
export class Memo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'datetime', nullable: true })
  remindAt: Date;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ type: 'enum', enum: ['self', 'supervisor'], default: 'self' })
  source: string;

  @Column()
  userId: number;
}
