export async function WhatsAppMessage(contacts, message){
    try {

        if(!contacts || contacts.length === 0){
            return;
        }

        contacts = contacts.map((contact) => {
            if(contact.length === 10){
                contact = `91${contact}`;
            }
            return contact;
        });

        const response = await fetch(`${this.configService.get('MICROSERVICE_SERVER')}/whatsapp/send`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                contacts,
                message
            })
        })

        if(!response.ok){
            console.log("Could not send whats app message");
        }

    } catch (error) {
        console.log("Error Could not send whats app message");
    }
}