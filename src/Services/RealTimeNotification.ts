export async function RealTimeNotification(senderId, receiverId, message){
    try {
        const response = await fetch(`${this.configService.get('MICROSERVICE_SERVER')}/notification/sendEmergencyMessage`, {
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
        console.log(error.message)
        return false;
    }
}