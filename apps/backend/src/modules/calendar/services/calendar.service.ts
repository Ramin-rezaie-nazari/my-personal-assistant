import { Injectable } from '@nestjs/common';

@Injectable()
export class CalendarService {
  async createEvent() {
    await Promise.resolve();

    return {
      message: 'Calendar event created',
    };
  }

  async getEvents() {
    await Promise.resolve();

    return [];
  }
}
