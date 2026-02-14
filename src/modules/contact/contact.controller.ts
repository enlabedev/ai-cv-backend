import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { ContactRequest } from './entities/contact-request.entity';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @Throttle({ default: { limit: 3, ttl: 86400000 } })
  async create(
    @Body() createContactDto: CreateContactDto,
  ): Promise<ContactRequest> {
    return this.contactService.createContact(createContactDto);
  }
}
