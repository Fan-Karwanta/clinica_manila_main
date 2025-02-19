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
