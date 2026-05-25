const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Backend Ledger" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

async function sendRegistrationEmail(userEmail, name) {
  const subject = 'Welcome to Backend Ledger 🚀';

  const text = `Hello ${name}, welcome to Backend Ledger! Your account has been created successfully.`;

  const html = `
        <h2>Welcome to Backend Ledger 🚀</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your account has been created successfully. Thanks for joining us!</p>
    `;
  await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionEmail(userEmail, name, amount, toAccount) {

  const subject = 'transaction Successful!';
  const text = `Hello ${name}, \n\n Your transaction of ${amount} to account ${toAccount} is been processed successfully.`;
  const html = `
  <h2>transaction Success!</h2>
  <p>Hello <strong>${name}</strong>,</p>
  <p>Your transaction of ${amount} to account ${toAccount} is been processed successfully.</p>
  `;
  await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionFailedEmail(userEmail, name, amount, toAccount) {
  const subject = 'Transaction Failed!';
  const text = `Hello ${name}, \n\n Your transaction of ${amount} to account ${toAccount} has been failed.`;
  const html = `
  <h2>Transaction Failed!</h2>
  <p>Hello <strong>${name}</strong>,</p>
  <p>Your transaction of ${amount} to account ${toAccount} has been failed.</p>
  `;
  await sendEmail(userEmail, subject, text, html);
}

module.exports = {
  sendRegistrationEmail,
  sendTransactionEmail,
  sendTransactionFailedEmail
}