const htmlContent = require("../models/HtmlContent");

exports.getAllHtmlContent = async (req, res) => {
    try {
        const htmlContents = await htmlContent.find();
        // console.log(htmlContents);
        res.json(htmlContents);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};