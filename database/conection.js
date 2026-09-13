require("dotenv").config()
const{Sequelize} = require("sequelize")

const database = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD,{
    host: process.env.DB_HOST,
    dialect:'mysql',
    port: process.env.DB_PORT,
    // Sequelize escribe por defecto cada consulta SQL entera en la consola: en
    // Railway eso llenaba los Deploy Logs de SELECT y escondía los errores de
    // verdad. Para verlas al depurar, poner la variable DB_LOG=1.
    logging: process.env.DB_LOG === "1" ? console.log : false,
    define:{
        timestamps:false
    },
    pool:{
        max:5,
        min:0,
        acquire: 30000,
        idle:10000
    }
})

module.exports = database