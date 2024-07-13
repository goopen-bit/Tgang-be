import { Injectable } from "@nestjs/common";
import { UserService } from "../user/user.service";

@Injectable()
export class LabService {
  constructor(private userService: UserService) {}

  async buyLab(userId: number) {
    return true;
  }
}
