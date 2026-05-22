const mongoose=require('mongoose')

const htmlSchema=new mongoose.Schema({
    title: String,
    html: String
})

module.exports=mongoose.model("HtmlContent",htmlSchema)
