const tblredes = require("../Entity/Redes");
const sequilize = require("../database/conection")

exports.getRedesSocial = async(req, res) =>{
    try {
        await sequilize.query('CALL sp_redesSocial()', { type: sequilize.QueryTypes.RAW })
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

exports.getCreate = async(req, res) =>{
    try {
        const {nombre,icono,link} = req.body
        const redesSocial = new tblredes({
            nombre:nombre,
            icono:icono,
            link:link
        })
        await redesSocial.save()
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

exports.getRedesSocialById = async(req, res) =>{
    try {
        const id = req.params.id;
        await sequilize.query(`CALL sp_getRedesById(${id})`, { type: sequilize.QueryTypes.RAW })
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

exports.updateRedesSocial = async(req, res, next) =>{
    try {
        const id = req.params.id; 
        const redesId = await tblredes.findOne({
            where:{
                idredes: id
            }
        })
        if(!redesId){
            const result ={
                code :'001',
                message:'No existe la red social',
                data:null
            }
            res.json(result); 
            next()
        }else{
            await tblredes.update(req.body,{
                where:{
                    idredes:id
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