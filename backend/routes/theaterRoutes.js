const express = require('express');
const { getTheaters, getNearestTheatersList } = require('../controllers/theaterController');

const router = express.Router();

router.get('/', getTheaters);
router.get('/nearest', getNearestTheatersList);

module.exports = router;
