const tbldueno = require("../Entity/dueno");
const sequilize = require("../database/conection")
const { Op } = require('sequelize');

exports.getDueno = async (req, res) => {
    try {
        const { busqueda } = req.body;
        console.log("busqueda:", busqueda);

        const resultados = await tbldueno.findAll({
            where: busqueda ? {
                nombre: {
                    [Op.like]: `%${busqueda}%`
                }
            } : {}
        });

        const result = {
            code: '000',
            message: 'success',
            data: resultados
        };

        res.json(result);

    } catch (error) {
        console.error('Error server:', error);
        res.status(500).json({ error: 'Error server' });
    }
};


exports.createAmo = async(req, res, next) =>{
    try {
        const {iduser,nombre,facebook,instagram} = req.body
        const amoMascotas = new tbldueno({
            iduser:iduser,
            nombre:nombre,
            facebook:facebook,
            instagram:instagram
        })
        await amoMascotas.save()
        const result ={
            code :'000',
            message:'Se creo correctamente',
            data: amoMascotas
        }
        res.json(result); 
    } catch (error) {
        console.log("error server: ",error)
        res.status(500).json({ 'Error server': error });
    }
}

exports.getDetailApoderado = async(req, res, next) =>{
    try {
        const id = req.params.id; 
        const detailApoderado = await tbldueno.findOne({
            where:{
                iddueno:id
            }
        })
        if(!detailApoderado){
            const result ={
                code :'001',
                message:'No existe el dueño seleccionado',
                data: null
            }
            res.json(result); 
        }else{
            const result ={
                code :'000',
                message:'success',
                data: detailApoderado
            }
            res.json(result); 
        }
        
    } catch (error) {
        console.log("error server: ",error)
        res.status(500).json({ 'Error server': error });
    }
}

exports.updateApoderado = async(req, res, next) =>{
    try {
        const id = req.params.id; 
        const detailApoderado = await tbldueno.findOne({
            where:{
                iddueno:id
            }
        })
        if(!detailApoderado){
            const result ={
                code :'001',
                message:'No existe el dueño seleccionado',
                data: null
            }
            res.json(result); 
        }else{
           await tbldueno.update(req.body, { where: { iddueno: id } });
           const result ={
                code :'000',
                message:'Se actulizo correctamente',
                data: null
            }
            res.json(result); 
        }
        
    } catch (error) {
        console.log("error server: ",error)
        res.status(500).json({ 'Error server': error });
    }
}

exports.deleteApoderado = async(req, res, next) =>{
    try {
        const id = req.params.id; 
        const detailApoderado = await tbldueno.findOne({
            where:{
                iddueno:id
            }
        })
        if(!detailApoderado){
            const result ={
                code :'001',
                message:'No existe el dueño seleccionado',
                data: null
            }
            res.json(result); 
        }else{
           await tbldueno.destroy({ where: { iddueno: id } });
           const result ={
                code :'000',
                message:'Se elimino correctamente',
                data: null
            }
            res.json(result); 
        }
        
    } catch (error) {
        console.log("error server: ",error)
        res.status(500).json({ 'Error server': error });
    }
}