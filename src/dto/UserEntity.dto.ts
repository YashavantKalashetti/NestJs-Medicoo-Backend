import { Exclude } from "class-transformer";


// We have to use @UseInterceptors(ClassSerializerInterceptor) in the controller to use the Exclude() decorator

export class UserEntity{
    name: string;
    email: string;

    @Exclude()
    id: string;
    
    @Exclude()
    password: string;
    constructor(partials: Partial<UserEntity>){
        Object.assign(this,partials)
    }
}