const btlauditoria = require("../Entity/Auditoria");

exports.createAuditoria = async(req, res, next) =>{
    try {
      const {fechaInicio,modulo,fechaRegistro,resultado} = req.body
      const create =  new btlauditoria({
        fechaInicio:fechaInicio,
        modulo:modulo,
        fechaRegistro:fechaRegistro,
        resultado:resultado
      })
      await  create.save()
      const result ={
        code :'000',
        message:'success',
        data:create
    }
    res.json(result);
    } catch (error) {
        console.log("error server: ",error)
        res.status(500).json({ 'Error server': error });
    }
}

exports.updateAuditoria = async (req, res, next) => {
    try {
        const id = req.params.id;
        const auditoriaId = await btlauditoria.findOne({
            where: {
                idauditoria: id
            }
        });

        if (!auditoriaId) {
            const result = {
                code: '001',
                message: 'No existe código de auditoria',
                data: null
            };
            res.json(result);
            next();
        } else {
            // Actualizar la auditoría, incluyendo la fecha de registro si está presente en la solicitud
            await btlauditoria.update(req.body, {
                where: {
                    idauditoria: id
                }
            });

            // Recuperar la auditoría actualizada
            const updatedAuditoria = await btlauditoria.findOne({
                where: {
                    idauditoria: id
                }
            });

            // Calcular la diferencia entre fechaInicio y fechaRegistro
            const fechaInicio = new Date(updatedAuditoria.fechaInicio);
            const fechaRegistro = new Date(updatedAuditoria.fechaRegistro);
            const diferenciaTiempo = fechaRegistro.getTime() - fechaInicio.getTime();
            
            // Convertir la diferencia de milisegundos a minutos y segundos
            const minutos = Math.floor(diferenciaTiempo / (1000 * 60));

            // Guardar la diferencia en el campo resultado
            await btlauditoria.update({ resultado: minutos }, {
                where: {
                    idauditoria: id
                }
            });

            const result = {
                code: '000',
                message: 'Se actualizó correctamente',
                data: null
            };
            res.json(result);
        }

    } catch (error) {
        console.log("error server: ", error);
        res.status(500).json({ 'Error server': error });
    }
}

