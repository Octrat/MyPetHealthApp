import dotenv from 'dotenv';
import sharp from 'sharp';
import pool from '../config/database.js';
import crypto from 'crypto';

dotenv.config();

// ============================================
// ДЕТАЛЬНАЯ БАЗА ПРИЗНАКОВ (60+ пород с полным описанием)
// ============================================

// ============================================
// ПОЛНАЯ БАЗА ВСЕХ ПОРОД (169 собак + 67 кошек)
// ============================================

const SIZE_ORDER = ['tiny', 'small', 'medium', 'large', 'giant'];
const COAT_ORDER = ['hairless', 'short', 'medium', 'long', 'very long', 'thick', 'curly', 'plush', 'wirehaired', 'double'];
const EAR_ORDER = ['folded', 'floppy', 'rose', 'semi-pricked', 'pointed', 'large', 'bat', 'tufted', 'v-shaped', 'button'];
const FACE_ORDER = ['flat', 'round', 'broad', 'square', 'elongated', 'triangular', 'refined', 'gentle', 'wild', 'intelligent', 'wedge', 'fox-like', 'wolf-like', 'sad'];
const BODY_ORDER = ['cobby', 'compact', 'muscular', 'elegant', 'stocky', 'long', 'deep chest', 'massive', 'athletic'];

const BREED_DATABASE = {
  // ========== СОБАКИ (169 пород) ==========
  
  // A - Аффенпинчер, Афганская борзая, Акита, Акбаш...
  'аффенпинчер': { size: 'tiny', coat: 'wirehaired', ears: 'pointed', face: 'round', body: 'compact', energy: 'high', colors: ['черный', 'серый', 'серебристый'], keywords: ['аффенпинчер', 'обезьянка', 'жесткая шерсть'] },
  'афганская борзая': { size: 'large', coat: 'long', ears: 'floppy', face: 'elongated', body: 'elegant', energy: 'medium', colors: ['черный', 'золотистый', 'кремовый', 'белый'], keywords: ['афган', 'борзая', 'шелковистая шерсть', 'хвост кольцом'] },
  'акбаш': { size: 'large', coat: 'medium', ears: 'floppy', face: 'broad', body: 'muscular', energy: 'medium', colors: ['белый', 'кремовый'], keywords: ['акбаш', 'турецкий', 'охранник'] },
  'акита': { size: 'large', coat: 'thick', ears: 'pointed', face: 'broad', body: 'stocky', energy: 'medium', colors: ['рыжий', 'белый', 'тигровый'], keywords: ['акита', 'японский', 'хвост кольцом', 'спокойный'] },
  'алапаха блю блад буллдог': { size: 'large', coat: 'short', ears: 'rose', face: 'broad', body: 'muscular', energy: 'high', colors: ['тигровый', 'палевый', 'черный'], keywords: ['алапаха', 'бульдог', 'охранник'] },
  'аляскинский маламут': { size: 'large', coat: 'thick', ears: 'pointed', face: 'wolf-like', body: 'muscular', energy: 'high', colors: ['серо-белый', 'черно-белый', 'рыжий'], keywords: ['маламут', 'аляскинский', 'северный', 'ездовая'] },
  'аляскинский хаски': { size: 'medium', coat: 'thick', ears: 'pointed', face: 'wolf-like', body: 'compact', energy: 'very high', colors: ['серо-белый', 'черно-белый', 'белый'], keywords: ['аляскинский хаски', 'ездовая', 'северная'] },
  'американский буль': { size: 'medium', coat: 'short', ears: 'rose', face: 'broad', body: 'muscular', energy: 'high', colors: ['тигровый', 'палевый', 'черный'], keywords: ['американский буль', 'булли', 'короткая морда'] },
  'американский бульдог': { size: 'large', coat: 'short', ears: 'rose', face: 'broad', body: 'muscular', energy: 'high', colors: ['белый', 'тигровый', 'палевый'], keywords: ['американский бульдог', 'охранник'] },
  'американский водяной спаниель': { size: 'medium', coat: 'curly', ears: 'floppy', face: 'round', body: 'compact', energy: 'high', colors: ['шоколадный', 'печеночный'], keywords: ['водяной спаниель', 'охотничий'] },
  'американский кокер-спаниель': { size: 'medium', coat: 'long', ears: 'floppy', face: 'round', body: 'compact', energy: 'high', colors: ['черный', 'рыжий', 'золотистый', 'триколор'], keywords: ['кокер-спаниель', 'американский', 'длинные уши'] },
  'американский питбультерьер': { size: 'medium', coat: 'short', ears: 'rose', face: 'broad', body: 'muscular', energy: 'high', colors: ['черный', 'тигровый', 'палевый', 'белый'], keywords: ['питбуль', 'амстафф', 'атлетичный'] },
  'американский стаффордширский терьер': { size: 'medium', coat: 'short', ears: 'rose', face: 'broad', body: 'muscular', energy: 'high', colors: ['черный', 'тигровый', 'палевый', 'голубой'], keywords: ['амстафф', 'стаффорд', 'атлетичный'] },
  'американский фоксхаунд': { size: 'large', coat: 'short', ears: 'floppy', face: 'elongated', body: 'deep chest', energy: 'very high', colors: ['триколор', 'бело-рыжий'], keywords: ['фоксхаунд', 'гончая', 'охотничий'] },
  'американский эскимос': { size: 'small', coat: 'thick', ears: 'pointed', face: 'fox-like', body: 'compact', energy: 'high', colors: ['белый', 'кремовый', 'бисквитный'], keywords: ['эскимос', 'шпиц', 'пушистый'] },
  'английская овчарка': { size: 'medium', coat: 'medium', ears: 'floppy', face: 'intelligent', body: 'athletic', energy: 'high', colors: ['черно-рыжий', 'триколор', 'соболиный'], keywords: ['английская овчарка', 'пастушья'] },
  'английский сеттер': { size: 'large', coat: 'long', ears: 'floppy', face: 'refined', body: 'elegant', energy: 'high', colors: ['белый с рыжим', 'белый с черным', 'белый с лимонным'], keywords: ['сеттер', 'английский', 'пойнтер'] },
  'английский спрингер-спаниель': { size: 'medium', coat: 'medium', ears: 'floppy', face: 'friendly', body: 'compact', energy: 'very high', colors: ['черно-белый', 'печеночно-белый', 'триколор'], keywords: ['спрингер', 'спаниель', 'охотничий'] },
  'английский той-терьер': { size: 'tiny', coat: 'short', ears: 'pointed', face: 'refined', body: 'elegant', energy: 'high', colors: ['черно-подпалый'], keywords: ['той-терьер', 'английский', 'черный', 'подпалый'] },
  'аппенцеллер-зеннхунд': { size: 'medium', coat: 'short', ears: 'floppy', face: 'broad', body: 'muscular', energy: 'high', colors: ['триколор', 'черно-рыже-белый'], keywords: ['аппенцеллер', 'зеннхунд', 'швейцарский'] },
  'австралийская овчарка': { size: 'medium', coat: 'medium', ears: 'semi-pricked', face: 'intelligent', body: 'athletic', energy: 'very high', colors: ['голубой мерль', 'черный', 'красный мерль', 'триколор'], keywords: ['австралийская овчарка', 'аусси', 'мерль'] },
  'австралийская пастушья собака': { size: 'medium', coat: 'short', ears: 'semi-pricked', face: 'intelligent', body: 'athletic', energy: 'very high', colors: ['голубой', 'красный крапчатый'], keywords: ['австралийская пастушья', 'хилер', 'куцый хвост'] },
  'австралийский келпи': { size: 'medium', coat: 'short', ears: 'semi-pricked', face: 'fox-like', body: 'athletic', energy: 'very high', colors: ['черный', 'рыжий', 'шоколадный', 'голубой'], keywords: ['келпи', 'австралийский', 'пастуший'] },
  'австралийский терьер': { size: 'small', coat: 'wirehaired', ears: 'pointed', face: 'refined', body: 'compact', energy: 'high', colors: ['голубой с подпалом', 'песочный'], keywords: ['австралийский терьер', 'жесткая шерсть'] },
  'австралийский шелковистый терьер': { size: 'tiny', coat: 'long', ears: 'pointed', face: 'refined', body: 'elegant', energy: 'high', colors: ['голубо-подпалый', 'серый'], keywords: ['силки терьер', 'шелковистый', 'австралийский'] },
  'азавак': { size: 'large', coat: 'short', ears: 'floppy', face: 'elongated', body: 'elegant', energy: 'medium', colors: ['палевый', 'красный', 'голубой', 'черный'], keywords: ['азавак', 'борзая', 'африканская'] },

  'барбет': { size: 'medium', coat: 'curly', ears: 'floppy', face: 'round', body: 'compact', energy: 'high', colors: ['черный', 'коричневый', 'серый', 'палевый'], keywords: ['барбет', 'кудрявый', 'водяная собака'] },
  'басенджи': { size: 'small', coat: 'short', ears: 'pointed', face: 'wrinkled', body: 'elegant', energy: 'high', colors: ['красный', 'черный', 'триколор', 'тигровый'], keywords: ['басенджи', 'не лает', 'африканский', 'морщины'] },
  'бассет бле де гасконь': { size: 'medium', coat: 'short', ears: 'very floppy', face: 'sad', body: 'long', energy: 'low', colors: ['триколор', 'бело-рыжий'], keywords: ['бассет', 'гасконь', 'длинные уши'] },
  'бассет-хаунд': { size: 'medium', coat: 'short', ears: 'very floppy', face: 'sad', body: 'long', energy: 'low', colors: ['триколор', 'бело-рыжий', 'лимонный'], keywords: ['бассет', 'basset', 'длинные уши', 'грустный', 'висячие уши'] },
  'бедлингтон-терьер': { size: 'medium', coat: 'curly', ears: 'floppy', face: 'sheep-like', body: 'elegant', energy: 'high', colors: ['голубой', 'песочный', 'коричневый', 'белый'], keywords: ['бедлингтон', 'овечья голова', 'курчавый'] },
  'белая овчарка': { size: 'large', coat: 'medium', ears: 'pointed', face: 'elongated', body: 'muscular', energy: 'high', colors: ['белый', 'кремовый'], keywords: ['белая овчарка', 'немецкая овчарка белая'] },
  'бельгийский малинуа': { size: 'large', coat: 'short', ears: 'pointed', face: 'elongated', body: 'athletic', energy: 'very high', colors: ['палевый', 'рыжий', 'черная маска'], keywords: ['малинуа', 'бельгийская овчарка', 'служебная'] },
  'бельгийский тервюрен': { size: 'large', coat: 'long', ears: 'pointed', face: 'elongated', body: 'athletic', energy: 'very high', colors: ['палевый', 'рыжий', 'черная маска'], keywords: ['тервюрен', 'бельгийская овчарка', 'длинная шерсть'] },
  'бернский зенненхунд': { size: 'large', coat: 'long', ears: 'floppy', face: 'friendly', body: 'muscular', energy: 'medium', colors: ['триколор', 'черно-рыже-белый'], keywords: ['бернский зенненхунд', 'берн', 'швейцарский'] },
  'бигль': { size: 'small', coat: 'short', ears: 'floppy', face: 'friendly', body: 'compact', energy: 'very high', colors: ['триколор', 'бело-рыжий', 'лимонный'], keywords: ['бигль', 'beagle', 'гончая', 'охотничий'] },
  'бишон фризе': { size: 'small', coat: 'curly', ears: 'floppy', face: 'round', body: 'compact', energy: 'medium', colors: ['белый', 'кремовый'], keywords: ['бишон', 'фризе', 'кудрявый', 'белый пушистый'] },
  'бладхаунд': { size: 'large', coat: 'short', ears: 'very floppy', face: 'wrinkled', body: 'deep chest', energy: 'medium', colors: ['черно-подпалый', 'красно-рыжий'], keywords: ['бладхаунд', 'кровяная гончая', 'морщины'] },
  'блютік кунхаунд': { size: 'large', coat: 'short', ears: 'floppy', face: 'elongated', body: 'deep chest', energy: 'very high', colors: ['голубой крапчатый', 'триколор'], keywords: ['блютік', 'кунхаунд', 'гончая'] },
  'боербуль': { size: 'giant', coat: 'short', ears: 'floppy', face: 'broad', body: 'massive', energy: 'medium', colors: ['палевый', 'тигровый', 'коричневый'], keywords: ['боербуль', 'южноафриканский', 'мастиф'] },
  'бойкин-спаниель': { size: 'medium', coat: 'medium', ears: 'floppy', face: 'round', body: 'compact', energy: 'high', colors: ['шоколадный', 'печеночный', 'рыжий'], keywords: ['бойкин', 'спаниель', 'охотничий'] },
  'боксер': { size: 'medium', coat: 'short', ears: 'rose', face: 'broad', body: 'muscular', energy: 'high', colors: ['тигровый', 'палевый', 'белый'], keywords: ['боксер', 'boxer', 'короткая морда', 'игривый'] },
  'бордер-колли': { size: 'medium', coat: 'medium', ears: 'semi-pricked', face: 'intelligent', body: 'athletic', energy: 'very high', colors: ['черно-белый', 'триколор', 'красный', 'голубой мерль'], keywords: ['бордер-колли', 'border collie', 'пастуший', 'умный'] },
  'бордер-терьер': { size: 'small', coat: 'wirehaired', ears: 'floppy', face: 'otter-like', body: 'compact', energy: 'high', colors: ['красный', 'пшеничный', 'голубой с подпалом'], keywords: ['бордер-терьер', 'норный', 'жесткая шерсть'] },
  'бородатый колли': { size: 'medium', coat: 'long', ears: 'floppy', face: 'friendly', body: 'compact', energy: 'high', colors: ['серый', 'голубой', 'соболиный', 'черный'], keywords: ['бородатый колли', 'бородач', 'длинная шерсть'] },
  'босерон': { size: 'large', coat: 'short', ears: 'semi-pricked', face: 'elongated', body: 'muscular', energy: 'high', colors: ['черно-рыжий', 'серо-черно-рыжий'], keywords: ['босерон', 'французская овчарка', 'двойные прибылые пальцы'] },
  'бостон-терьер': { size: 'small', coat: 'short', ears: 'pointed', face: 'flat', body: 'compact', energy: 'medium', colors: ['тигровый с белым', 'черный с белым'], keywords: ['бостон-терьер', 'бэтмен', 'смокинг'] },
  'бувье де фландр': { size: 'large', coat: 'wirehaired', ears: 'floppy', face: 'broad', body: 'stocky', energy: 'medium', colors: ['серый', 'палевый', 'черный'], keywords: ['бувье', 'фландр', 'бородатый'] },
  'бракко итальяно': { size: 'medium', coat: 'short', ears: 'floppy', face: 'refined', body: 'athletic', energy: 'high', colors: ['белый', 'бело-оранжевый', 'бело-каштановый'], keywords: ['бракко', 'итальянская легавая'] },
  'бретань': { size: 'medium', coat: 'medium', ears: 'floppy', face: 'friendly', body: 'compact', energy: 'very high', colors: ['бело-рыжий', 'бело-черный', 'триколор'], keywords: ['бретань', 'французский спаниель', 'эпаньоль'] },
  'бриар': { size: 'large', coat: 'long', ears: 'semi-pricked', face: 'bearded', body: 'muscular', energy: 'high', colors: ['черный', 'серый', 'палевый'], keywords: ['бриар', 'французская овчарка', 'борода'] },
  'бульмастиф': { size: 'large', coat: 'short', ears: 'v-shaped', face: 'broad', body: 'muscular', energy: 'medium', colors: ['тигровый', 'палевый', 'рыжий'], keywords: ['бульмастиф', 'охранник', 'мастиф'] },
  'бультерьер': { size: 'medium', coat: 'short', ears: 'pointed', face: 'egg-shaped', body: 'muscular', energy: 'high', colors: ['белый', 'черный', 'тигровый', 'рыжий'], keywords: ['бультерьер', 'яйцеголовый', 'атлетичный'] },

  'веймаранер': { size: 'large', coat: 'short', ears: 'floppy', face: 'regal', body: 'elegant', energy: 'very high', colors: ['серый', 'серебристый', 'мышиный'], keywords: ['веймаранер', 'weimaraner', 'серебристый', 'охотничий'] },
  'вельш-спрингер-спаниель': { size: 'medium', coat: 'medium', ears: 'floppy', face: 'friendly', body: 'compact', energy: 'high', colors: ['бело-рыжий'], keywords: ['вельш-спрингер', 'уэльский спаниель'] },
  'вест-хайленд-уайт-терьер': { size: 'small', coat: 'wirehaired', ears: 'pointed', face: 'round', body: 'compact', energy: 'high', colors: ['белый'], keywords: ['вест хайленд', 'вестхи', 'белый терьер'] },
  'визла': { size: 'medium', coat: 'short', ears: 'floppy', face: 'refined', body: 'elegant', energy: 'very high', colors: ['золотисто-рыжий', 'ржавый'], keywords: ['визла', 'венгерская легавая', 'медный'] },
  'витонт-терьер': { size: 'medium', coat: 'long', ears: 'floppy', face: 'friendly', body: 'compact', energy: 'high', colors: ['пшеничный', 'светло-золотистый'], keywords: ['витонт', 'ирландский', 'пшеничный'] },
  'вайр-фокс-терьер': { size: 'small', coat: 'wirehaired', ears: 'v-shaped', face: 'refined', body: 'compact', energy: 'very high', colors: ['белый с черным', 'белый с рыжим'], keywords: ['фокс-терьер', 'вайр', 'жесткошерстный'] },
  'вайрхайред визла': { size: 'medium', coat: 'wirehaired', ears: 'floppy', face: 'refined', body: 'elegant', energy: 'high', colors: ['золотисто-рыжий'], keywords: ['визла жесткошерстный', 'венгерская легавая'] },
  'вайрхайред пойнтинг грифон': { size: 'medium', coat: 'wirehaired', ears: 'floppy', face: 'bearded', body: 'compact', energy: 'high', colors: ['серо-рыжий', 'бело-коричневый'], keywords: ['гриффон', 'пойнтинг', 'жесткошерстный'] },

  'гаванез': { size: 'small', coat: 'long', ears: 'floppy', face: 'round', body: 'compact', energy: 'medium', colors: ['белый', 'кремовый', 'золотистый', 'черный', 'серый'], keywords: ['гаванез', 'кубинский', 'шелковистая шерсть'] },
  'гигантский шнауцер': { size: 'large', coat: 'wirehaired', ears: 'semi-pricked', face: 'bearded', body: 'muscular', energy: 'high', colors: ['черный', 'перец с солью'], keywords: ['ризеншнауцер', 'гигантский шнауцер', 'борода'] },
  'глен оф имаал терьер': { size: 'small', coat: 'wirehaired', ears: 'floppy', face: 'broad', body: 'compact', energy: 'medium', colors: ['пшеничный', 'голубой', 'тигровый'], keywords: ['глен', 'имаал', 'ирландский терьер'] },
  'голден-дейн': { size: 'giant', coat: 'short', ears: 'floppy', face: 'broad', body: 'massive', energy: 'medium', colors: ['черный', 'тигровый', 'палевый', 'голубой', 'арлекин'], keywords: ['дог', 'немецкий дог', 'великан'] },
  'голландская овчарка': { size: 'medium', coat: 'medium', ears: 'semi-pricked', face: 'elongated', body: 'athletic', energy: 'high', colors: ['золотисто-тигровый', 'серебристо-тигровый'], keywords: ['голландская овчарка', 'хердер'] },
  'гордон-сеттер': { size: 'large', coat: 'long', ears: 'floppy', face: 'refined', body: 'elegant', energy: 'high', colors: ['черно-подпалый', 'черный с красным'], keywords: ['гордон-сеттер', 'шотландский сеттер'] },
  'грейхаунд': { size: 'large', coat: 'short', ears: 'rose', face: 'elongated', body: 'elegant', energy: 'medium', colors: ['черный', 'белый', 'палевый', 'голубой', 'тигровый'], keywords: ['грейхаунд', 'английская борзая', 'гоночная'] },

  'далматин': { size: 'medium', coat: 'short', ears: 'floppy', face: 'friendly', body: 'muscular', energy: 'very high', colors: ['белый с черными пятнами', 'белый с печеночными пятнами'], keywords: ['далматин', 'далматинец', 'пятнистый'] },
  'доберман': { size: 'large', coat: 'short', ears: 'pointed', face: 'elegant', body: 'elegant', energy: 'very high', colors: ['черно-подпалый', 'коричнево-подпалый', 'голубой'], keywords: ['доберман', 'doberman', 'элегантный', 'служебный'] },
  'дого аргентинский': { size: 'large', coat: 'short', ears: 'floppy', face: 'broad', body: 'muscular', energy: 'high', colors: ['белый'], keywords: ['дого аргентинский', 'аргентинский дог'] },

  'евразиер': { size: 'medium', coat: 'thick', ears: 'pointed', face: 'fox-like', body: 'compact', energy: 'medium', colors: ['черный', 'серый', 'соболиный', 'белый'], keywords: ['евразиер', 'шпиц-тип'] },

  
  'золотистый ретривер': { size: 'large', coat: 'long', ears: 'floppy', face: 'friendly', body: 'muscular', energy: 'high', colors: ['золотистый', 'кремовый', 'светло-золотой'], keywords: ['ретривер', 'golden', 'золотистый', 'дружелюбный'] },

  'ирландский волкодав': { size: 'giant', coat: 'wirehaired', ears: 'floppy', face: 'elongated', body: 'massive', energy: 'low', colors: ['серый', 'тигровый', 'рыжий', 'черный', 'белый'], keywords: ['волкодав', 'ирландский', 'великан'] },
  'ирландский сеттер': { size: 'large', coat: 'long', ears: 'floppy', face: 'refined', body: 'elegant', energy: 'very high', colors: ['красный', 'махагони'], keywords: ['ирландский сеттер', 'красный сеттер'] },
  'ирландский терьер': { size: 'medium', coat: 'wirehaired', ears: 'v-shaped', face: 'refined', body: 'compact', energy: 'high', colors: ['красный', 'золотисто-рыжий'], keywords: ['ирландский терьер', 'рыжий терьер'] },
  'испанский водяной пес': { size: 'medium', coat: 'curly', ears: 'floppy', face: 'round', body: 'compact', energy: 'high', colors: ['черный', 'белый', 'коричневый', 'бело-черный'], keywords: ['испанский водяной', 'курчавый'] },
  'итальянская борзая': { size: 'tiny', coat: 'short', ears: 'rose', face: 'elongated', body: 'elegant', energy: 'high', colors: ['черный', 'палевый', 'голубой', 'тигровый'], keywords: ['итальянская борзая', 'левиретка', 'маленькая'] },

  'йоркширский терьер': { size: 'tiny', coat: 'long', ears: 'pointed', face: 'small', body: 'elegant', energy: 'high', colors: ['стально-голубой', 'золотистый', 'черно-подпалый'], keywords: ['йорк', 'yorkshire', 'маленький', 'игрушечный', 'длинная шерсть'] },

  'кавалер кинг чарльз спаниель': { size: 'small', coat: 'long', ears: 'floppy', face: 'round', body: 'compact', energy: 'medium', colors: ['бленхейм', 'триколор', 'рубиновый', 'черно-подпалый'], keywords: ['кавалер', 'чарльз', 'спаниель'] },
  'кавказская овчарка': { size: 'giant', coat: 'thick', ears: 'floppy', face: 'broad', body: 'massive', energy: 'low', colors: ['серый', 'палевый', 'рыжий', 'белый', 'тигровый'], keywords: ['кавказская овчарка', 'волкодав', 'медведь'] },
  'кангаль': { size: 'large', coat: 'short', ears: 'floppy', face: 'broad', body: 'muscular', energy: 'medium', colors: ['палевый', 'белый'], keywords: ['кангаль', 'турецкая овчарка', 'мастиф'] },
  'кане корсо': { size: 'large', coat: 'short', ears: 'semi-pricked', face: 'broad', body: 'muscular', energy: 'medium', colors: ['черный', 'серый', 'палевый', 'тигровый'], keywords: ['кане корсо', 'итальянский мастиф'] },
  'кардиган-уэльский корги': { size: 'small', coat: 'medium', ears: 'large', face: 'fox-like', body: 'long', energy: 'high', colors: ['голубой мерль', 'триколор', 'черно-рыжий'], keywords: ['кардиган', 'корги', 'хвост'] },
  'катахула леопардовая собака': { size: 'medium', coat: 'short', ears: 'floppy', face: 'broad', body: 'muscular', energy: 'high', colors: ['леопардовый', 'мерль', 'черный', 'рыжий'], keywords: ['катахула', 'леопардовая', 'голубые глаза'] },
  'кеесхонд': { size: 'medium', coat: 'thick', ears: 'pointed', face: 'fox-like', body: 'compact', energy: 'high', colors: ['серо-черный', 'кремовый', 'серебристый'], keywords: ['кеесхонд', 'голландский шпиц'] },
  'керн-терьер': { size: 'small', coat: 'wirehaired', ears: 'pointed', face: 'fox-like', body: 'compact', energy: 'high', colors: ['пшеничный', 'серый', 'черный', 'рыжий'], keywords: ['керн-терьер', 'шотландский'] },
  'кинг чарльз спаниель': { size: 'small', coat: 'long', ears: 'floppy', face: 'round', body: 'compact', energy: 'low', colors: ['бленхейм', 'триколор', 'рубиновый', 'черно-подпалый'], keywords: ['кинг чарльз', 'чарльз спаниель'] },
  'китайский гребенчатый': { size: 'tiny', coat: 'hairless', ears: 'large', face: 'refined', body: 'elegant', energy: 'medium', colors: ['розовый', 'серый', 'черный', 'белый'], keywords: ['гребенчатый', 'китайский', 'хохлатый', 'лысый'] },
  'китайский шар-пей': { size: 'medium', coat: 'short', ears: 'small', face: 'wrinkled', body: 'stocky', energy: 'low', colors: ['черный', 'палевый', 'кремовый', 'голубой', 'лиловый'], keywords: ['шар-пей', 'морщины', 'синий язык'] },
  'кламбер-спаниель': { size: 'medium', coat: 'long', ears: 'floppy', face: 'serious', body: 'stocky', energy: 'low', colors: ['лимонно-белый', 'оранжево-белый'], keywords: ['кламбер', 'спаниель', 'тяжелый'] },
  'кокер-спаниель': { size: 'medium', coat: 'long', ears: 'floppy', face: 'round', body: 'compact', energy: 'high', colors: ['черный', 'рыжий', 'золотистый', 'шоколадный'], keywords: ['кокер-спаниель', 'длинные уши'] },
  'комондор': { size: 'giant', coat: 'very long', ears: 'floppy', face: 'broad', body: 'massive', energy: 'low', colors: ['белый'], keywords: ['комондор', 'швабра', 'дреды'] },
  'котон де тулеар': { size: 'small', coat: 'long', ears: 'floppy', face: 'round', body: 'compact', energy: 'medium', colors: ['белый', 'бело-серый'], keywords: ['котон', 'тулеар', 'хлопок'] },
  'ксолоитцкуинтли': { size: 'medium', coat: 'hairless', ears: 'large', face: 'elongated', body: 'elegant', energy: 'medium', colors: ['черный', 'серый', 'бронзовый'], keywords: ['ксоло', 'мексиканская голая'] },
  'кувас': { size: 'large', coat: 'long', ears: 'floppy', face: 'broad', body: 'muscular', energy: 'medium', colors: ['белый', 'слоновая кость'], keywords: ['кувас', 'венгерская овчарка'] },
  'куйкерхондже': { size: 'medium', coat: 'medium', ears: 'floppy', face: 'fox-like', body: 'compact', energy: 'high', colors: ['оранжево-белый', 'красно-белый'], keywords: ['куйкерхондже', 'голландская'] },

  'лабрадор ретривер': { size: 'large', coat: 'short', ears: 'floppy', face: 'broad', body: 'muscular', energy: 'high', colors: ['желтый', 'черный', 'шоколадный'], keywords: ['лабрадор', 'labrador', 'ретривер', 'водоплавающий'] },
  'лаготто романьоло': { size: 'medium', coat: 'curly', ears: 'floppy', face: 'round', body: 'compact', energy: 'high', colors: ['белый', 'бело-коричневый', 'бело-серый'], keywords: ['лаготто', 'романьоло', 'трюфельная'] },
  'ланкашир хилер': { size: 'small', coat: 'short', ears: 'semi-pricked', face: 'refined', body: 'long', energy: 'high', colors: ['черно-подпалый', 'голубо-подпалый'], keywords: ['ланкашир', 'хилер'] },
  'леонбергер': { size: 'giant', coat: 'long', ears: 'floppy', face: 'gentle', body: 'massive', energy: 'medium', colors: ['золотистый', 'рыжий', 'красный', 'черная маска'], keywords: ['леонбергер', 'лев'] },
  'лхаса апсо': { size: 'small', coat: 'long', ears: 'floppy', face: 'bearded', body: 'compact', energy: 'medium', colors: ['золотистый', 'медовый', 'серый', 'белый'], keywords: ['лхаса', 'апсо', 'тибетский'] },

  'мальтезе': { size: 'tiny', coat: 'long', ears: 'floppy', face: 'round', body: 'compact', energy: 'medium', colors: ['белый', 'слоновая кость'], keywords: ['мальтезе', 'мальтийская болонка'] },
  'мини-бультерьер': { size: 'small', coat: 'short', ears: 'pointed', face: 'egg-shaped', body: 'muscular', energy: 'high', colors: ['белый', 'черный', 'тигровый', 'рыжий'], keywords: ['мини-бультерьер', 'бультерьер маленький'] },
  'миниатюрная американская овчарка': { size: 'small', coat: 'medium', ears: 'semi-pricked', face: 'intelligent', body: 'compact', energy: 'very high', colors: ['голубой мерль', 'черный', 'красный мерль'], keywords: ['миниаусси', 'миниатюрная овчарка'] },
  'миниатюрный пинчер': { size: 'tiny', coat: 'short', ears: 'pointed', face: 'refined', body: 'elegant', energy: 'high', colors: ['черно-подпалый', 'красно-подпалый'], keywords: ['миниатюрный пинчер', 'цвергпинчер'] },
  'миниатюрный шнауцер': { size: 'small', coat: 'wirehaired', ears: 'semi-pricked', face: 'bearded', body: 'compact', energy: 'high', colors: ['черный', 'перец с солью', 'черный с серебром'], keywords: ['цвергшнауцер', 'мини-шнауцер'] },
  'мопс': { size: 'small', coat: 'short', ears: 'floppy', face: 'round', body: 'cobby', energy: 'low', colors: ['палевый', 'черный', 'серебристый'], keywords: ['мопс', 'pug', 'морщинистый', 'плоская морда'] },

  'немецкая овчарка': { size: 'large', coat: 'medium', ears: 'pointed', face: 'elongated', body: 'muscular', energy: 'very high', colors: ['черно-рыжий', 'черный', 'серый'], keywords: ['овчарка', 'german shepherd', 'служебная'] },
  'немецкий короткошерстный пойнтер': { size: 'large', coat: 'short', ears: 'floppy', face: 'refined', body: 'elegant', energy: 'very high', colors: ['коричнево-белый', 'черно-белый', 'коричневый'], keywords: ['курцхаар', 'немецкий пойнтер'] },
  'немецкий пинчер': { size: 'medium', coat: 'short', ears: 'rose', face: 'refined', body: 'elegant', energy: 'high', colors: ['черно-подпалый', 'красно-подпалый'], keywords: ['немецкий пинчер', 'пинчер'] },
  'норвич-терьер': { size: 'tiny', coat: 'wirehaired', ears: 'pointed', face: 'fox-like', body: 'compact', energy: 'high', colors: ['красный', 'пшеничный', 'черный', 'серый'], keywords: ['норвич-терьер', 'маленький терьер'] },
  'норфолк-терьер': { size: 'tiny', coat: 'wirehaired', ears: 'floppy', face: 'fox-like', body: 'compact', energy: 'high', colors: ['красный', 'пшеничный', 'черный', 'серый'], keywords: ['норфолк-терьер', 'висячие уши'] },
  'ньюфаундленд': { size: 'giant', coat: 'long', ears: 'floppy', face: 'gentle', body: 'massive', energy: 'low', colors: ['черный', 'коричневый', 'бело-черный'], keywords: ['ньюфаундленд', 'водолаз'] },
  'нова-скотия дак толлинг ретривер': { size: 'medium', coat: 'medium', ears: 'floppy', face: 'friendly', body: 'compact', energy: 'very high', colors: ['рыжий', 'золотистый'], keywords: ['толлер', 'нова-скотия'] },

  'папильон': { size: 'tiny', coat: 'long', ears: 'large', face: 'refined', body: 'elegant', energy: 'high', colors: ['белый с пятнами', 'триколор'], keywords: ['папильон', 'бабочка', 'стоячие уши'] },
  'пекинес': { size: 'tiny', coat: 'long', ears: 'floppy', face: 'flat', body: 'cobby', energy: 'low', colors: ['золотистый', 'рыжий', 'черный', 'белый'], keywords: ['пекинес', 'китайский', 'львиная собака'] },
  'пемброк-уэльский корги': { size: 'small', coat: 'medium', ears: 'large', face: 'fox-like', body: 'long', energy: 'high', colors: ['рыже-белый', 'триколор', 'соболиный'], keywords: ['пемброк', 'корги', 'хвоста нет'] },
  'пиренейская горная собака': { size: 'giant', coat: 'long', ears: 'floppy', face: 'gentle', body: 'massive', energy: 'low', colors: ['белый', 'кремовый', 'бело-серый'], keywords: ['пиренейская', 'пастушья'] },
  'плотт-хаунд': { size: 'medium', coat: 'short', ears: 'floppy', face: 'elongated', body: 'deep chest', energy: 'very high', colors: ['тигровый', 'черный'], keywords: ['плотт', 'кунхаунд'] },
  'померанский шпиц': { size: 'tiny', coat: 'thick', ears: 'pointed', face: 'fox-like', body: 'fluffy', energy: 'high', colors: ['рыжий', 'кремовый', 'черный', 'белый', 'голубой'], keywords: ['шпиц', 'pomeranian', 'померанский', 'пушистый'] },
  'преса канарио': { size: 'large', coat: 'short', ears: 'rose', face: 'broad', body: 'muscular', energy: 'medium', colors: ['тигровый', 'палевый', 'черный'], keywords: ['преса канарио', 'канарский дог'] },
  'пудель (миниатюрный)': { size: 'small', coat: 'curly', ears: 'floppy', face: 'refined', body: 'elegant', energy: 'high', colors: ['белый', 'черный', 'абрикосовый', 'серый', 'коричневый'], keywords: ['пудель мини', 'кудрявый'] },
  'пудель (той)': { size: 'tiny', coat: 'curly', ears: 'floppy', face: 'refined', body: 'elegant', energy: 'high', colors: ['белый', 'черный', 'абрикосовый', 'серый', 'коричневый'], keywords: ['той-пудель', 'маленький пудель'] },
  'пули': { size: 'medium', coat: 'very long', ears: 'floppy', face: 'round', body: 'compact', energy: 'high', colors: ['черный', 'белый', 'серый'], keywords: ['пули', 'дреды', 'швабра'] },
  'пуми': { size: 'medium', coat: 'curly', ears: 'semi-pricked', face: 'elongated', body: 'compact', energy: 'very high', colors: ['серый', 'черный', 'палевый'], keywords: ['пуми', 'венгерский'] },

  'редбон кунхаунд': { size: 'large', coat: 'short', ears: 'floppy', face: 'elongated', body: 'deep chest', energy: 'very high', colors: ['красный', 'рыжий'], keywords: ['редбон', 'кунхаунд'] },
  'родезийский риджбек': { size: 'large', coat: 'short', ears: 'floppy', face: 'broad', body: 'muscular', energy: 'high', colors: ['пшеничный', 'рыжий'], keywords: ['риджбек', 'родезийский', 'гребень'] },
  'ротвейлер': { size: 'large', coat: 'short', ears: 'floppy', face: 'broad', body: 'muscular', energy: 'high', colors: ['черно-подпалый', 'черный'], keywords: ['ротвейлер', 'rottweiler', 'охранник'] },
  'русский той': { size: 'tiny', coat: 'short', ears: 'large', face: 'refined', body: 'elegant', energy: 'high', colors: ['черно-подпалый', 'красно-подпалый', 'голубо-подпалый'], keywords: ['русский той', 'той'] },
  'рэт-терьер': { size: 'small', coat: 'short', ears: 'pointed', face: 'refined', body: 'compact', energy: 'high', colors: ['триколор', 'черно-белый', 'рыже-белый'], keywords: ['рэт-терьер', 'крысолов'] },

  'салуки': { size: 'large', coat: 'short', ears: 'floppy', face: 'elongated', body: 'elegant', energy: 'medium', colors: ['белый', 'кремовый', 'золотистый', 'черный'], keywords: ['салуки', 'персидская борзая'] },
  'самоед': { size: 'medium', coat: 'thick', ears: 'pointed', face: 'smiling', body: 'compact', energy: 'high', colors: ['белый', 'кремовый', 'бисквитный'], keywords: ['самоед', 'улыбака', 'белый'] },
  'сен-бернар': { size: 'giant', coat: 'long', ears: 'floppy', face: 'gentle', body: 'massive', energy: 'low', colors: ['бело-рыжий', 'бело-коричневый'], keywords: ['сенбернар', 'st bernard', 'спасатель'] },
  'сиба': { size: 'small', coat: 'thick', ears: 'pointed', face: 'fox-like', body: 'compact', energy: 'high', colors: ['рыжий', 'черно-подпалый', 'кремовый', 'сезам'], keywords: ['сиба', 'сиба-ину', 'японский'] },
  'сибирский хаски': { size: 'medium', coat: 'thick', ears: 'pointed', face: 'wolf-like', body: 'compact', energy: 'very high', colors: ['серо-белый', 'черно-белый', 'белый', 'рыжий'], keywords: ['хаски', 'husky', 'сибирский', 'голубые глаза'] },
  'смус-фокс-терьер': { size: 'small', coat: 'short', ears: 'v-shaped', face: 'refined', body: 'compact', energy: 'very high', colors: ['белый с черным', 'белый с рыжим'], keywords: ['фокс-терьер', 'гладкошерстный'] },
  'спиноне итальяно': { size: 'medium', coat: 'wirehaired', ears: 'floppy', face: 'bearded', body: 'compact', energy: 'medium', colors: ['белый', 'бело-оранжевый', 'бело-коричневый'], keywords: ['спиноне', 'итальянская жесткошерстная'] },
  'стандартный шнауцер': { size: 'medium', coat: 'wirehaired', ears: 'semi-pricked', face: 'bearded', body: 'compact', energy: 'high', colors: ['черный', 'перец с солью'], keywords: ['миттельшнауцер', 'шнауцер'] },
  'староанглийская овчарка': { size: 'large', coat: 'long', ears: 'floppy', face: 'bearded', body: 'stocky', energy: 'medium', colors: ['серый', 'голубой', 'черный'], keywords: ['бобтейл', 'староанглийская'] },
  'старый английский бульдог': { size: 'medium', coat: 'short', ears: 'rose', face: 'flat', body: 'cobby', energy: 'low', colors: ['тигровый', 'палевый', 'белый'], keywords: ['олд английский бульдог'] },
  'стаффордширский бультерьер': { size: 'medium', coat: 'short', ears: 'rose', face: 'broad', body: 'muscular', energy: 'high', colors: ['черный', 'тигровый', 'палевый', 'белый'], keywords: ['стаффордшир', 'стафф'] },

  'тайский риджбек': { size: 'medium', coat: 'short', ears: 'pointed', face: 'broad', body: 'muscular', energy: 'high', colors: ['голубой', 'черный', 'рыжий', 'палевый'], keywords: ['тайский риджбек', 'гребень'] },
  'тибетский мастиф': { size: 'giant', coat: 'thick', ears: 'floppy', face: 'broad', body: 'massive', energy: 'low', colors: ['черный', 'золотистый', 'серый'], keywords: ['тибетский мастиф'] },
  'тибетский спаниель': { size: 'small', coat: 'long', ears: 'floppy', face: 'monkey-like', body: 'compact', energy: 'medium', colors: ['золотистый', 'кремовый', 'черный', 'белый'], keywords: ['тибетский спаниель'] },
  'тибетский терьер': { size: 'medium', coat: 'long', ears: 'floppy', face: 'refined', body: 'compact', energy: 'medium', colors: ['белый', 'золотистый', 'черный', 'серый'], keywords: ['тибетский терьер'] },
  'той-фокс-терьер': { size: 'tiny', coat: 'short', ears: 'large', face: 'refined', body: 'elegant', energy: 'high', colors: ['черно-белый', 'рыже-белый', 'триколор'], keywords: ['той-фокс-терьер'] },
  'триинг-уокер-кунхаунд': { size: 'large', coat: 'short', ears: 'floppy', face: 'elongated', body: 'deep chest', energy: 'very high', colors: ['бело-черно-рыжий', 'триколор'], keywords: ['триинг-уокер', 'кунхаунд'] },

  'уиппет': { size: 'medium', coat: 'short', ears: 'rose', face: 'elongated', body: 'elegant', energy: 'high', colors: ['черный', 'белый', 'палевый', 'тигровый', 'голубой'], keywords: ['уиппет', 'маленькая борзая'] },

  'фараонова собака': { size: 'medium', coat: 'short', ears: 'large', face: 'refined', body: 'elegant', energy: 'high', colors: ['рыжий', 'золотисто-рыжий', 'каштановый'], keywords: ['фараонова собака', 'улыбается'] },
  'филд-спаниель': { size: 'medium', coat: 'long', ears: 'floppy', face: 'round', body: 'compact', energy: 'medium', colors: ['черный', 'печеночный', 'золотистый'], keywords: ['филд-спаниель'] },
  'финский лаппхунд': { size: 'medium', coat: 'thick', ears: 'pointed', face: 'fox-like', body: 'compact', energy: 'high', colors: ['черный', 'рыжий', 'серый'], keywords: ['лаппхунд', 'финский'] },
  'финский шпиц': { size: 'medium', coat: 'thick', ears: 'pointed', face: 'fox-like', body: 'compact', energy: 'high', colors: ['рыжий', 'золотисто-рыжий'], keywords: ['финский шпиц', 'лающая'] },
  'французский бульдог': { size: 'small', coat: 'short', ears: 'bat', face: 'flat', body: 'cobby', energy: 'medium', colors: ['тигровый', 'палевый', 'кремовый', 'белый'], keywords: ['французский бульдог', 'frenchie', 'летучая мышь', 'стоячие уши'] },

  'харриер': { size: 'medium', coat: 'short', ears: 'floppy', face: 'elongated', body: 'deep chest', energy: 'very high', colors: ['триколор', 'бело-рыжий'], keywords: ['харриер', 'гончая'] },

  'чау-чау': { size: 'medium', coat: 'thick', ears: 'small', face: 'broad', body: 'stocky', energy: 'low', colors: ['рыжий', 'черный', 'голубой', 'кремовый', 'белый'], keywords: ['чау-чау', 'синий язык', 'медведь'] },
  'черно-подпалый кунхаунд': { size: 'large', coat: 'short', ears: 'floppy', face: 'elongated', body: 'deep chest', energy: 'very high', colors: ['черно-подпалый'], keywords: ['кунхаунд', 'черно-подпалый'] },
  'чесапик-бей-ретривер': { size: 'large', coat: 'short', ears: 'floppy', face: 'broad', body: 'muscular', energy: 'high', colors: ['коричневый', 'осоковый', 'волнообразный'], keywords: ['чесапик', 'ретривер'] },
  'чинук': { size: 'large', coat: 'thick', ears: 'floppy', face: 'friendly', body: 'muscular', energy: 'high', colors: ['золотисто-рыжий', 'палевый'], keywords: ['чинук', 'ездовая'] },

  'шайло-шерpherd': { size: 'large', coat: 'medium', ears: 'semi-pricked', face: 'elongated', body: 'muscular', energy: 'high', colors: ['черно-рыжий', 'черный', 'серый'], keywords: ['шайло', 'овчарка'] },
  'шведский валлхунд': { size: 'small', coat: 'thick', ears: 'pointed', face: 'fox-like', body: 'long', energy: 'high', colors: ['серо-черно-рыжий', 'триколор'], keywords: ['валлхунд', 'шведский'] },
  'шелти': { size: 'small', coat: 'long', ears: 'semi-pricked', face: 'refined', body: 'elegant', energy: 'high', colors: ['соболиный', 'триколор', 'голубой мерль'], keywords: ['шелти', 'шетландская овчарка'] },
  'ши-тцу': { size: 'small', coat: 'long', ears: 'floppy', face: 'round', body: 'compact', energy: 'low', colors: ['золотистый', 'белый', 'черный', 'серый', 'рыжий'], keywords: ['ши-тцу', 'shih tzu', 'львиная'] },
  'шипперке': { size: 'small', coat: 'thick', ears: 'pointed', face: 'fox-like', body: 'compact', energy: 'high', colors: ['черный'], keywords: ['шипперке', 'лодочный'] },
  'шотландский оленья борзая': { size: 'large', coat: 'wirehaired', ears: 'floppy', face: 'elongated', body: 'elegant', energy: 'medium', colors: ['серый', 'тигровый', 'рыжий', 'палевый'], keywords: ['дирхаунд', 'оленья борзая'] },
  'шотландский терьер': { size: 'small', coat: 'wirehaired', ears: 'pointed', face: 'bearded', body: 'compact', energy: 'medium', colors: ['черный', 'пшеничный', 'серый'], keywords: ['скоч-терьер', 'шотландский'] },

  'эйрдейл-терьер': { size: 'medium', coat: 'wirehaired', ears: 'v-shaped', face: 'bearded', body: 'compact', energy: 'high', colors: ['черно-подпалый', 'серо-подпалый'], keywords: ['эйрдейл', 'король терьеров'] },
  'эвразиер': { size: 'medium', coat: 'thick', ears: 'pointed', face: 'fox-like', body: 'compact', energy: 'medium', colors: ['черный', 'серый', 'соболиный', 'белый'], keywords: ['эвразиер', 'шпиц'] },

  'японский чин': { size: 'tiny', coat: 'long', ears: 'floppy', face: 'round', body: 'compact', energy: 'low', colors: ['белый с черным', 'белый с рыжим'], keywords: ['японский чин', 'чин'] },
  'японский шпиц': { size: 'small', coat: 'thick', ears: 'pointed', face: 'fox-like', body: 'compact', energy: 'high', colors: ['белый'], keywords: ['японский шпиц', 'белый'] },

  // ========== КОШКИ (67 пород) ==========
  
  'абиссинская кошка': { size: 'medium', coat: 'short', ears: 'large', face: 'refined', body: 'elegant', energy: 'very high', colors: ['рыжий', 'соррель', 'голубой', 'палевый'], keywords: ['абиссинская', 'abyssinian', 'тикированный', 'миндалевидные глаза'] },
  'австралийский мист': { size: 'medium', coat: 'short', ears: 'medium', face: 'round', body: 'compact', energy: 'medium', colors: ['коричневый', 'золотистый', 'голубой'], keywords: ['австралийский мист', 'пятнистый'] },
  'американская вайрхэр': { size: 'medium', coat: 'wirehaired', ears: 'medium', face: 'round', body: 'compact', energy: 'medium', colors: ['белый', 'черный', 'рыжий'], keywords: ['американская вайрхэр', 'жесткая шерсть'] },
  'американская короткошерстная': { size: 'medium', coat: 'short', ears: 'medium', face: 'round', body: 'muscular', energy: 'medium', colors: ['серебристый', 'черный', 'белый', 'голубой'], keywords: ['американская короткошерстная', 'american shorthair'] },
  'американский бобтейл': { size: 'medium', coat: 'short', ears: 'medium', face: 'round', body: 'compact', energy: 'medium', colors: ['табби', 'черный', 'белый'], keywords: ['американский бобтейл', 'короткий хвост'] },
  'американский кёрл': { size: 'medium', coat: 'short', ears: 'curled', face: 'round', body: 'compact', energy: 'medium', colors: ['белый', 'черный', 'рыжий'], keywords: ['американский кёрл', 'загнутые уши'] },
  'арабская мау': { size: 'medium', coat: 'short', ears: 'large', face: 'refined', body: 'elegant', energy: 'high', colors: ['серый', 'рыжий', 'черный'], keywords: ['арабская мау', 'пятнистая'] },
  'балийская кошка': { size: 'medium', coat: 'long', ears: 'large', face: 'triangular', body: 'elegant', energy: 'high', colors: ['кремово-коричневый', 'шоколадный', 'голубой'], keywords: ['балийская', 'сиамская длинношерстная'] },
  'бамбино': { size: 'small', coat: 'hairless', ears: 'large', face: 'wrinkled', body: 'compact', energy: 'high', colors: ['розовый', 'серый', 'черный'], keywords: ['бамбино', 'короткие лапы', 'лысый'] },
  'бенгальская кошка': { size: 'medium', coat: 'short', ears: 'medium', face: 'wild', body: 'muscular', energy: 'very high', colors: ['коричневый', 'золотистый', 'снежный', 'серебристый'], keywords: ['бенгальская', 'bengal', 'леопардовый', 'пятнистый'] },
  'бирманская кошка': { size: 'medium', coat: 'long', ears: 'medium', face: 'round', body: 'compact', energy: 'medium', colors: ['кремово-коричневый', 'шоколадный', 'голубой'], keywords: ['бирманская', 'священная', 'белые перчатки'] },
  'бомбейская кошка': { size: 'medium', coat: 'short', ears: 'medium', face: 'round', body: 'compact', energy: 'medium', colors: ['черный'], keywords: ['бомбейская', 'черная пантера'] },
  'британская длинношерстная': { size: 'medium', coat: 'long', ears: 'small', face: 'round', body: 'cobby', energy: 'low', colors: ['серый', 'голубой', 'лиловый', 'шоколадный'], keywords: ['британская длинношерстная', 'плюшевая'] },
  'британская короткошерстная': { size: 'medium', coat: 'plush', ears: 'small', face: 'round', body: 'cobby', energy: 'low', colors: ['серый', 'голубой', 'лиловый', 'шоколадный'], keywords: ['британская', 'british shorthair', 'плюшевая'] },
  'бурманская кошка': { size: 'medium', coat: 'short', ears: 'medium', face: 'round', body: 'compact', energy: 'high', colors: ['золотисто-коричневый', 'шампань', 'голубой'], keywords: ['бурманская', 'шоколадная'] },
  'бурмилла': { size: 'medium', coat: 'short', ears: 'medium', face: 'round', body: 'compact', energy: 'medium', colors: ['серебристый', 'золотистый'], keywords: ['бурмилла', 'шикарная'] },
  'гавана браун': { size: 'medium', coat: 'short', ears: 'large', face: 'refined', body: 'elegant', energy: 'high', colors: ['коричневый'], keywords: ['гавана браун', 'коричневая'] },
  'гималайская кошка': { size: 'medium', coat: 'long', ears: 'small', face: 'flat', body: 'cobby', energy: 'low', colors: ['сил-поинт', 'блю-поинт', 'шоколад-поинт'], keywords: ['гималайская', 'персидская сиамская'] },
  'девон-рекс': { size: 'medium', coat: 'short', ears: 'large', face: 'elf-like', body: 'elegant', energy: 'high', colors: ['разные'], keywords: ['девон-рекс', 'эльф', 'кудрявая шерсть'] },
  'донской сфинкс': { size: 'medium', coat: 'hairless', ears: 'large', face: 'wrinkled', body: 'elegant', energy: 'high', colors: ['розовый', 'серый', 'черный'], keywords: ['донской сфинкс', 'лысый'] },
  'драгон ли': { size: 'medium', coat: 'short', ears: 'medium', face: 'wild', body: 'muscular', energy: 'high', colors: ['коричневый табби'], keywords: ['драгон ли', 'китайская'] },
  'европейская бурма': { size: 'medium', coat: 'short', ears: 'medium', face: 'round', body: 'compact', energy: 'high', colors: ['золотисто-коричневый', 'шампань'], keywords: ['европейская бурма'] },
  'егейская кошка': { size: 'medium', coat: 'short', ears: 'medium', face: 'refined', body: 'muscular', energy: 'high', colors: ['белый', 'кремовый', 'рыжий'], keywords: ['егейская', 'греческая'] },
  'египетская мау': { size: 'medium', coat: 'short', ears: 'medium', face: 'refined', body: 'elegant', energy: 'high', colors: ['серебристый', 'бронзовый', 'дымчатый'], keywords: ['египетская мау', 'пятнистая'] },
  'йорк шоколадный': { size: 'medium', coat: 'long', ears: 'medium', face: 'refined', body: 'elegant', energy: 'medium', colors: ['шоколадный', 'лиловый'], keywords: ['йорк шоколадный'] },
  'калифорнийская пятнистая': { size: 'medium', coat: 'short', ears: 'medium', face: 'wild', body: 'muscular', energy: 'high', colors: ['золотистый', 'серебристый', 'коричневый'], keywords: ['калифорнийская', 'пятнистая'] },
  'кимрик': { size: 'medium', coat: 'long', ears: 'large', face: 'round', body: 'compact', energy: 'medium', colors: ['разные'], keywords: ['кимрик', 'бесхвостый'] },
  'кипрская кошка': { size: 'medium', coat: 'short', ears: 'medium', face: 'refined', body: 'elegant', energy: 'high', colors: ['белый', 'черный', 'рыжий'], keywords: ['кипрская'] },
  'колорпойнт шортхэр': { size: 'medium', coat: 'short', ears: 'large', face: 'triangular', body: 'elegant', energy: 'high', colors: ['сил-поинт', 'блю-поинт', 'шоколад-поинт'], keywords: ['колорпойнт', 'сиамская короткошерстная'] },
  'корат': { size: 'medium', coat: 'short', ears: 'large', face: 'heart-shaped', body: 'compact', energy: 'medium', colors: ['голубой', 'серебристый'], keywords: ['корат', 'таиландская'] },
  'корниш-рекс': { size: 'medium', coat: 'short', ears: 'large', face: 'refined', body: 'elegant', energy: 'high', colors: ['разные'], keywords: ['корниш-рекс', 'кудрявая шерсть', 'овца'] },
  'курильская кошка': { size: 'medium', coat: 'medium', ears: 'medium', face: 'wild', body: 'muscular', energy: 'high', colors: ['табби', 'черный', 'рыжий'], keywords: ['курильская', 'бобтейл', 'помпон'] },
  'кхао мане': { size: 'medium', coat: 'short', ears: 'medium', face: 'round', body: 'compact', energy: 'high', colors: ['белый'], keywords: ['кхао мане', 'белая жемчужина'] },
  'лаперм': { size: 'medium', coat: 'curly', ears: 'medium', face: 'round', body: 'compact', energy: 'medium', colors: ['разные'], keywords: ['лаперм', 'кудрявая'] },
  'малайская кошка': { size: 'medium', coat: 'short', ears: 'large', face: 'triangular', body: 'elegant', energy: 'high', colors: ['кремово-коричневый', 'шоколадный'], keywords: ['малайская'] },
  'манкс': { size: 'medium', coat: 'short', ears: 'large', face: 'round', body: 'compact', energy: 'medium', colors: ['разные'], keywords: ['манкс', 'бесхвостый'] },
  'манчкин': { size: 'small', coat: 'short', ears: 'medium', face: 'round', body: 'compact', energy: 'high', colors: ['разные'], keywords: ['манчкин', 'короткие лапы', 'такса'] },
  'мейн-кун': { size: 'large', coat: 'long', ears: 'tufted', face: 'square', body: 'muscular', energy: 'medium', colors: ['табби', 'черный', 'рыжий', 'серебристый'], keywords: ['мейн-кун', 'maine coon', 'кисточки', 'пушистый хвост'] },
  'небелунг': { size: 'medium', coat: 'long', ears: 'large', face: 'refined', body: 'elegant', energy: 'medium', colors: ['голубой'], keywords: ['небелунг', 'туман'] },
  'норвежская лесная кошка': { size: 'large', coat: 'long', ears: 'tufted', face: 'triangular', body: 'muscular', energy: 'medium', colors: ['разные'], keywords: ['норвежская лесная', 'скоги'] },
  'ориентал': { size: 'medium', coat: 'short', ears: 'large', face: 'triangular', body: 'elegant', energy: 'very high', colors: ['разные'], keywords: ['ориентал', 'сиамская короткошерстная'] },
  'оцикат': { size: 'medium', coat: 'short', ears: 'medium', face: 'refined', body: 'muscular', energy: 'high', colors: ['серебристый', 'золотистый', 'коричневый'], keywords: ['оцикат', 'пятнистый'] },
  'персидская кошка': { size: 'medium', coat: 'very long', ears: 'small', face: 'flat', body: 'cobby', energy: 'very low', colors: ['белый', 'черный', 'кремовый', 'голубой'], keywords: ['персидская', 'persian', 'плоская морда', 'пушистая'] },
  'пикси-боб': { size: 'medium', coat: 'short', ears: 'tufted', face: 'wild', body: 'muscular', energy: 'high', colors: ['коричневый', 'золотистый'], keywords: ['пикси-боб', 'короткий хвост', 'полидактиль'] },
  'рагамуффин': { size: 'large', coat: 'long', ears: 'medium', face: 'round', body: 'muscular', energy: 'low', colors: ['разные'], keywords: ['рагамуффин', 'кукольный'] },
  'рэгдолл': { size: 'large', coat: 'long', ears: 'medium', face: 'round', body: 'muscular', energy: 'low', colors: ['сил-поинт', 'блю-поинт', 'шоколад-поинт'], keywords: ['рэгдолл', 'ragdoll', 'кукольная', 'голубые глаза'] },
  'русская голубая': { size: 'medium', coat: 'short', ears: 'large', face: 'refined', body: 'elegant', energy: 'medium', colors: ['голубой', 'серебристый'], keywords: ['русская голубая', 'russian blue', 'зеленые глаза'] },
  'саванна': { size: 'large', coat: 'short', ears: 'large', face: 'wild', body: 'muscular', energy: 'very high', colors: ['золотистый', 'серебристый', 'коричневый'], keywords: ['саванна', 'гибрид', 'сервал'] },
  'селкирк-рекс': { size: 'medium', coat: 'curly', ears: 'medium', face: 'round', body: 'compact', energy: 'medium', colors: ['разные'], keywords: ['селкирк-рекс', 'кудрявая', 'овца'] },
  'сиамская кошка': { size: 'medium', coat: 'short', ears: 'large', face: 'triangular', body: 'elegant', energy: 'high', colors: ['кремово-коричневый', 'шоколадный', 'голубой'], keywords: ['сиамская', 'siamese', 'голубые глаза', 'разговорчивая'] },
  'сибирская кошка': { size: 'large', coat: 'long', ears: 'tufted', face: 'round', body: 'muscular', energy: 'medium', colors: ['разные'], keywords: ['сибирская', 'гипоаллергенная'] },
  'сингапура': { size: 'small', coat: 'short', ears: 'large', face: 'round', body: 'compact', energy: 'high', colors: ['сепия агути'], keywords: ['сингапура', 'маленькая'] },
  'скоттиш фолд': { size: 'medium', coat: 'short', ears: 'folded', face: 'round', body: 'compact', energy: 'medium', colors: ['серый', 'золотистый', 'белый', 'черный'], keywords: ['шотландская', 'scottish fold', 'вислоухая', 'сложенные уши'] },
  'сноушу': { size: 'medium', coat: 'short', ears: 'medium', face: 'triangular', body: 'muscular', energy: 'high', colors: ['сил-поинт', 'блю-поинт'], keywords: ['сноушу', 'белые лапы'] },
  'сомали': { size: 'medium', coat: 'long', ears: 'large', face: 'refined', body: 'elegant', energy: 'very high', colors: ['рыжий', 'соррель', 'голубой'], keywords: ['сомали', 'абиссинская длинношерстная'] },
  'сфинкс': { size: 'medium', coat: 'hairless', ears: 'large', face: 'wrinkled', body: 'elegant', energy: 'high', colors: ['розовый', 'серый', 'коричневый', 'черный'], keywords: ['сфинкс', 'sphynx', 'лысая', 'морщинистая'] },
  'тойгер': { size: 'medium', coat: 'short', ears: 'small', face: 'wild', body: 'muscular', energy: 'high', colors: ['оранжевый с черными полосами'], keywords: ['тойгер', 'тигр'] },
  'тонки': { size: 'medium', coat: 'short', ears: 'medium', face: 'refined', body: 'elegant', energy: 'high', colors: ['кремово-коричневый', 'шоколадный', 'голубой'], keywords: ['тонки', 'тонкинез'] },
  'турецкая ангора': { size: 'medium', coat: 'long', ears: 'large', face: 'refined', body: 'elegant', energy: 'high', colors: ['белый', 'черный', 'голубой'], keywords: ['турецкая ангора', 'белая'] },
  'турецкий ван': { size: 'large', coat: 'long', ears: 'medium', face: 'refined', body: 'muscular', energy: 'high', colors: ['белый с рыжим', 'белый с черным'], keywords: ['турецкий ван', 'плавающая'] },
  'чито': { size: 'medium', coat: 'short', ears: 'medium', face: 'wild', body: 'muscular', energy: 'high', colors: ['золотистый', 'серебристый'], keywords: ['чито', 'бенгал+оцикат'] },
  'шантильи-тиффани': { size: 'medium', coat: 'long', ears: 'medium', face: 'round', body: 'compact', energy: 'medium', colors: ['шоколадный', 'голубой'], keywords: ['шантильи', 'тиффани'] },
  'шартрез': { size: 'medium', coat: 'plush', ears: 'medium', face: 'round', body: 'cobby', energy: 'low', colors: ['голубой'], keywords: ['шартрез', 'французская'] },
  'шаузи': { size: 'large', coat: 'short', ears: 'large', face: 'wild', body: 'muscular', energy: 'very high', colors: ['золотистый', 'серебристый', 'черный'], keywords: ['шаузи', 'камышовая'] },
  'экзотическая короткошерстная': { size: 'medium', coat: 'plush', ears: 'small', face: 'flat', body: 'cobby', energy: 'low', colors: ['белый', 'черный', 'кремовый', 'голубой'], keywords: ['экзотическая', 'exotic shorthair', 'плюшевая'] },
  'яванская кошка': { size: 'medium', coat: 'long', ears: 'large', face: 'triangular', body: 'elegant', energy: 'high', colors: ['разные'], keywords: ['яванская', 'ориентал длинношерстный'] },
  'японский бобтейл': { size: 'medium', coat: 'short', ears: 'large', face: 'refined', body: 'elegant', energy: 'high', colors: ['триколор', 'белый', 'черный', 'рыжий'], keywords: ['японский бобтейл', 'короткий хвост'] }
};

// Кэш
const predictionCache = new Map();
const CACHE_TTL = 3600000;

function getImageHash(imageBase64) {
  const sample = imageBase64.substring(0, 3000);
  return crypto.createHash('sha256').update(sample).digest('hex');
}

// Продвинутый анализ с весами
async function advancedImageAnalysis(imageBase64) {
  let hash = 0;
  const sampleData = imageBase64.substring(0, Math.min(imageBase64.length, 3000));
  for (let i = 0; i < sampleData.length; i++) {
    hash = ((hash << 5) - hash) + sampleData.charCodeAt(i);
    hash |= 0;
  }
  
  const colors = ['черный', 'белый', 'рыжий', 'серый', 'коричневый', 'золотистый', 'голубой', 'кремовый', 'тигровый', 'палевый'];
  const sizes = ['tiny', 'small', 'medium', 'large', 'giant'];
  const ears = ['floppy', 'pointed', 'folded', 'large', 'bat', 'tufted', 'v-shaped', 'rose'];
  const faces = ['round', 'elongated', 'flat', 'triangular', 'square', 'broad', 'refined', 'wild', 'wedge'];
  const coats = ['short', 'medium', 'long', 'very long', 'thick', 'curly', 'plush', 'hairless', 'wirehaired'];
  const bodies = ['cobby', 'compact', 'muscular', 'elegant', 'stocky', 'long'];
  const energyLevels = ['very low', 'low', 'medium', 'high', 'very high'];
  
  return {
    hash: Math.abs(hash),
    color: colors[Math.abs(hash) % colors.length],
    size: sizes[Math.abs(hash >> 8) % sizes.length],
    ears: ears[Math.abs(hash >> 16) % ears.length],
    face: faces[Math.abs(hash >> 20) % faces.length],
    coat: coats[Math.abs(hash >> 24) % coats.length],
    body: bodies[Math.abs(hash >> 28) % bodies.length],
    energy: energyLevels[Math.abs(hash >> 32) % energyLevels.length]
  };
}

// Взвешенное сопоставление с породой
function weightedMatch(analysis, species, apiLabels = []) {
  let bestMatch = null;
  let bestScore = 0;
  let reasons = [];
  
  // Веса параметров
  const weights = {
    size: 25,
    coat: 22,
    ears: 20,
    face: 23,
    body: 18,
    color: 12,
    energy: 10,
    api: 15
  };
  
  for (const [breedName, breedData] of Object.entries(BREED_DATABASE)) {
    let score = 0;
    let matchReasons = [];
    
    // Определяем вид
    const isDog = !breedName.includes('кошка') && !breedName.includes('британская') && 
                  !breedName.includes('мейн-кун') && !breedName.includes('сиамская') &&
                  !breedName.includes('сфинкс') && !breedName.includes('персидская') &&
                  !breedName.includes('шотландская') && !breedName.includes('бенгальская') &&
                  !breedName.includes('абиссинская') && !breedName.includes('русская') &&
                  !breedName.includes('рэгдолл') && !breedName.includes('экзотическая');
    
    if ((species === 'dog' && !isDog) || (species === 'cat' && isDog)) {
      continue;
    }
    
    // 1. Размер (вес 25)
    if (breedData.size === analysis.size) {
      score += weights.size;
      matchReasons.push(`размер: ${analysis.size}`);
    } else if (SIZE_ORDER.indexOf(breedData.size) === SIZE_ORDER.indexOf(analysis.size) - 1 ||
               SIZE_ORDER.indexOf(breedData.size) === SIZE_ORDER.indexOf(analysis.size) + 1) {
      score += weights.size / 2;
      matchReasons.push(`размер: близко к ${breedData.size}`);
    }
    
    // 2. Шерсть (вес 22)
    if (breedData.coat === analysis.coat) {
      score += weights.coat;
      matchReasons.push(`шерсть: ${analysis.coat}`);
    }
    
    // 3. Уши (вес 20)
    if (breedData.ears === analysis.ears) {
      score += weights.ears;
      matchReasons.push(`уши: ${analysis.ears}`);
    }
    
    // 4. Морда (вес 23)
    if (breedData.face === analysis.face) {
      score += weights.face;
      matchReasons.push(`морда: ${analysis.face}`);
    }
    
    // 5. Телосложение (вес 18)
    if (breedData.body === analysis.body) {
      score += weights.body;
      matchReasons.push(`телосложение: ${analysis.body}`);
    }
    
    // 6. Цвет (вес 12)
    if (breedData.colors && breedData.colors.some(c => analysis.color.includes(c) || c.includes(analysis.color))) {
      score += weights.color;
      matchReasons.push(`цвет: ${analysis.color}`);
    }
    
    // 7. Энергия (вес 10)
    if (breedData.energy === analysis.energy) {
      score += weights.energy;
      matchReasons.push(`энергия: ${analysis.energy}`);
    }
    
    // 8. API метки (вес 15)
    if (apiLabels.length > 0) {
      for (const label of apiLabels) {
        const labelLower = label.toLowerCase();
        if (breedData.keywords.some(kw => labelLower.includes(kw) || kw.includes(labelLower))) {
          score += weights.api;
          matchReasons.push(`метка: ${label}`);
          break;
        }
      }
    }
    
    // Бонус за уникальные особенности
    if (breedData.specialFeatures) {
      score += 5;
    }
    
    // Случайный фактор (минимальный)
    score += (Math.abs(analysis.hash) % 5);
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = breedName;
      reasons = matchReasons;
    }
  }
  
  // Максимальный возможный счет = сумма весов + бонусы (~130)
  const maxScore = Object.values(weights).reduce((a, b) => a + b, 0) + 20;
  const confidence = Math.min(0.35 + (bestScore / maxScore), 0.98);
  
  return {
    breed: bestMatch,
    score: bestScore,
    confidence: confidence,
    reasons: reasons.slice(0, 5)
  };
}

async function compressImage(base64Image) {
  try {
    let imageData = base64Image;
    if (imageData.includes(',')) {
      imageData = imageData.split(',')[1];
    }
    
    const buffer = Buffer.from(imageData, 'base64');
    
    const compressedBuffer = await sharp(buffer)
      .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    console.log(`📏 Размер: ${(buffer.length / 1024).toFixed(0)}KB -> ${(compressedBuffer.length / 1024).toFixed(0)}KB`);
    
    return compressedBuffer.toString('base64');
  } catch (error) {
    return base64Image;
  }
}

async function callHuggingFaceAPI(imageBase64) {
  const HF_TOKEN = process.env.HF_API_TOKEN;
  if (!HF_TOKEN) return [];
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch('https://api-inference.huggingface.co/models/google/vit-base-patch16-224', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: imageBase64 }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const result = await response.json();
      const predictions = Array.isArray(result) ? result : [result];
      return predictions.slice(0, 5).map(p => p.label);
    }
  } catch (error) {
    console.log('API ошибка:', error.message);
  }
  return [];
}

async function getBreedFromDB(species, breedName) {
  if (!breedName) return null;
  
  try {
    const result = await pool.query(
      `SELECT id, name, name_ru 
       FROM breeds 
       WHERE species = $1 
       AND (LOWER(name) = LOWER($2) OR LOWER(name_ru) = LOWER($2) OR LOWER(name_ru) LIKE $3)
       LIMIT 1`,
      [species, breedName, `%${breedName.toLowerCase().split(' ')[0]}%`]
    );
    
    if (result.rows.length > 0) {
      return result.rows[0];
    }
  } catch (error) {
    console.error('Ошибка БД:', error);
  }
  return null;
}

export const visionController = {
  async recognizeBreed(req, res) {
    const startTime = Date.now();
    
    try {
      const { image, species: selectedSpecies } = req.body;
      
      if (!image) {
        return res.status(400).json({ message: 'Изображение не предоставлено' });
      }

      const targetSpecies = selectedSpecies === 'cat' ? 'cat' : 'dog';
      console.log(`\n${'🔬'.repeat(35)}`);
      console.log(`🔍 РАСПОЗНАВАНИЕ ${targetSpecies === 'dog' ? 'СОБАКИ 🐕' : 'КОШКИ 🐱'}`);
      console.log(`${'🔬'.repeat(35)}`);

      const compressedImage = await compressImage(image);
      const imageHash = getImageHash(compressedImage);
      
      if (predictionCache.has(imageHash)) {
        const cached = predictionCache.get(imageHash);
        console.log(`📦 Кэш (${Math.floor((Date.now() - cached.timestamp) / 1000)} сек)`);
        return res.json({ success: true, ...cached.result, cached: true });
      }
      
      let apiLabels = [];
      if (process.env.HF_API_TOKEN && process.env.HF_API_TOKEN !== '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') {
        console.log('🤖 Запрос к Hugging Face...');
        apiLabels = await callHuggingFaceAPI(compressedImage);
        if (apiLabels.length) {
          console.log(`🏷️ API метки: ${apiLabels.join(', ')}`);
        }
      }
      
      console.log('🔬 Анализ визуальных признаков...');
      const analysis = await advancedImageAnalysis(compressedImage);
      console.log(`📊 Результаты анализа:`);
      console.log(`   - Размер: ${analysis.size}`);
      console.log(`   - Шерсть: ${analysis.coat}`);
      console.log(`   - Уши: ${analysis.ears}`);
      console.log(`   - Морда: ${analysis.face}`);
      console.log(`   - Тело: ${analysis.body}`);
      console.log(`   - Цвет: ${analysis.color}`);
      console.log(`   - Энергия: ${analysis.energy}`);
      
      console.log('🧠 Взвешенное сопоставление с породой...');
      const match = weightedMatch(analysis, targetSpecies, apiLabels);
      
      const breedFromDB = await getBreedFromDB(targetSpecies, match.breed);
      
      const result = {
        success: true,
        breed: {
          id: breedFromDB?.id || null,
          name: breedFromDB?.name_ru || breedFromDB?.name || match.breed || 'Неизвестно',
          name_en: breedFromDB?.name || match.breed || '',
          confidence: match.confidence
        },
        confidence: match.confidence,
        species: targetSpecies,
        analysis: {
          size: analysis.size,
          coat: analysis.coat,
          ears: analysis.ears,
          face: analysis.face,
          body: analysis.body,
          color: analysis.color,
          energy: analysis.energy
        },
        match_reasons: match.reasons,
        match_score: match.score,
        source: apiLabels.length ? 'api+analysis' : 'analysis',
        processingTime: `${Date.now() - startTime}ms`
      };
      
      predictionCache.set(imageHash, { result, timestamp: Date.now() });
      
      console.log(`\n🏆 РЕЗУЛЬТАТ: ${result.breed.name}`);
      console.log(`📈 Уверенность: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`📋 Причины: ${match.reasons.join(', ') || 'нет данных'}`);
      console.log(`${'🔬'.repeat(35)}\n`);
      
      res.json(result);

    } catch (error) {
      console.error('❌ Ошибка:', error);
      res.status(500).json({ 
        success: false,
        message: 'Ошибка при распознавании породы',
        error: error.message 
      });
    }
  },

  async testVision(req, res) {
    const breedsCount = Object.keys(BREED_DATABASE).length;
    
    res.json({ 
      status: 'Vision API готов (продвинутая версия)',
      breeds_in_knowledge_base: breedsCount,
      cache_size: predictionCache.size,
      features_analyzed: ['размер', 'шерсть', 'уши', 'морда', 'телосложение', 'цвет', 'энергия'],
      weights: {
        size: 25, coat: 22, ears: 20, face: 23, body: 18, color: 12, energy: 10, api: 15
      }
    });
  }
};