const tblregistroegreso = require("../Entity/Egreso");
const sequilize = require("../database/conection")

exports.findAllEgreso = async(req, res, next) =>{
    try {
        await sequilize.query('CALL sp_getEgreso()', { type: sequilize.QueryTypes.RAW })
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
exports.createEgreso = async(req, res, next) =>{
    try {
      const{Descripcion,Monto,fechato} = req.body
      // El formulario mandaba iduser:0, que no existe en tbluser: la clave
      // foránea rechazaba el INSERT y no se podía registrar ningún egreso.
      // El dueño del registro es quien tiene la sesión abierta.
      const iduser = req.user ? req.user.iduser : null
      console.log("iduser",iduser)
      const egresos = new tblregistroegreso({
        iduser:iduser,
        Descripcion:Descripcion,
        Monto:Monto,
        fechato:fechato,
        // Auditoría: la pone el servidor, no el formulario.
        creado_en: new Date(),
        creado_por: req.user ? req.user.iduser : null,
      })
      await egresos.save()
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

exports.findByidEgreso = async(req, res, next) =>{
    try {
      const id = req.params.id
      const egresos = await tblregistroegreso.findOne({
        where:{
            idregistroegreso: id
        }
    })
        if(!egresos){
        const result ={
            code :'001',
            message:'No existe el egreso',
            data:null
        }
        res.json(result); 
        next()
        }else{
            const result ={
                code :'000',
                message:'success',
                data:egresos
            }
            res.json(result); 
        }
    } catch (error) {
        console.log("error server: ",error)
        res.status(500).json({ 'Error server': error });
    }
}

exports.updateEgreso = async(req, res, next) =>{
    try {
      const id = req.params.id
      const egresos = await tblregistroegreso.findOne({
        where:{
            idregistroegreso: id
        }
    })
        if(!egresos){
        const result ={
            code :'001',
            message:'No existe el egreso',
            data:null
        }
        res.json(result); 
        next()
        }else{
            // Se copia lo que llega pero la huella de auditoría la escribe el
            // servidor: el cliente no puede fabricar ni borrar quién editó.
            const cambios = { ...req.body };
            delete cambios.creado_en;
            delete cambios.creado_por;
            cambios.modificado_en = new Date();
            cambios.modificado_por = req.user ? req.user.iduser : null;

            await tblregistroegreso.update(cambios,{
                where:{
                    idregistroegreso:id
                }
            })
            const result ={
                code :'000',
                message:'Se actualizo correctamente',
                data:null
            }
            res.json(result); 
        }
    } catch (error) {
        console.log("error server: ",error)
        res.status(500).json({ 'Error server': error });
    }
}