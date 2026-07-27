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

        console.log("Usuario encontrado ID:", findOneUser.iduser, "Password en BD:", findOneUser.password);

        // Validamos la contraseña (soportando tanto bcrypt como texto plano por si acaso)
        let esValida = false;

        // Si la contraseña en BD comienza con $2b$ o $2a$, es un hash de bcrypt
        if (findOneUser.password.startsWith('$2b$') || findOneUser.password.startsWith('$2a$')) {
            esValida = bcrypt.compareSync(pass, findOneUser.password);
        } else {
            // Si está guardada en texto plano en la BD
            esValida = (pass === findOneUser.password);
        }

        if (!esValida) {
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
        }, "llavecita", {
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
