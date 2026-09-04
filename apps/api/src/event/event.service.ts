import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  async create(communityId: string, data: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        communityId,
        title: data.title,
        description: data.description,
        date: new Date(data.date),
        location: data.location,
      },
    });
  }

  async findAllByCommunity(communityId: string) {
    return this.prisma.event.findMany({
      where: { communityId },
      orderBy: { date: 'asc' },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async update(id: string, data: UpdateEventDto) {
    const updateData: any = { ...(data as any) };
    delete updateData.communityId;
    if (data.date) updateData.date = new Date(data.date);
    
    return this.prisma.event.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    // Delete registrations first
    await this.prisma.eventRegistration.deleteMany({
      where: { eventId: id },
    });
    return this.prisma.event.delete({
      where: { id },
    });
  }

  async register(eventId: string, userId: string) {
    return this.prisma.eventRegistration.create({
      data: {
        eventId,
        userId,
      },
    });
  }

  async getAttendees(eventId: string) {
    return this.prisma.eventRegistration.findMany({
      where: { eventId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
