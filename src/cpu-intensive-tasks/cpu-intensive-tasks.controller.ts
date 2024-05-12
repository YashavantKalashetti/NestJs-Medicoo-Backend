import { InjectQueue } from '@nestjs/bull';
import { Body, Controller, Post } from '@nestjs/common';
import { Queue } from 'bull';

@Controller('cpu-intensive-tasks')
export class CpuIntensiveTasksController {
    constructor(@InjectQueue('cpuIntensiveTasks') private readonly cpuintensiveQueue: Queue) {}


    @Post('add')
    async sendEmail(@Body() task: any) {
        await this.cpuintensiveQueue.add('email', {
            file: 'notes.txt',
            id: 1
        });
    }
}
