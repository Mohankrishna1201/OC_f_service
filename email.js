const nodemailer = require('nodemailer');

const sendEmailReminder = (email, contest) => {
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'your-email@gmail.com',
            pass: 'your-email-password'
        }
    });

    const mailOptions = {
        from: 'your-email@gmail.com',
        to: email,
        subject: `Reminder: Upcoming Contest - ${contest.event}`,
        text: `Hello,

This is a reminder for the upcoming contest:
Event: ${contest.event}
Start Time: ${new Date(contest.start).toLocaleString()}
Link: ${contest.href}

Good luck!

Best regards,
Contest Reminder Service`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
};

module.exports = sendEmailReminder;
