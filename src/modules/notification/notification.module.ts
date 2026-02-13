import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationService } from './notification.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('EMAIL_HOST'),
          port: configService.get<number>('EMAIL_PORT'),
          secure: configService.get<number>('EMAIL_PORT') === 465,
          auth: {
            user: configService.get<string>('EMAIL_USER'),
            pass: configService.get<string>('EMAIL_PASS'),
          },
        },
        defaults: {
          from: configService.get<string>('EMAIL_FROM'),
        },
      }),
    }),
  ],
  providers: [NotificationService],
  exports: [NotificationService],
})
/**
 * Module responsible for handling notifications (Email).
 * Configures MailerModule with async options.
 */
export class NotificationModule {}
