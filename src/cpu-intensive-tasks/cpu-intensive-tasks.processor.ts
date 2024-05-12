import { Process, Processor } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Job } from "bull";


@Processor('cpuIntensiveTasks')
export class CpuIntensiveTasksProcessor {

    constructor(private eventEmitter: EventEmitter2) {}

    private logger = new Logger(CpuIntensiveTasksProcessor.name);


    @Process('email')
    async sendEmail(job: Job) {        
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('Job data:', job.data);
        this.logger.debug('Start sending email');
        this.logger.debug(job.data);
        this.logger.debug('Email sent');
        console.log('Email sent');

        await new Promise(resolve => setTimeout(resolve, 2000));

        this.eventEmitter.emit('email.sent', job.data);
    }
}