import { Process, Processor } from "@nestjs/bull";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Job } from "bull";
import { Redis } from "ioredis";
import { hostname } from "os";

@Injectable()
@Processor('cpuIntensiveTasks')
export class CpuIntensiveTasksProcessor {

    constructor(private eventEmitter: EventEmitter2,  @Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

    private logger = new Logger(CpuIntensiveTasksProcessor.name);


    @Process('cache-hospitals')
    async sendEmail(job: Job) {        
        const {hospitals} = job.data.hospitals;

        console.log(hospitals);

        const pipeline = this.redisClient.pipeline();
        hospitals.forEach(({ name, latitude, longitude, address, email, contactNumber }) => {
        pipeline.geoadd('hospitals', longitude, latitude, name);
        });
        await pipeline.exec();

        console.log(1)

        const nearestHospitals = await this.redisClient.georadius('hospitals', 12.9411334, 77.5649215, 10000000000, 'km', 'WITHDIST', 'ASC');

        console.log(2)

        console.log('nearestHospitals', nearestHospitals);

        this.eventEmitter.emit('cache.set');
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