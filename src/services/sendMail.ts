import nodemailer from "nodemailer";
import { envConfig } from "../config/config.js";

interface IData{
    to:string;
    subject:string;
    text:string;
    html?:string;
}
const sendMail= async(data:IData)=>{
    try {
        const transporter = nodemailer.createTransport({
            service:'gmail',
            auth:{
                user:envConfig.email,
                pass:envConfig.password,

            }
        })
        const mailOptions={
            from:envConfig.email,
            to:data.to,
            subject:data.subject,
            text:data.text,
            html:data.html
        }
        await transporter.sendMail(mailOptions)
        console.log("Email sent successfully")
        return true

    } catch (error) {
        console.error("Email sent failed",error)
        return false
    }
}
export default sendMail;
