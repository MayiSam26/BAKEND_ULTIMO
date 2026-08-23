const { Resend } = require("resend");

const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));

// RF06: consulta de donación desde el sitio público, se envía por correo al
// refugio. Se usa Resend (API HTTP) en vez de SMTP directo porque Railway
// bloquea las conexiones SMTP salientes (confirmado: ETIMEDOUT/ENETUNREACH
// contra smtp.gmail.com en cualquier puerto/versión de IP) — HTTPS sí
// funciona sin problema. RESEND_API_KEY y EMAIL_DESTINO se configuran como
// variables de entorno, nunca en el código.
exports.enviarConsultaDonacion = async (req, res) => {
    try {
        const { nombre, correo, telefono, mensaje } = req.body;

        if (!nombre || !correo || !mensaje) {
            return res.status(400).json({ code: '001', message: 'Nombre, correo y mensaje son requeridos.', data: null });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            return res.status(400).json({ code: '001', message: 'Ingresa un correo electrónico válido.', data: null });
        }
        // El teléfono es opcional, pero si viene debe ser un número de Perú
        // (9 dígitos). Formulario público: no basta con validar en el navegador.
        if (telefono && !/^\d{9}$/.test(telefono)) {
            return res.status(400).json({ code: '001', message: 'El teléfono debe tener 9 dígitos numéricos.', data: null });
        }

        if (!process.env.RESEND_API_KEY || !process.env.EMAIL_DESTINO) {
            console.error("Contacto de donación: faltan las variables de entorno RESEND_API_KEY/EMAIL_DESTINO");
            return res.status(500).json({ code: '001', message: 'El envío de correo no está configurado en el servidor.', data: null });
        }

        const resend = new Resend(process.env.RESEND_API_KEY);

        const { error } = await resend.emails.send({
            // Sin verificar un dominio propio en Resend, solo se puede
            // enviar desde este remitente de pruebas — funciona bien porque
            // Resend igual permite entregarlo a EMAIL_DESTINO (la cuenta con
            // la que te registraste).
            from: "Refugio Colitas y Amor <onboarding@resend.dev>",
            to: process.env.EMAIL_DESTINO,
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

        if (error) {
            console.error("Error de Resend en enviarConsultaDonacion:", error);
            return res.status(500).json({ code: '001', message: 'No se pudo enviar tu mensaje. Intenta nuevamente más tarde.', data: null });
        }

        return res.json({ code: '000', message: 'Tu mensaje fue enviado correctamente. Te contactaremos pronto.', data: null });
    } catch (error) {
        console.error("Error en enviarConsultaDonacion:", error);
        return res.status(500).json({ code: '001', message: 'No se pudo enviar tu mensaje. Intenta nuevamente más tarde.', data: null });
    }
};
