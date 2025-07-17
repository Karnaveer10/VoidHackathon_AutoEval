const mongoose = require('mongoose')
const studentSchema = new mongoose.Schema(
    {
        username:{type:String,required:true,unique:true},
        password:{type:String,required:true},
        reqData:{type:Object,default:{}},
        role:{type:String,default:'student',immutable:true}
    },{minimize:false}
)
const studentModel = mongoose.models.Student || mongoose.model("Student",studentSchema)
module.exports = studentModel;