const tblUser = require("../Entity/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt")

exports.createUser = async (req, res, next) => {
    try {
        const { usuario, pass } = req.body;

        // Validar que ambos campos existan
        if (!usuario || !pass) {
            return res.status(400).json({ code: '001', message: 'Usuario y contraseña son requeridos.' });
        }

        const user = new tblUser({
            usuario: usuario,
            password: await bcrypt.hash(pass, 12)  // Aquí se arregla el error
        });

        await user.save();

        const result = {
            code: '000',
            message: 'Se creó correctamente',
            data: null
        };

        res.json(result);

    } catch (error) {
        console.log("error server: ", error);
        res.status(500).json({ 'Error server': error });
    }
}

exports.sessionUser = async (req,res,next) =>{
    try {
        const{usuario,pass} = req.body
        console.log("pass",pass)
        const findOneUser = await tblUser.findOne({
            where:{
                usuario:usuario
            }
        })
        // validamos si el usuario existe
        if(!findOneUser){
            const result ={
                code :'001',
                message:'Ese usuario no existe',
                data:null
            }
            res.json(result); 
            next()
        }else{
            if(!bcrypt.compareSync(req.body.pass,findOneUser.password)){
                const result ={
                    code :'001',
                    message:'Contraseña incorrecta o usuario incorrecto',
                    data:null
                }
                res.json(result); 
                next();
            }else{
                 //si el usuario es correcto
                const token = jwt.sign({
                    usuario:findOneUser.usuario,
                    pass:findOneUser.password,
                    iduser:findOneUser.iduser
                },"llavecita",{
                    expiresIn:"4h"
                })
                 //retornar el token
                 res.json(
                    {
                    code:'000',
                    usuario:usuario,
                    token});
            }
        }
    } catch (error) {
        console.log("error server: ",error)
        res.status(500).json({ 'Error server': error });
    }
}