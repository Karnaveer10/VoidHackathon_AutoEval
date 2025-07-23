const mongoose = require('mongoose')
const extSchema = new mongoose.Schema(
    {
        id:{
            type:String, required:true
        },
        password:{
            type:String, required:true
        },
        mapped:{
            type :Object ,default : {}
        },
        role:{
            type:String, default:'panel',immutable:true
        }
    }
)
const extModel = mongoose.models.ext || mongoose.model("Ext",extSchema)
module.exports = extModel