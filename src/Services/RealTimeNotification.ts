import { ConfigService } from "@nestjs/config";

export async function RealTimeNotification(senderId, receiverId, message){
    const configService = new ConfigService();
    try {
        const response = await fetch(`${configService.get('MICROSERVICE_SERVER')}/notification/sendEmergencyMessage`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                receiverId,
                status: 'EMERGENCY',
                message,
                senderId
            })
        });

        if(response.ok){
            return true;
        }
        return false;
    } catch (error) {
        console.log(error)
        return false;
    }
}