import express from "express";
import * as customer from "../controllers/customer.controller.js";
import auth from "../middleware/auth.middleware.js"; 

const router = express.Router();

router.get("/me", auth, customer.me);
router.put("/me", auth, customer.updateMe);
router.delete("/me", auth, customer.deleteMe);

export default router;
