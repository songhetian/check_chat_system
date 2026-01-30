import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: ['admin', 'supervisor', 'agent'] })
  role: string;

  @Column({ nullable: true })
  deptId: number;

  @Column({ default: 'offline' })
  status: string;
}
