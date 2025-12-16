// utils/upload.js  ← SUPER SIMPLE
const multer = require('multer');
const path = require('path');


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '_' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /xlsx|xls/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.includes('spreadsheet') || 
                     file.mimetype.includes('excel');
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files allowed!'));
    }
  }
}).single('excel');

module.exports = { upload };