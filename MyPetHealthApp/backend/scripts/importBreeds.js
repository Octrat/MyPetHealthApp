//Users/mariabelobruh/Desktop/Учеба/Итог/MyPetHealthApp/backend/scripts/importBreeds.js
import axios from 'axios';
import pool from '../src/config/database.js';
import dotenv from 'dotenv';

dotenv.config(); // чтобы брать ключи из .env
console.log('DOG_API_KEY:', process.env.DOG_API_KEY);
console.log('CAT_API_KEY:', process.env.CAT_API_KEY);
// Импорт пород собак
const importDogBreeds = async () => {
  const response = await axios.get('https://api.thedogapi.com/v1/breeds', {
    headers: { 'x-api-key': process.env.DOG_API_KEY }
  });

  const breeds = response.data;

  for (const breed of breeds) {
    await pool.query(
      `INSERT INTO breeds (name, species, external_id)
       VALUES ($1, 'dog', $2)
       ON CONFLICT (name, species) DO NOTHING`,
      [breed.name, breed.id]
    );
  }

  console.log(`🐶 Импортировано пород собак: ${breeds.length}`);
};

// Импорт пород кошек
const importCatBreeds = async () => {
  const response = await axios.get('https://api.thecatapi.com/v1/breeds', {
    headers: { 'x-api-key': process.env.CAT_API_KEY }
  });

  const breeds = response.data;

  for (const breed of breeds) {
    await pool.query(
      `INSERT INTO breeds (name, species, external_id)
       VALUES ($1, 'cat', $2)
       ON CONFLICT (name, species) DO NOTHING`,
      [breed.name, breed.id]
    );
  }

  console.log(`🐱 Импортировано пород кошек: ${breeds.length}`);
};

const run = async () => {
  try {
    await importDogBreeds();
    await importCatBreeds();
    console.log('✅ Импорт всех пород завершён');
    process.exit();
  } catch (err) {
    console.error('❌ Ошибка импорта:', err);
    process.exit(1);
  }
};

run();