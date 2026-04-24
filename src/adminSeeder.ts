import  bcrypt  from 'bcrypt';
import { envConfig } from './config/config.js';
import User from "./database/models/userModel.js"


const adminSeeder=async()=>{

const data= await User.findOne({
    where:{
        email:envConfig.admin
    }
})
if (!data) {
    await User.create({
        username: envConfig.admin_username,
        email: envConfig.admin,
        password: bcrypt.hashSync(envConfig.passwordAdmin as string, 10),
        role: "admin"
    });
    console.log("Admin seeded successfully");
} else {
    data.password = bcrypt.hashSync(envConfig.passwordAdmin as string, 10);
    await data.save();
    console.log("Admin already seeded. Password updated to match environment.");
}

}
export default adminSeeder