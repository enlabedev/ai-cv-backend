import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactService } from './contact.service';
import { ContactRequest } from './entities/contact-request.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([ContactRequest]), NotificationModule],
  providers: [ContactService],
  exports: [ContactService],
})
/**
 * Module handling contact requests and flows.
 * Manages the state machine for gathering user contact information.
 */
export class ContactModule {}
