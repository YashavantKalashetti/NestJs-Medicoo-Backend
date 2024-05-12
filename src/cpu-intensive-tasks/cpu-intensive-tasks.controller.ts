import { InjectQueue } from '@nestjs/bull';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { Queue } from 'bull';

@Controller('cpu-intensive-tasks')
export class CpuIntensiveTasksController {
    constructor(@InjectQueue('cpuIntensiveTasks') private readonly cpuintensiveQueue: Queue) {}

    @Post('posts')
    async addPost() {
        await new Promise(resolve => setTimeout(resolve, 10000));
        return;
    }

    @Get('posts')  
    async getPosts() {
        return;
    }

    @Post('add')
    async sendEmail(@Body() task: any) {
        await this.cpuintensiveQueue.add('email', {
            file: 'notes.txt',
            id: 1
        });
    }
}
