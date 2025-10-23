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
    
    // For production, prioritize Resend if configured, otherwise use Gmail
    const providers = isProduction 
        ? (hasResendConfig ? ['resend', 'gmail', 'mailgun'] as const : ['gmail', 'mailgun'] as const)
        : ['resend', 'gmail', 'mailgun'] as const;
    
    console.log(`Environment: ${isProduction ? 'production' : 'development'}`);
    console.log(`Available providers: ${providers.join(', ')}`);
    console.log(`Recipient: ${data.to}, Is verified email: ${isVerifiedEmail}`);
    
    for (const provider of providers) {
        console.log(`Trying email provider: ${provider}`);
        
        // Try Resend for all emails if configured
        if (provider === 'resend' && !hasResendConfig) {
            console.log(`Skipping Resend - not configured`);
            continue;
        }
        
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
                        ? (envConfig.resend_from || 'noreply@resend.dev')
                        : envConfig.email,
                    to: data.to,
                    subject: data.subject,
                    text: data.text,
                    html: data.html,
                    requireTLS: provider !== 'resend',
                    secure: provider === 'gmail'
                };

                // Add timeout for email sending (reduced for Render.com)
                const sendPromise = transporter.sendMail(mailOptions);
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Email sending timeout')), 15000)
                );

                const result = await Promise.race([sendPromise, timeoutPromise]);
                console.log(`✅ Email sent successfully via ${provider}`);
                console.log(`📧 Email details: To=${data.to}, Subject=${data.subject}`);
                
                // Close the transporter
                transporter.close();
                return true;

            } catch (error: any) {
                console.error(`Email sending via ${provider} failed (attempt ${attempt}/${retries}):`, error.message);
                
                // Special handling for Resend errors
                if (provider === 'resend') {
                    if (error.message.includes('validation_error')) {
                        console.log(`❌ Resend validation error: ${error.message}`);
                        console.log(`💡 Tip: Verify your domain at https://resend.com/domains`);
                        break; // Skip retries for this provider
                    } else if (error.message.includes('rate_limit')) {
                        console.log(`⏰ Resend rate limit exceeded, trying next provider...`);
                        break; // Skip retries for this provider
                    } else {
                        console.log(`❌ Resend error: ${error.message}`);
                    }
                }
                
                // Special handling for Gmail connection timeout
                if (provider === 'gmail' && (error.message.includes('timeout') || error.message.includes('Connection timeout'))) {
                    console.log(`Gmail connection timeout, trying next provider...`);
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
