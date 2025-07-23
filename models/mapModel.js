const mongoose = require('mongoose')
const profSchema = new mongoose.Schema(
    {
        profid:{
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
const mapModel = mongoose.models.map || mongoose.model("Map",mapSchema)
module.exports = mapModel