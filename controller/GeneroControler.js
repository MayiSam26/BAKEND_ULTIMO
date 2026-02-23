const tblgenero = require("../Entity/Genero");
const sequilize = require("../database/conection")
exports.getGenero = async(req, res) =>{
    try {
        await sequilize.query('CALL sp_getGenero()', { type: sequilize.QueryTypes.RAW })
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

exports.createGenero = async(req, res)=>{
    try {
        const {descripcion} = req.body
        const genero = new tblgenero({
            descripcion:descripcion
        })
        await genero.save()
        const result ={
            code :'000',
            message:'Se creo correctamente',
            data:null
        }
        res.json(result); 
    } catch (error) {
        console.log("error server: ",error)
        res.status(500).json({ 'Error server': error });
    }
}