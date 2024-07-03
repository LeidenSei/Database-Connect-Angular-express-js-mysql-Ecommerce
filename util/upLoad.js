const multer= require('multer')
const storage = multer.diskStorage({
    destination:(req,file,callback)=>{
        callback(null,'./public/uploads');
    },
    filename:(req,file,callback)=>{
        callback(null,file.originalname);
    }
});
const upLoadfile = multer({storage:storage});

module.exports=upLoadfile;