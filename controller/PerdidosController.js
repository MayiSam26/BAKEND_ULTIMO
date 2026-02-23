const tblmascotaperdida = require("../Entity/Perdidos");
const sequilize = require("../database/conection")
const moment = require('moment')
exports.getPerdidos = async(req, res) =>{
    try {
        const{nombreBusqueda,idTipoAnimalBusqueda,idGeneroBusqueda,statusBusqueda,fechaBusqueda} = req.body
        const status = statusBusqueda ? `'${statusBusqueda}'`:null
        const dates = fechaBusqueda ? `'${moment(fechaBusqueda).add(1, "days").format('YYYY-MM-DD')}'`:null
        const search = nombreBusqueda ? `'${nombreBusqueda}'`:`''`
        await sequilize.query(`CALL sp_getMascotasPerdidos_all(${search},${idTipoAnimalBusqueda},${idGeneroBusqueda},${status},${dates})`, { type: sequilize.QueryTypes.RAW })
        .then(results => {
            const result ={
                code :'000',
                message:'success',
                data:results
            }
            res.json(result); 
        })
        .catch(error => {
          
            console.error('Error server:', error);
            res.status(500).json({ error: 'Error server' });
        });
    } catch (error) {
        console.log("error server: ",error)
        res.status(500).json({ 'Error server': error });
    }
}

exports.getPerdidosTopfour = async(req, res) =>{
    try {
        await sequilize.query('CALL sp_getPerdidos_recientes()', { type: sequilize.QueryTypes.RAW })
        .then(results => {
            const result ={
                code :'000',
                message:'success',
                data:results
            }
            res.json(result); 
        })
        .catch(error => {
          
            console.error('Error server:', error);
            res.status(500).json({ error: 'Error server' });
        });
    } catch (error) {
        console.log("error server: ",error)
        res.status(500).json({ 'Error server': error });
    }
}
exports.createPerdidos = async(req, res, next) =>{
    try {
        const {iduser,iddueno,Nombre,foto,Edad,idtipoanimal,idgenero,tamano,Observaciones,Fecha_Extravio} = req.body
        const mascotasPerdidos = new tblmascotaperdida({
            iduser:iduser,
            iddueno:iddueno,
            Nombre:Nombre,
            foto:foto,
            Edad:Edad,
            idtipoanimal:idtipoanimal,
            idgenero:idgenero,
            tamano:tamano,
            Observaciones:Observaciones,
            Fecha_Extravio:Fecha_Extravio
        })
        await mascotasPerdidos.save()
        const result ={
            code :'000',
            message:'Se creo correctamente',
            data: null
        }
        res.json(result); 
    } catch (error) {
        console.log("error server: ",error)
        res.status(500).json({ 'Error server': error });
    }
}

exports.getDetail = async(req, res, next) =>{
    try {
        const id = req.params.id; // Obtén el valor de id directamente de req.params
        const mascotaPerdidas = await tblmascotaperdida.findOne({
            where:{
                idmascotaperdida: id
            }
        })
    if(!mascotaPerdidas){
        const result ={
            code :'001',
            message:'No existe la mascota perdida',
            data:null
        }
        res.json(result); 
        next()
    }else{
        await sequilize.query(`CALL sp_detailmascota_perdida(${id})`, { type: sequilize.QueryTypes.RAW })
        .then(results => {
            const result ={
                code :'000',
                message:'success',
                data:results
            }
            res.json(result); 
        })
        .catch(error => {
          
            console.error('Error server:', error);
            res.status(500).json({ error: 'Error server' });
        });
    }
    } catch (error) {
        console.log("error server: ",error)
        res.status(500).json({ 'Error server': error });
    }
}