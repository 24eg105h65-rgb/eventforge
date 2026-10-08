const express = require('express');
const { getEventRegistrations, getMyRegistrations, createRegistration, getRegistration, updateRegistration, approveRegistration, cancelRegistration } = require('../controllers/registrationController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registrationSchema, registrationUpdateSchema, registrationParamsSchema, registrationListQuery } = require('../validators/registrationValidator');

const router = express.Router();

router.use(auth);
router.get('/registrations', getMyRegistrations);
router.get('/events/:id/registrations', validate(registrationListQuery), getEventRegistrations);
router.post('/events/:id/registrations', validate(registrationSchema, 422), createRegistration);
router.get('/registrations/:id', validate(registrationParamsSchema), getRegistration);
router.put('/registrations/:id', validate(registrationUpdateSchema, 422), updateRegistration);
router.post('/registrations/:id/approve', validate(registrationParamsSchema), approveRegistration);
router.post('/registrations/:id/cancel', validate(registrationParamsSchema), cancelRegistration);

module.exports = router;
