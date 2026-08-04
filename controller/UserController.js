const tblUser = require("../Entity/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");

// Roles del sistema según la tesis (CU02, CU17, CU18): Administrador,
// Voluntario y Veterinario. "Persona interesada" no tiene cuenta propia en
// este sistema: sus solicitudes se registran directamente al enviar el
// formulario de adopción público, sin necesidad de iniciar sesión.
const ROLES_VALIDOS = ["Administrador", "Voluntario", "Veterinario"];

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const uploadFoto = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, 'uploads/'),
        filename: (req, file, cb) => cb(null, 'perfil-' + Date.now() + path.extname(file.originalname))
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes (jpg, png, webp, gif)'));
        }
    }
}).single('foto');

exports.createUser = async (req, res, next) => {
    try {
        const { usuario, pass, correo, rol, nombres, apellidos, telefono } = req.body;

        // Reglas de negocio (CU-01 Crear usuario administrador): usuario,
        // correo y rol son obligatorios; el usuario y el correo deben ser
        // únicos; el rol debe ser uno de los definidos por el sistema.
        if (!usuario || !pass || !correo || !rol) {
            return res.status(400).json({ code: '001', message: 'Usuario, correo, contraseña y rol son requeridos.', data: null });
        }
        if (!ROLES_VALIDOS.includes(rol)) {
            return res.status(400).json({ code: '001', message: 'El rol indicado no es válido.', data: null });
        }
        if (pass.length < 4) {
            return res.status(400).json({ code: '001', message: 'La contraseña debe tener al menos 4 caracteres.', data: null });
        }

        const existeUsuario = await tblUser.findOne({ where: { usuario } });
        if (existeUsuario) {
            return res.status(400).json({ code: '001', message: 'Ese nombre de usuario ya está registrado.', data: null });
        }
        const existeCorreo = await tblUser.findOne({ where: { correo } });
        if (existeCorreo) {
            return res.status(400).json({ code: '001', message: 'Ese correo electrónico ya está registrado.', data: null });
        }

        const user = new tblUser({
            usuario: usuario,
            correo: correo,
            rol: rol,
            nombres: nombres || null,
            apellidos: apellidos || null,
            telefono: telefono || null,
            activo: true,
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

exports.updateUser = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { usuario, correo, rol, nombres, apellidos, telefono } = req.body;

        const existe = await tblUser.findOne({ where: { iduser: id } });
        if (!existe) {
            return res.json({ code: '001', message: 'No existe el usuario', data: null });
        }
        if (rol && !ROLES_VALIDOS.includes(rol)) {
            return res.status(400).json({ code: '001', message: 'El rol indicado no es válido.', data: null });
        }
        if (usuario) {
            const dup = await tblUser.findOne({ where: { usuario } });
            if (dup && dup.iduser !== Number(id)) {
                return res.status(400).json({ code: '001', message: 'Ese nombre de usuario ya está registrado.', data: null });
            }
        }
        if (correo) {
            const dup = await tblUser.findOne({ where: { correo } });
            if (dup && dup.iduser !== Number(id)) {
                return res.status(400).json({ code: '001', message: 'Ese correo electrónico ya está registrado.', data: null });
            }
        }

        const updates = {};
        if (usuario) updates.usuario = usuario;
        if (correo) updates.correo = correo;
        if (rol) updates.rol = rol;
        if (nombres !== undefined) updates.nombres = nombres || null;
        if (apellidos !== undefined) updates.apellidos = apellidos || null;
        if (telefono !== undefined) updates.telefono = telefono || null;

        await tblUser.update(updates, { where: { iduser: id } });

        return res.json({ code: '000', message: 'Se actualizó correctamente', data: null });
    } catch (error) {
        console.log("error server: ", error);
        return res.status(500).json({ code: '001', message: 'Error del servidor', data: null });
    }
}

// CU17/CU18: solo el Administrador puede forzar el cambio de contraseña de
// cualquier cuenta (a diferencia de "olvidé mi contraseña", que es
// autoservicio y requiere la pregunta secreta del propio usuario).
exports.changePasswordAdmin = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { nuevaPassword } = req.body;

        if (!nuevaPassword || nuevaPassword.length < 4) {
            return res.status(400).json({ code: '001', message: 'La nueva contraseña debe tener al menos 4 caracteres.', data: null });
        }

        const existe = await tblUser.findOne({ where: { iduser: id } });
        if (!existe) {
            return res.json({ code: '001', message: 'No existe el usuario', data: null });
        }

        await tblUser.update({
            password: await bcrypt.hash(nuevaPassword, 12)
        }, {
            where: { iduser: id }
        });

        return res.json({ code: '000', message: 'Contraseña actualizada correctamente', data: null });
    } catch (error) {
        console.log("error server: ", error);
        return res.status(500).json({ code: '001', message: 'Error del servidor', data: null });
    }
}

// CU17: activar o desactivar una cuenta. No se permite que un usuario se
// desactive a sí mismo (se quedaría sin poder volver a entrar).
exports.setUsuarioEstado = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { activo } = req.body;

        if (Number(id) === req.user.iduser) {
            return res.status(400).json({ code: '001', message: 'No puedes desactivar tu propia cuenta.', data: null });
        }

        const existe = await tblUser.findOne({ where: { iduser: id } });
        if (!existe) {
            return res.json({ code: '001', message: 'No existe el usuario', data: null });
        }

        await tblUser.update({ activo: !!activo }, { where: { iduser: id } });

        return res.json({
            code: '000',
            message: activo ? 'Cuenta activada correctamente' : 'Cuenta desactivada correctamente',
            data: null
        });
    } catch (error) {
        console.log("error server: ", error);
        return res.status(500).json({ code: '001', message: 'Error del servidor', data: null });
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

        // CU17: una cuenta desactivada por el administrador no puede iniciar sesión.
        if (findOneUser.activo === false) {
            return res.json({
                code: '001',
                message: 'Esta cuenta está desactivada. Contacta al administrador del sistema.',
                data: null
            });
        }

        // Si la contraseña es correcta, generamos el token. Se incluye el rol
        // para que el panel muestre solo las funciones permitidas (CU02).
        const token = jwt.sign({
            usuario: findOneUser.usuario,
            iduser: findOneUser.iduser,
            rol: findOneUser.rol
        }, process.env.JWT_SECRET, {
            expiresIn: "4h"
        });

        // Retornar el token y respuesta exitosa
        return res.json({
            code: '000',
            usuario: findOneUser.usuario,
            foto: findOneUser.foto,
            rol: findOneUser.rol,
            token: token
        });

    } catch (error) {
        console.log("error server: ", error);
        return res.status(500).json({ 'Error server': error });
    }
}

// Protegido: lista de usuarios registrados (sin password ni datos de la
// pregunta secreta).
exports.getUsuarios = async (req, res, next) => {
    try {
        const usuarios = await tblUser.findAll({
            attributes: ['iduser', 'usuario', 'correo', 'rol', 'activo', 'foto', 'nombres', 'apellidos', 'telefono', 'fecha_registro']
        });
        return res.json({ code: '000', message: 'success', data: usuarios });
    } catch (error) {
        console.log("error server: ", error);
        return res.status(500).json({ code: '001', message: 'Error del servidor', data: null });
    }
}

// Protegido: el usuario logueado sube/actualiza su propia foto de perfil.
exports.subirFoto = async (req, res, next) => {
    uploadFoto(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ code: '001', message: err.message, data: null });
        }
        if (!req.file) {
            return res.status(400).json({ code: '001', message: 'No se ha subido ninguna imagen', data: null });
        }
        try {
            await tblUser.update({ foto: req.file.path }, { where: { iduser: req.user.iduser } });
            return res.json({ code: '000', message: 'Foto actualizada correctamente', data: { foto: req.file.path } });
        } catch (error) {
            console.log("error server: ", error);
            return res.status(500).json({ code: '001', message: 'Error del servidor', data: null });
        }
    });
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
