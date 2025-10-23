// Simple email service as fallback for Render.com deployment
// This service logs OTP to console and can be extended with other providers

interface IEmailData {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

export const logOTPToConsole = (data: IEmailData): boolean => {
    console.log('='.repeat(60));
    console.log('📧 EMAIL NOTIFICATION (Console Fallback)');
    console.log('='.repeat(60));
    console.log(`To: ${data.to}`);
    console.log(`Subject: ${data.subject}`);
    console.log(`Message: ${data.text}`);
    if (data.html) {
        console.log(`HTML: ${data.html}`);
    }
    console.log('='.repeat(60));
    console.log('⚠️  This is a fallback method. In production, configure proper email service.');
    console.log('='.repeat(60));
    return true;
};

// Alternative: Use a simple HTTP-based email service
export const sendViaHTTP = async (data: IEmailData): Promise<boolean> => {
    try {
        // This could be extended to use services like EmailJS, Formspree, etc.
        console.log('HTTP email service not implemented yet');
        return false;
    } catch (error) {
        console.error('HTTP email service failed:', error);
        return false;
    }
};

export default { logOTPToConsole, sendViaHTTP };
