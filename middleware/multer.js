const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  // destination: (req, file, cb) => {
  //   cb(null, path.join(__dirname, '../public/uploads'));
  // },
   destination: (req, file, cb) => {
    const folder = file.fieldname;
    const uploadPath = path.join(__dirname, `../public/uploads/${folder}`);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const fileName = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    cb(null, fileName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 }, 
  // fileFilter: (req, file, cb) => {
  //   if (file.mimetype.match(/(image\/|application\/pdf)/)) {
  //     cb(null, true);
  //   } else {
  //     cb(new Error(`Invalid file type for ${file.fieldname}. Only images and PDFs are allowed.`), false);
  //   }
  // }
});

module.exports = upload;