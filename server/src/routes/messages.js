const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getMessages, uploadMedia } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt|zip|mp4|mp3/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    if (ext) return cb(null, true);
    cb(new Error('File type not allowed.'));
  },
});

router.use(protect);

router.get('/:roomId', getMessages);
router.post('/upload', upload.single('file'), uploadMedia);

module.exports = router;
