const fs = require('fs');

// Read the userController file
const filePath = 'src/controllers/userController.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Find the regular login function and add verification check
const loginFunctionRegex = /(const isPasswordValid = await bcrypt\.compare\(password, user\.password\);[\s\S]*?if \(!isPasswordValid\) \{[\s\S]*?return;\s*\}\s*)(\s*const token = jwt\.sign\()/;

const replacement = `$1
        // Check if user is verified (OTP verification required)
        if (!user.isVerified) {
          res.status(403).json({
            message: "Please verify your email with OTP before logging in. Check your email for verification code.",
            requiresOtp: true,
            email: user.email
          });
          return;
        }

        $2`;

// Apply the fix
const fixedContent = content.replace(loginFunctionRegex, replacement);

// Write the fixed content back
fs.writeFileSync(filePath, fixedContent);

console.log(' Login function fixed! Added OTP verification check.');
