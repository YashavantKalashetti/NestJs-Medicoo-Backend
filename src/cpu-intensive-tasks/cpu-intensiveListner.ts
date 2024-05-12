import { OnEvent } from "@nestjs/event-emitter";
import { EmailSentEvent } from "./events/cpu-inesive-event";

export class CpuIntensiveTasksListner{
    @OnEvent('email.sent')
    handleEmailSent(event: EmailSentEvent) {
        console.log('Email sent', event);
        console.log("Notification sent to user")
    }

}