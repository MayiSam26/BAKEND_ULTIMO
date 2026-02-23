const nodemailer = require("nodemailer")

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "brucecahuanabrandon@gmail.com",
        pass: "sgdf hayx ecov vpti" 
    },
    secure: true,
    port: 465
});

module.exports = transporter;