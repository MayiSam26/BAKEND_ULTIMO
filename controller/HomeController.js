

const tblrefugio = require("../Entity/Refugio");
const sequilize = require("../database/conection")
exports.getHome = async(req, res) =>{
    try {
        await sequilize.query('CALL sp_getRefugio()', { type: sequilize.QueryTypes.RAW })
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
exports.getHomeById = async(req, res) =>{
    try {
        const id = req.params.id; 
        console.log(id)
        await sequilize.query(`CALL sp_getRefugioById(${id})`, { type: sequilize.QueryTypes.RAW })
        .then(results => {
            const result ={
                code :'000',
                message:'success',
                data:results[0]
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

exports.updateHomeById= async(req, res) =>{
    try {
        const id = req.params.id; 
        const idRefugio = await tblrefugio.findOne({
            where:{
                idrefugio: id
            }
        })
        if(!idRefugio){
            const result ={
                code :'001',
                message:'No existe la red social',
                data:null
            }
            res.json(result); 
            next()
        }else{
            await tblrefugio.update(req.body,{
                where:{
                    idrefugio:id
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