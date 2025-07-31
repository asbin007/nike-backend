import  bcrypt  from 'bcrypt';
import { envConfig } from './config/config.ts';
import User from "./database/models/userModel.ts"


const adminSeeder=async()=>{

const data= await User.findOne({
    where:{
        email:envConfig.admin
    }
})
if(!data){
    await User.create({
        username:envConfig.admin_username,
        email:envConfig.admin,
        password: bcrypt.hashSync(envConfig.passwordAdmin as string, 10),
        role:"admin"

    })
    console.log("Admin seeded successfully")

}
else{
    console.log("Admin already seeded")
}

}
export default adminSeeder