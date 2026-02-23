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
      const{iduser,Descripcion,Monto,fechato} = req.body
      console.log("iduser",iduser)
      const egresos = new tblregistroegreso({
        iduser:iduser,
        Descripcion:Descripcion,
        Monto:Monto,
        fechato:fechato
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
            await tblregistroegreso.update(req.body,{
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