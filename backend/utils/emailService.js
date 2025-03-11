import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.APP_EMAIL,
        pass: process.env.APP_PASSWORD
    }
});

export const sendRegistrationEmail = async (userEmail, status) => {
    const subject = status === 'approved' 
        ? 'Registration Approved - Clinica Manila'
        : 'Registration Update - Clinica Manila';

    const message = status === 'approved'
        ? 'Congratulations! Your registration has been APPROVED. You can now LOG IN to your account to access our website.'
        : 'We regret to inform you that your registration has been DECLINED. Please contact Clinica Manila Support for more information.';

    const mailOptions = {
        from: '"Clinica Manila Support" <' + process.env.APP_EMAIL + '>',
        to: userEmail,
        subject: subject,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Clinica Manila Registration Status</h2>
                <p style="color: #666; font-size: 16px;">${message}</p>
                <div style="margin-top: 30px; color: #888; font-size: 14px;">
                    <p>Best regards,</p>
                    <p>Clinica Manila Support</p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

export const sendAdminNewRegistrationAlert = async (userData) => {
    const { firstName, lastName, middleName } = userData;
    
    const mailOptions = {
        from: '"Clinica Manila System" <' + process.env.APP_EMAIL + '>',
        to: process.env.APP_EMAIL,
        subject: 'New User Registration - Clinica Manila',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">New User Registration</h2>
                <p style="color: #666; font-size: 16px;">A new user has registered in the Clinica Manila platform:</p>
                
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>First Name:</strong> ${firstName}</p>
                    <p><strong>Middle Name:</strong> ${middleName || 'N/A'}</p>
                    <p><strong>Last Name:</strong> ${lastName}</p>
                </div>
                
                <p style="color: #666; font-size: 16px;">Please review this registration in the PENDING REGISTRATIONS section of the admin panel.</p>
                
                <div style="margin-top: 30px; color: #888; font-size: 14px;">
                    <p>This is an automated message from the Clinica Manila System.</p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending admin notification email:', error);
        return false;
    }
};
