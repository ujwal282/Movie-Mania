const express = require('express');
const { getShowtimes, getShowtimeById } = require('../controllers/showtimeController');

const router = express.Router();

router.get('/', getShowtimes);
router.get('/:id', getShowtimeById);

module.exports = router;
