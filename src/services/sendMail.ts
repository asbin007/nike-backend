import nodemailer from "nodemailer";
import { ResendTransport } from '@documenso/nodemailer-resend';
import { createTransport } from 'nodemailer';
import { envConfig } from "../config/config.js";

// Email configurations with Resend as primary
const emailConfigs = {
    resend: {
        // Resend transport configuration
        createTransport: () => createTransport(
            ResendTransport.makeTransport({
                apiKey: envConfig.resend_api_key || '',
            })
        )
    },
    gmail: {
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: envConfig.email,
            pass: envConfig.password,
        },
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 20000,
        rateLimit: 5
    },
    // Alternative: Mailgun SMTP (if you have Mailgun credentials)
    mailgun: {
        host: 'smtp.mailgun.org',
        port: 587,
        secure: false,
        auth: {
            user: process.env.MAILGUN_SMTP_USER || envConfig.email,
            pass: process.env.MAILGUN_SMTP_PASSWORD || envConfig.password,
        },
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
        
    }
};

interface IData{
    to:string;
    subject:string;
    text:string;
    html?:string;
}
const sendMail = async(data: IData, retries: number = 2): Promise<boolean> => {
    // Try different email providers in order (Resend first - works on Render)
    // Gmail and Mailgun SMTP are blocked on Render, so they're fallbacks for local dev only
    const providers = ['resend', 'gmail', 'mailgun'] as const;
    
    for (const provider of providers) {
        console.log(`Trying email provider: ${provider}`);
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                console.log(`Attempting to send email via ${provider} (attempt ${attempt}/${retries})`);
                
                // Handle Resend transport differently
                const transporter = provider === 'resend' 
                    ? emailConfigs.resend.createTransport()
                    : nodemailer.createTransport(emailConfigs[provider]);

                // Verify connection before sending
                await transporter.verify();

                const mailOptions={
                    from: envConfig.email,
                    to: data.to,
                    subject: data.subject,
                    text: data.text,
                    html: data.html,
                    requireTLS: true,
                    secure: false,


                };

                await transporter.sendMail(mailOptions);
                console.log(`Email sent successfully via ${provider}`);
                
                // Close the transporter
                transporter.close();
                return true;

            } catch (error: any) {
                console.error(`Email sending via ${provider} failed (attempt ${attempt}/${retries}):`, error.message);
                
                if (attempt === retries && provider === providers[providers.length - 1]) {
                    console.error("All email sending attempts with all providers failed");
                    return false;
                }
                
                if (attempt < retries) {
                    // Wait before retrying (shorter backoff for faster response)
                    const waitTime = attempt * 2000; // 2s, 4s...
                    console.log(`Waiting ${waitTime}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            }
        }
        
        // If we reach here, all attempts with current provider failed, try next provider
        console.log(`All attempts with ${provider} failed, trying next provider...`);
    }
    
    return false;
}
export default sendMail;
