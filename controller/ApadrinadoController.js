const tblapadrinado = require("../Entity/Apadriando");
const sequilize = require("../database/conection")
exports.getApadrinado = async(req, res, next) =>{
    try {
        await sequilize.query('CALL sp_apadrinado()', { type: sequilize.QueryTypes.RAW })
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

exports.createApadrinado = async(req, res, next) =>{
    try {
       
        const createApadrinado = await tblapadrinado.create(req.body);
        await createApadrinado.save(createApadrinado);
        const result ={
            code :'000',
            message:'Se creó correctamente',
            data:null
        }
        res.json(result); 
    } catch (error) {
        console.log("error server: ",error)
        res.status(500).json({ 'Error server': error });
    }
}

exports.detailApadrinado = async(req, res, next) =>{
    try {
        const id = req.params.id; 
        const detailApadrinado = await tblapadrinado.findOne({
            where:{
                idapadrinado:id
            }
        })
        if(!detailApadrinado){
            const result ={
                code :'001',
                message:'No existe el apadrinado seleccionado',
                data: null
            }
            res.json(result); 
        }else{
            const result ={
                code :'000',
                message:'success',
                data: detailApadrinado
            }
            res.json(result); 
        }
        
    } catch (error) {
        console.log("error server: ",error)
        res.status(500).json({ 'Error server': error });
    }
}

exports.updateApadrinado = async(req, res, next) =>{
    try {
        const id = req.params.id; 
        const detailApadrinado = await tblapadrinado.findOne({
            where:{
                idapadrinado:id
            }
        })
        if(!detailApadrinado){
            const result ={
                code :'001',
                message:'No existe el apadrinado seleccionado',
                data: null
            }
            res.json(result); 
        }else{
            await tblapadrinado.update(req.body,{
                where:{
                    idapadrinado:id
                }
            })
            const result ={
                code :'000',
                message:'Se actualizo correctamente',
                data: null
            }
            res.json(result); 
        }
        
    } catch (error) {
        console.log("error server: ",error)
        res.status(500).json({ 'Error server': error });
    }
}