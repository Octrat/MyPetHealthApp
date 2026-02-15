// /Users/mariabelobruh/Desktop/Учеба/Итог/MyPetHealthApp/backend/src/routes/pets.js
import { Router } from 'express';
import { getPets, addPet, getBreeds } from '../controllers/petsController.js';

const router = Router();

// Получить всех питомцев пользователя
router.get('/', getPets);

// Добавить нового питомца
router.post('/', addPet);

// Получить список пород по виду животного (для автокомплита)
router.get('/breeds', getBreeds);

export default router;
