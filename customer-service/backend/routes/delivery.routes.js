import express from 'express';
import * as deliveryController from '../controllers/delivery.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Semua route delivery pakai autentikasi
router.post('/deliveries', authenticate, deliveryController.createDelivery);
router.get('/deliveries', authenticate, deliveryController.listDeliveries);
router.get('/deliveries/:id', authenticate, deliveryController.getDelivery);
router.put('/deliveries/:id', authenticate, deliveryController.updateDelivery);
router.get('/orders/:orderId/deliveries', authenticate, deliveryController.listByOrder);

export default router;
