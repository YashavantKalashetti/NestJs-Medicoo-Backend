import { OnEvent } from "@nestjs/event-emitter";
import { EmailSentEvent } from "./events/cpu-intesive-event";

export class CpuIntensiveTasksListner{
    @OnEvent('cache.set')
    handleEmailSent() {
        console.log("cache.set event emitted successfully")
    }

}