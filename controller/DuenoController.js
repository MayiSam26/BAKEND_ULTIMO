const tbldueno = require("../Entity/dueno");
const sequilize = require("../database/conection")
const { Op } = require('sequelize');
const tblperdidos = require("../Entity/Perdidos");
const { sellarCreacion, sellarModificacion } = require("../helpers/auditoria");

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
        const {iduser,nombre,facebook,instagram,whatsapp} = req.body

        // Perú: 9 dígitos. Es opcional, pero si viene tiene que estar completo.
        if (whatsapp && !/^\d{9}$/.test(whatsapp)) {
            return res.json({
                code: '001',
                message: 'El WhatsApp debe tener 9 dígitos numéricos.',
                data: null
            });
        }

        const amoMascotas = new tbldueno({
            iduser:iduser,
            nombre:nombre,
            facebook:facebook,
            instagram:instagram,
            whatsapp: whatsapp || null,
            ...sellarCreacion(req),
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
           if (req.body.whatsapp && !/^\d{9}$/.test(req.body.whatsapp)) {
               return res.json({
                   code: '001',
                   message: 'El WhatsApp debe tener 9 dígitos numéricos.',
                   data: null
               });
           }

           await tbldueno.update(sellarModificacion(req, req.body), { where: { iddueno: id } });
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
           // RF05 pide que la mascota perdida muestre el contacto de su dueño:
           // borrarlo dejaría el aviso publicado sin forma de ubicar a nadie.
           const asociadas = await tblperdidos.count({ where: { iddueno: id } });
           if (asociadas > 0) {
               return res.json({
                   code: '001',
                   message: `No se puede eliminar: ${asociadas} mascota(s) perdida(s) tienen a esta persona como dueño. Elimina o reasigna esos registros primero.`,
                   data: null
               });
           }

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