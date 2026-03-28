const express = require('express');
const router = express.Router();
const { getRooms, createRoom, joinRoom, createOrGetDM, getRoomById } = require('../controllers/roomController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getRooms);
router.post('/', createRoom);
router.post('/dm', createOrGetDM);
router.get('/:id', getRoomById);
router.post('/:id/join', joinRoom);

module.exports = router;
