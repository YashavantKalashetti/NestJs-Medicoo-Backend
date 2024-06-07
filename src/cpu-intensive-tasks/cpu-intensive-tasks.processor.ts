import { Process, Processor } from "@nestjs/bull";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Job } from "bull";
import { Redis } from "ioredis";
import { hostname } from "os";

@Injectable()
@Processor('cpuIntensiveTasks')
export class CpuIntensiveTasksProcessor {

    constructor(private eventEmitter: EventEmitter2) {}

    private logger = new Logger(CpuIntensiveTasksProcessor.name);


    @Process('cache-hospitals')
    async sendEmail(job: Job) {        
        
    }

    // @Process('cache-hospitals')
    // async cacheHospitals(job: any) {

    //     console.log('Job data:', job.data);
    //     const {hospitals} = job;

    //     hospitals.forEach(async (hospital: any) => {
    //         const key = `hospital:${hospital.id}`;
    //         await this.redisClient.set(key, JSON.stringify(hospital));
    //     });

    //     console.log('Hospitals cached successfully');
    // }

}