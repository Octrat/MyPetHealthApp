//Users/mariabelobruh/Desktop/Учеба/Итог/MyPetHealthApp/backend/src/routes/vision.js
import express from 'express';
import { visionController } from '../controllers/visionController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/recognize', authenticateToken, visionController.recognizeBreed);
router.get('/test', authenticateToken, visionController.testVision);

export default router;