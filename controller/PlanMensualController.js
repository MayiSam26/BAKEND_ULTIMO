const tblplanmensual = require("../Entity/Plan");
const sequilize = require("../database/conection")
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});



const upload = multer({ storage: storage }).single('img');

exports.getPlanMensual = async(req, res) =>{
    try {
        await sequilize.query('CALL sp_getPlanMensual()', { type: sequilize.QueryTypes.RAW })
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

exports.createPlanMensual = async (req, res, next) => {
    try {
      upload(req, res, async (err) => {
        if (err) {
          return res.status(500).json({
            code: '001',
            message: 'Error al subir el archivo ' + err.message,
            data: null
          });
        }
        if (!req.file) {
          return res.status(400).json({
            code: '001',
            message: 'No se ha subido ninguna imagen',
            data: null
          });
        }
  
        const imageUrl = req.file.path;
        const { iduser, content, nombre, cantidad, img } = req.body;
        const planMensual = new tblplanmensual({
          iduser: iduser,
          nombre: nombre,
          content: content,
          img: imageUrl,
          cantidad: cantidad
        });
  
        await planMensual.save();
        const resultado = {
          code: '000',
          message: 'Se creó correctamente',
          data: null
        };
        res.json(resultado);
      });
    } catch (error) {
      console.log("error server: ", error);
      res.status(400).json({
        code: '001',
        message: error,
        data: null
      });
    }
  };

exports.updatePlanMensual = async (req, res, next) => {
    try {
        upload(req, res, async function (err) {
            if (err instanceof multer.MulterError) {
                return res.status(500).json({ error: 'Error al subir la imagen', details: err });
            } else if (err) {
                
                return res.status(500).json({ error: 'Ocurrió un error', details: err });
            }

           
            const id = req.params.id; 
            const plan = await tblplanmensual.findOne({
                where: {
                    idplanmensual: id
                }
            });

            if (!plan) {
                const result = {
                    code: '001',
                    message: 'No existe el plan',
                    data: null
                };
                return res.json(result); 
            }

            const { nombre, content, cantidad } = req.body;
            let imgUrl = ''; 

            if (req.file) {
                imgUrl = req.file.path; 
                await tblplanmensual.update({ img:imgUrl }, {
                    where: {
                        idplanmensual: id
                    }
                });
            }
            
            await tblplanmensual.update({ nombre, content, cantidad }, {
                where: {
                    idplanmensual: id
                }
            });
            console.log("imgUrl",imgUrl)
            const result = {
                code: '000',
                message: 'Se actualizó correctamente',
                data: null
            };
            res.json(result); 
        });

        
    } catch (error) {
        console.log("error server: ", error);
        res.status(500).json({ 'Error server': error });
    }
}






exports.deletPlanById = async(req, res, next) =>{
    try {
        const id = req.params.id; 
        const planFindOne = await tblplanmensual.findOne({
            where:{
                idplanmensual: id
            }
        })

        if(!planFindOne){
            const result ={
                code :'001',
                message:'No existe el plan',
                data:null
            }
            res.json(result); 
        }else{
            await tblplanmensual.destroy({
                where:{
                    idplanmensual:id
                }
            })
            const result ={
                code :'000',
                message:'Se Elimino con exito!',
                data:null
            }
            res.json(result); 
        }

    } catch (error) {
        console.log("error server: ",error)
        res.status(500).json({ 'Error server': error });
    }
}

exports.getDetailPlan = async(req, res, next)=>{
    try {
        const id = req.params.id;
        await sequilize.query(`CALL sp_getByIdPlanMensual(${id})`, { type: sequilize.QueryTypes.RAW })
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