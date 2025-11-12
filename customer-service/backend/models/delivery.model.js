// delivery.model.js
const deliveries = [];
let nextId = 1;

class Delivery {
    constructor({ orderId, userId, address, status = 'pending', eta = null, shippedAt = null }) {
        this.id = nextId++;
        this.orderId = orderId;
        this.userId = userId;
        this.status = status; // pending, picked, in_transit, delivered, cancelled
        this.eta = eta; // ISO date string
        this.shippedAt = shippedAt; // ISO date string
        this.createdAt = new Date().toISOString();
        this.updatedAt = this.createdAt;
    }
}

const create = (payload) => {
    const d = new Delivery(payload);
    deliveries.push(d);
    return d;
};

const update = (id, patch) => {
    const d = deliveries.find(x => x.id === Number(id));
    if (!d) return null;
    Object.assign(d, patch);
    d.updatedAt = new Date().toISOString();
    return d;
};

const findById = (id) => deliveries.find(d => d.id === Number(id));
const findByOrderId = (orderId) => deliveries.filter(d => d.orderId === Number(orderId));
const list = () => deliveries.slice();

// default export agar bisa import DeliveryModel dari ES Module
export default { Delivery, deliveries, create, update, findById, findByOrderId, list };
