import nodemailer from "nodemailer";
import { ResendTransport } from '@documenso/nodemailer-resend';
import { createTransport } from 'nodemailer';
import { envConfig } from "../config/config.js";
import { logOTPToConsole } from "./simpleEmailService.js";

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
    // Gmail configuration - optimized for Render.com
    gmail: {
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465, // Use port 465 for SSL (more reliable on Render)
        secure: true, // Use SSL instead of STARTTLS
        auth: {
            user: envConfig.email,
            pass: envConfig.password,
        },
        connectionTimeout: 10000, // Reduced timeout for faster failure
        greetingTimeout: 5000,
        socketTimeout: 10000,
        pool: false, // Disable pooling on Render
        maxConnections: 1,
        maxMessages: 1,
        rateDelta: 2000,
        rateLimit: 1,
        tls: {
            rejectUnauthorized: false, // Allow self-signed certificates
            ciphers: 'SSLv3'
        },
        // Additional options for Render.com
        ignoreTLS: false,
        requireTLS: true,
        debug: false,
        logger: false
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
    const hasResendConfig = envConfig.resend_api_key && envConfig.resend_from;
    
    // Check if recipient is the verified email for Resend
    const isVerifiedEmail = data.to === 'asbingamer@gmail.com';
    
    // For production, use Gmail as primary since Resend domain is not verified
    const providers = isProduction 
        ? ['gmail', 'mailgun'] as const
        : ['gmail', 'mailgun'] as const;
    
    console.log(`Environment: ${isProduction ? 'production' : 'development'}`);
    console.log(`Available providers: ${providers.join(', ')}`);
    console.log(`Recipient: ${data.to}, Is verified email: ${isVerifiedEmail}`);
    
    for (const provider of providers) {
        console.log(`Trying email provider: ${provider}`);
        
        // Skip Resend for now since domain is not verified
        // (This check is not needed since we removed resend from providers)
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                console.log(`Attempting to send email via ${provider} (attempt ${attempt}/${retries})`);
                
                // Create transporter for Gmail or Mailgun
                const transporter = nodemailer.createTransport(emailConfigs[provider]);

                // Skip connection verification to avoid timeout issues in production
                if (process.env.NODE_ENV !== 'production') {
                    await transporter.verify();
                }

                const mailOptions = {
                    // Use Gmail as sender
                    from: envConfig.email,
                    to: data.to,
                    subject: data.subject,
                    text: data.text,
                    html: data.html,
                    requireTLS: true,
                    secure: provider === 'gmail'
                };

                // Add timeout for email sending (increased for better reliability)
                const sendPromise = transporter.sendMail(mailOptions);
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Email sending timeout')), 30000)
                );

                const result = await Promise.race([sendPromise, timeoutPromise]);
                console.log(`✅ Email sent successfully via ${provider}`);
                console.log(`📧 Email details: To=${data.to}, Subject=${data.subject}`);
                
                // Close the transporter
                transporter.close();
                return true;

            } catch (error: any) {
                console.error(`Email sending via ${provider} failed (attempt ${attempt}/${retries}):`, error.message);
                
                // Special handling for provider-specific errors
                if (error.message.includes('validation_error')) {
                    console.log(`❌ Validation error: ${error.message}`);
                    break; // Skip retries for this provider
                } else if (error.message.includes('rate_limit')) {
                    console.log(`⏰ Rate limit exceeded, trying next provider...`);
                    break; // Skip retries for this provider
                }
                
                // Special handling for Gmail connection timeout
                if (provider === 'gmail' && (error.message.includes('timeout') || error.message.includes('Connection timeout'))) {
                    console.log(`Gmail connection timeout, trying next provider...`);
                    break; // Skip retries for this provider
                }
                
                // Special handling for Mailgun timeout
                if (provider === 'mailgun' && (error.message.includes('timeout') || error.message.includes('Connection timeout'))) {
                    console.log(`Mailgun connection timeout, trying next provider...`);
                    break; // Skip retries for this provider
                }
                
                // If this is the last attempt for the last provider, use console fallback
                if (attempt === retries && provider === providers[providers.length - 1]) {
                    console.error("All email sending attempts with all providers failed");
                    console.log("Using console fallback for email notification...");
                    return logOTPToConsole(data);
                }
                
                // If this is not the last attempt for current provider, wait and retry
                if (attempt < retries) {
                    const waitTime = attempt * 500; // Reduced wait time: 500ms, 1s...
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
