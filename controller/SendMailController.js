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

exports.sendMailGamail = async (req, res, next) => {
    try {
        const { to, subject, mailto,name,consulta } = req.body;
        const htmlContent = `
        <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Correo Recibido</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                margin: 0;
                                padding: 0;
                                background-color: #f2f2f2;
                            }
                            .container {
                                max-width: 600px;
                                margin: auto;
                                padding: 20px;
                                background-color: #ffffff;
                                border-radius: 8px;
                                box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
                            }
                            .logo {
                                text-align: center;
                                margin-bottom: 20px;
                            }
                            .logo img {
                                width: 100px;
                                height: 100px;
                                object-fit: cover;
                            }
                            .content {
                                text-align: center;
                            }
                            .content h1 {
                                color: #333333;
                                margin-bottom: 10px;
                            }
                            .content p {
                                color: #666666;
                                margin-bottom: 20px;
                            }
                            .button {
                                display: inline-block;
                                padding: 10px 20px;
                                background-color: #ED6436;
                                color: #ffffff!important;
                                text-decoration: none;
                                border-radius: 5px;
                                transition: background-color 0.3s ease;
                            }
                            .button:hover {
                                background-color: #65C178;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="logo">
                                <img src="https://6620158c9005a687340c5f08--resilient-sable-5268a5.netlify.app/img/logocito.png" alt="Logo">
                            <h3>Refugio Colitas & Amor</h3
                            </div>
                            <div class="content">
                                <h1>¡Correo Consulta!</h1>
                                <p>Hola , Luis Pereyra</p>
                                <p>
                                consulta:hola soy ${name},${consulta}
                                </p>
                                <a 
                                    href="mailto:${mailto}" class="button">Responder</a>

                            </div>
                        </div>
                    </body>
                    </html>

        `

        const mailOptions = {
            from: "brucecahuanabrandon@gmail.com", 
            to: to,
            subject: subject,
            html: htmlContent
        };
    
        const info = await transporter.sendMail(mailOptions);
        return res.status(200).json(
            {status:'000',
             message: "¡Correo enviado correctamente!"
            , code: info.messageId }
        );
    } catch (error) {
        console.error("Error al enviar el correo:", error.message);
        return res.status(500).json({ error: "Error al enviar el correo." });
    }
};