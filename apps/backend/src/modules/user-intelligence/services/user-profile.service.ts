import { Injectable } from '@nestjs/common';

@Injectable()
export class UserProfileService {
  async buildProfile() {
    await Promise.resolve();

    return {
      message: 'User profile built',
    };
  }

  async updateProfile() {
    await Promise.resolve();

    return {
      message: 'User profile updated',
    };
  }
}
