const nodemailer = require("nodemailer");

const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));

// RF06: consulta de donación desde el sitio público, se envía por correo al
// refugio. EMAIL_USER/EMAIL_PASS se configuran como variables de entorno
// (contraseña de aplicación de Gmail) — nunca se guardan en el código.
exports.enviarConsultaDonacion = async (req, res) => {
    try {
        const { nombre, correo, telefono, mensaje } = req.body;

        if (!nombre || !correo || !mensaje) {
            return res.status(400).json({ code: '001', message: 'Nombre, correo y mensaje son requeridos.', data: null });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            return res.status(400).json({ code: '001', message: 'Ingresa un correo electrónico válido.', data: null });
        }

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error("Contacto de donación: faltan las variables de entorno EMAIL_USER/EMAIL_PASS");
            return res.status(500).json({ code: '001', message: 'El envío de correo no está configurado en el servidor.', data: null });
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const destino = process.env.EMAIL_DESTINO || process.env.EMAIL_USER;

        await transporter.sendMail({
            from: `"Refugio Colitas y Amor - Web" <${process.env.EMAIL_USER}>`,
            to: destino,
            replyTo: correo,
            subject: `Nueva consulta de donación de ${nombre}`,
            text: `Nombre: ${nombre}\nCorreo: ${correo}\nTeléfono: ${telefono || "No indicado"}\n\nMensaje:\n${mensaje}`,
            html: `
                <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
                <p><strong>Correo:</strong> ${escapeHtml(correo)}</p>
                <p><strong>Teléfono:</strong> ${escapeHtml(telefono) || "No indicado"}</p>
                <p><strong>Mensaje:</strong></p>
                <p>${escapeHtml(mensaje).replace(/\n/g, "<br>")}</p>
            `,
        });

        return res.json({ code: '000', message: 'Tu mensaje fue enviado correctamente. Te contactaremos pronto.', data: null });
    } catch (error) {
        console.error("Error en enviarConsultaDonacion:", error);
        return res.status(500).json({ code: '001', message: 'No se pudo enviar tu mensaje. Intenta nuevamente más tarde.', data: null });
    }
};
