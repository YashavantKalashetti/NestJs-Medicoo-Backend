import { InjectQueue } from '@nestjs/bull';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { Queue } from 'bull';

@Controller('cpu-intensive-tasks')
export class CpuIntensiveTasksController {
    constructor(@InjectQueue('cpuIntensiveTasks') private readonly cpuintensiveQueue: Queue) {}

    @Post('add')
    async setHospitalsInRedisCache(@Body() hospitals: any) {
        await this.cpuintensiveQueue.add('cache-hospitals', {
            hospitals
        });
    }

}
