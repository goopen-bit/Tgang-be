import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @Post()
  postHello(@Body() params: any, @Query() query: any) {
    console.log(params);
    console.log(query);
    return this.appService.getHello();
  }
}
