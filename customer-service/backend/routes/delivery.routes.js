// routes/delivery.routes.js
import express from 'express';
import * as deliveryController from '../controllers/delivery.controller.js';

const router = express.Router();

router.post('/deliveries', deliveryController.createDelivery);
router.get('/deliveries', deliveryController.listDeliveries);
router.get('/deliveries/:id', deliveryController.getDelivery);
router.put('/deliveries/:id', deliveryController.updateDelivery);
router.get('/orders/:orderId/deliveries', deliveryController.listByOrder);

export default router;
