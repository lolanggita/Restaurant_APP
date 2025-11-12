// controllers/delivery.controller.js
import DeliveryModel from '../models/delivery.model.js';


export const createDelivery = (req, res) => {
    try {
        const { orderId, userId, address, eta } = req.body;
        if (!orderId || !userId || !address) {
        return res.status(400).json({ message: 'orderId, userId and address are required' });
        }
        const delivery = DeliveryModel.create({ orderId, userId, address, eta });
        return res.status(201).json(delivery);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getDelivery = (req, res) => {
    try {
        const { id } = req.params;
        const d = DeliveryModel.findById(id);
        if (!d) return res.status(404).json({ message: 'Delivery not found' });
        return res.json(d);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const listDeliveries = (req, res) => {
    try {
        const all = DeliveryModel.list();
        return res.json(all);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateDelivery = (req, res) => {
    try {
        const { id } = req.params;
        const patch = req.body;
        const updated = DeliveryModel.update(id, patch);
        if (!updated) return res.status(404).json({ message: 'Delivery not found' });
        return res.json(updated);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const listByOrder = (req, res) => {
    try {
        const { orderId } = req.params;
        const list = DeliveryModel.findByOrderId(orderId);
        return res.json(list);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
