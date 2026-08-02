const tblUser = require("../Entity/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

exports.createUser = async (req, res, next) => {
    try {
        const { usuario, pass } = req.body;

        // Validar que ambos campos existan
        if (!usuario || !pass) {
            return res.status(400).json({ code: '001', message: 'Usuario y contraseña son requeridos.' });
        }

        const user = new tblUser({
            usuario: usuario,
            password: await bcrypt.hash(pass, 12)
        });

        await user.save();

        const result = {
            code: '000',
            message: 'Se creó correctamente',
            data: null
        };

        return res.json(result);

    } catch (error) {
        console.log("error server: ", error);
        return res.status(500).json({ 'Error server': error });
    }
}

exports.sessionUser = async (req, res, next) => {
    try {
        const { usuario, pass } = req.body;

        console.log("intento de login con usuario:", usuario);

        const findOneUser = await tblUser.findOne({
            where: {
                usuario: usuario
            }
        });

        // Validamos si el usuario existe
        if (!findOneUser) {
            return res.json({
                code: '001',
                message: 'Ese usuario no existe',
                data: null
            });
        }

        // Validamos la contraseña
        if (!bcrypt.compareSync(pass, findOneUser.password)) {
            return res.json({
                code: '001',
                message: 'Contraseña incorrecta o usuario incorrecto',
                data: null
            });
        }

        // Si la contraseña es correcta, generamos el token
        const token = jwt.sign({
            usuario: findOneUser.usuario,
            iduser: findOneUser.iduser
        }, process.env.JWT_SECRET, {
            expiresIn: "4h"
        });

        // Retornar el token y respuesta exitosa
        return res.json({
            code: '000',
            usuario: findOneUser.usuario,
            token: token
        });

    } catch (error) {
        console.log("error server: ", error);
        return res.status(500).json({ 'Error server': error });
    }
}

// Protegido: el usuario ya logueado configura su propia pregunta secreta.
// Usa req.user.iduser (del token), nunca un id que venga del body, para que
// nadie pueda pisar la pregunta de otro usuario.
exports.setPreguntaSecreta = async (req, res, next) => {
    try {
        const { pregunta, respuesta } = req.body;

        if (!pregunta || !respuesta || respuesta.trim().length < 3) {
            return res.status(400).json({
                code: '001',
                message: 'Ingresa una pregunta y una respuesta de al menos 3 caracteres.',
                data: null
            });
        }

        await tblUser.update({
            pregunta_secreta: pregunta,
            respuesta_secreta: await bcrypt.hash(respuesta.trim().toLowerCase(), 12)
        }, {
            where: { iduser: req.user.iduser }
        });

        return res.json({ code: '000', message: 'Pregunta secreta guardada correctamente', data: null });
    } catch (error) {
        console.log("error server: ", error);
        return res.status(500).json({ code: '001', message: 'Error del servidor', data: null });
    }
}

// Público: primer paso de "olvidé mi contraseña" — solo devuelve la pregunta,
// nunca la respuesta.
exports.obtenerPregunta = async (req, res, next) => {
    try {
        const { usuario } = req.body;
        const findOneUser = await tblUser.findOne({ where: { usuario } });

        if (!findOneUser || !findOneUser.pregunta_secreta) {
            return res.json({
                code: '001',
                message: 'Este usuario no tiene una pregunta secreta configurada. Contacta al administrador del sistema.',
                data: null
            });
        }

        return res.json({
            code: '000',
            message: 'success',
            data: { pregunta: findOneUser.pregunta_secreta }
        });
    } catch (error) {
        console.log("error server: ", error);
        return res.status(500).json({ code: '001', message: 'Error del servidor', data: null });
    }
}

// Público: segundo paso — valida la respuesta y, si es correcta, entrega un
// token de un solo propósito (purpose: 'reset') válido solo 10 minutos.
exports.verificarRespuesta = async (req, res, next) => {
    try {
        const { usuario, respuesta } = req.body;
        const findOneUser = await tblUser.findOne({ where: { usuario } });

        if (!findOneUser || !findOneUser.respuesta_secreta) {
            return res.status(400).json({
                code: '001',
                message: 'No se pudo verificar la respuesta. Contacta al administrador del sistema.',
                data: null
            });
        }

        const esCorrecta = bcrypt.compareSync(
            (respuesta || '').trim().toLowerCase(),
            findOneUser.respuesta_secreta
        );

        if (!esCorrecta) {
            return res.status(400).json({ code: '001', message: 'Respuesta incorrecta.', data: null });
        }

        const resetToken = jwt.sign(
            { iduser: findOneUser.iduser, purpose: 'reset' },
            process.env.JWT_SECRET,
            { expiresIn: '10m' }
        );

        return res.json({ code: '000', message: 'Respuesta correcta', data: { resetToken } });
    } catch (error) {
        console.log("error server: ", error);
        return res.status(500).json({ code: '001', message: 'Error del servidor', data: null });
    }
}

// Público (requiere el resetToken del paso anterior): tercer paso, define la
// nueva contraseña.
exports.resetPassword = async (req, res, next) => {
    try {
        const { resetToken, nuevaPassword } = req.body;

        if (!resetToken || !nuevaPassword || nuevaPassword.length < 4) {
            return res.status(400).json({
                code: '001',
                message: 'La nueva contraseña debe tener al menos 4 caracteres.',
                data: null
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        } catch (e) {
            return res.status(401).json({ code: '001', message: 'El enlace de recuperación expiró, empieza de nuevo.', data: null });
        }

        if (decoded.purpose !== 'reset') {
            return res.status(401).json({ code: '001', message: 'Token no válido.', data: null });
        }

        await tblUser.update({
            password: await bcrypt.hash(nuevaPassword, 12)
        }, {
            where: { iduser: decoded.iduser }
        });

        return res.json({ code: '000', message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.', data: null });
    } catch (error) {
        console.log("error server: ", error);
        return res.status(500).json({ code: '001', message: 'Error del servidor', data: null });
    }
}
