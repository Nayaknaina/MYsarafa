const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

require('dotenv').config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
 region: 'eu-north-1',
});


// const storage = multer.diskStorage({
//   // destination: (req, file, cb) => {
//   //   cb(null, path.join(__dirname, '../public/uploads'));
//   // },
//    destination: (req, file, cb) => {
//     const folder = file.fieldname;
//     const uploadPath = path.join(__dirname, `../public/uploads/${folder}`);
//     fs.mkdirSync(uploadPath, { recursive: true });
//     cb(null, uploadPath);
//   },

//   filename: (req, file, cb) => {
//     const fileName = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
//     cb(null, fileName);
//   }
// });

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
   
    acl: 'private', 
    key: function (req, file, cb) {
      const folder = file.fieldname;
      const fileName = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const fullPath = `mysarafa/${folder}/${fileName}`;
      cb(null, fullPath);
    },
  }),
  limits: { fileSize: 1 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // if (file.mimetype.includes('spreadsheet') || 
    //     file.mimetype.includes('excel') || 
    //     file.originalname.match(/\.(xlsx|xls)$/)) {
    //   cb(null, true);
    // } else {
    //   cb(new Error('Only Excel files allowed'));
    // }
    cb(null, true);
  }
});

module.exports = { upload, getSignedUrl: (key) => s3.getSignedUrl('getObject', { Bucket: process.env.AWS_BUCKET_NAME, Key: key, Expires: 3600 }) };