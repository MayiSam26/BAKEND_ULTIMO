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
            // Puerto 587 (STARTTLS) en vez del 465 (SSL) que usa el preset
            // "service: gmail" por defecto — algunos hostings bloquean uno
            // de los dos puertos SMTP salientes pero no el otro.
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            // Railway no tiene salida IPv6, y smtp.gmail.com resuelve a IPv6
            // además de IPv4 — sin esto, Node intenta conectar por IPv6 y
            // falla con ENETUNREACH antes de siquiera probar IPv4.
            family: 4,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            // Sin esto, si la conexión SMTP se queda colgada (red, credencial
            // inválida, etc.) la petición nunca responde. Con esto, falla
            // rápido con un error claro en vez de colgarse indefinidamente.
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000,
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
