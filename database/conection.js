require("dotenv").config({path:".env"})
const{Sequelize} = require("sequelize")

const database = new Sequelize('railway','root','xUlxsnaGmbTHOaKfSwDaYvyWSHqIUceC',{
    host:'switchback.proxy.rlwy.net',   /* .localhost.. */
    dialect:'mysql',   /* ..mysql. */
    port:31251,     /* ..3306. */
    operatorsAliases:false,
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