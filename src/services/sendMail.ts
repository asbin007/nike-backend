import nodemailer from "nodemailer";
import { ResendTransport } from '@documenso/nodemailer-resend';
import { createTransport } from 'nodemailer';
import { envConfig } from "../config/config.js";

// Email configurations optimized for Render.com deployment
const emailConfigs = {
    resend: {
        // Resend transport configuration - primary for production
        createTransport: () => createTransport(
            ResendTransport.makeTransport({
                apiKey: envConfig.resend_api_key || '',
            })
        )
    },
    // Gmail configuration - only for local development
    gmail: {
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: envConfig.email,
            pass: envConfig.password,
        },
        connectionTimeout: 30000, // Reduced timeout for faster failure
        greetingTimeout: 15000,
        socketTimeout: 30000,
        pool: false, // Disable pooling on Render
        maxConnections: 1,
        maxMessages: 1,
        rateDelta: 5000,
        rateLimit: 1
    },
    // Mailgun SMTP configuration - fallback option
    mailgun: {
        host: 'smtp.mailgun.org',
        port: 587,
        secure: false,
        auth: {
            user: process.env.MAILGUN_SMTP_USER || envConfig.email,
            pass: process.env.MAILGUN_SMTP_PASSWORD || envConfig.password,
        },
        connectionTimeout: 30000,
        greetingTimeout: 15000,
        socketTimeout: 30000,
        pool: false,
        maxConnections: 1,
        maxMessages: 1,
    }
};

interface IData{
    to:string;
    subject:string;
    text:string;
    html?:string;
}
const sendMail = async(data: IData, retries: number = 2): Promise<boolean> => {
    // Determine environment and provider priority
    const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;
    const providers = isProduction 
        ? ['resend'] as const  // Only use Resend in production
        : ['resend', 'gmail', 'mailgun'] as const; // Try all in development
    
    console.log(`Environment: ${isProduction ? 'production' : 'development'}`);
    console.log(`Available providers: ${providers.join(', ')}`);
    
    for (const provider of providers) {
        console.log(`Trying email provider: ${provider}`);
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                console.log(`Attempting to send email via ${provider} (attempt ${attempt}/${retries})`);
                
                // Handle Resend transport differently
                const transporter = provider === 'resend' 
                    ? emailConfigs.resend.createTransport()
                    : nodemailer.createTransport(emailConfigs[provider]);

                // Skip connection verification for Resend to avoid timeout issues
                if (provider !== 'resend') {
                    await transporter.verify();
                }

                const mailOptions = {
                    // Use proper sender based on provider
                    from: provider === 'resend' 
                        ? (envConfig.resend_from || 'noreply@yourdomain.com')
                        : envConfig.email,
                    to: data.to,
                    subject: data.subject,
                    text: data.text,
                    html: data.html,
                    requireTLS: provider !== 'resend',
                    secure: provider === 'gmail'
                };

                // Add timeout for email sending
                const sendPromise = transporter.sendMail(mailOptions);
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Email sending timeout')), 25000)
                );

                await Promise.race([sendPromise, timeoutPromise]);
                console.log(`Email sent successfully via ${provider}`);
                
                // Close the transporter
                transporter.close();
                return true;

            } catch (error: any) {
                console.error(`Email sending via ${provider} failed (attempt ${attempt}/${retries}):`, error.message);
                
                // If this is the last attempt for the last provider, fail completely
                if (attempt === retries && provider === providers[providers.length - 1]) {
                    console.error("All email sending attempts with all providers failed");
                    return false;
                }
                
                // If this is not the last attempt for current provider, wait and retry
                if (attempt < retries) {
                    const waitTime = attempt * 1000; // 1s, 2s...
                    console.log(`Waiting ${waitTime}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            }
        }
        
        // If we reach here, all attempts with current provider failed, try next provider
        if (provider !== providers[providers.length - 1]) {
            console.log(`All attempts with ${provider} failed, trying next provider...`);
        }
    }
    
    return false;
}
export default sendMail;
