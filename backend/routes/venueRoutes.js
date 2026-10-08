const express = require('express');
const { listVenues, createVenue, getVenue, updateVenue, deleteVenue } = require('../controllers/venueController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { venueSchema, venueUpdateSchema, venueIdSchema } = require('../validators/venueValidator');

const router = express.Router();

router.use(auth);
router.get('/:id', validate(venueIdSchema), getVenue);
router.put('/:id', validate(venueUpdateSchema, 422), updateVenue);
router.delete('/:id', validate(venueIdSchema), deleteVenue);

module.exports = router;
