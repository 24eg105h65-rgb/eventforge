const express = require('express');
const { listCoupons, createCoupon, getCoupon, updateCoupon, deleteCoupon } = require('../controllers/couponController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { couponSchema, couponUpdateSchema, couponParamsSchema } = require('../validators/couponValidator');

const router = express.Router();

router.use(auth);
router.get('/events/:id/coupons', validate(couponParamsSchema), listCoupons);
router.post('/events/:id/coupons', validate(couponParamsSchema, 422), validate(couponSchema, 422), createCoupon);
router.get('/coupons/:id', validate(couponParamsSchema), getCoupon);
router.put('/coupons/:id', validate(couponUpdateSchema, 422), updateCoupon);
router.delete('/coupons/:id', validate(couponParamsSchema), deleteCoupon);

module.exports = router;
