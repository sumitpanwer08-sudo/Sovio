// Curated synchronized lyrics dataset for Pahadi, Bollywood, Folk, & Mountain classics
import { LyricsData, LyricLine } from '../types';

export const LOCAL_LYRICS_DATABASE: Record<string, LyricsData> = {
  // Kesariya (Arijit Singh)
  'Kesariya': {
    id: 'as-1',
    title: 'Kesariya',
    artist: 'Arijit Singh',
    synced: true,
    source: 'synced_lrc',
    language: 'Hindi',
    lines: [
      { time: 0, text: '♪ (Mountain Flute & Sitar Prelude) ♪' },
      { time: 14, text: 'Mujhko itna bataye koyi', translation: 'Could someone please tell me' },
      { time: 18, text: 'Kaise tujhse dil na lagaye koyi', translation: 'How does one not fall in love with you?' },
      { time: 23, text: 'Rabba ne tujhko banaane mein', translation: 'While crafting someone as precious as you' },
      { time: 27, text: 'Kar di hai husn ki khaali tijoriyaan', translation: 'The Almighty emptied all heavens treasures' },
      { time: 33, text: 'Kaajal ki siyahi se likhi', translation: 'Written with deep dark kohl' },
      { time: 37, text: 'Hai tune jaane kitno ki love storiyaan', translation: 'Countless eternal love stories' },
      { time: 42, text: 'Kesariya tera ishq hai piya', translation: 'Your love is saffron golden, my beloved' },
      { time: 48, text: 'Rang jaaun jo main haath lagaaun', translation: 'I get drenched in its glow the moment I touch it' },
      { time: 53, text: 'Din beete saara teri fikr mein', translation: 'My entire day drifts thinking of you' },
      { time: 58, text: 'Rain saari teri khair manaun', translation: 'And the night passes praying for your well-being' },
      { time: 64, text: 'Kesariya tera ishq hai piya', translation: 'Your love is saffron golden, my beloved' },
      { time: 69, text: 'Rang jaaun jo main haath lagaaun', translation: 'I get drenched in its warm glow' },
      { time: 74, text: 'Patjhad ke mausam mein bhi', translation: 'Even in the autumn breeze' },
      { time: 79, text: 'Rangi chanaar jaisi', translation: 'Like radiant Chinar leaves in the hills' },
      { time: 84, text: 'Jhanke sannaate mein tu', translation: 'You shine in quiet mountain solitude' },
      { time: 89, text: 'Veena ke taar jaisi', translation: 'Like strings of a vintage veena' },
      { time: 94, text: 'Sadiyon se bhi lambi yeh', translation: 'Longer than centuries' },
      { time: 99, text: 'Man ki amavasein hain', translation: 'Are these dark moonless nights of the soul' },
      { time: 104, text: 'Aur tu phuljhadiyon waali', translation: 'And you bring festive sparklers' },
      { time: 109, text: 'Diwali ke tyohar jaisi', translation: 'Like the vibrant festival of lights' },
      { time: 114, text: 'Chanda bhi deewana hai tera', translation: 'Even the moon is enchanted by your grace' },
      { time: 119, text: 'Jalti hai tujhse saari chakoriyan', translation: 'And all nightbirds look at you in awe' },
      { time: 124, text: 'Kaajal ki siyahi se likhi', translation: 'Written with gentle kohl' },
      { time: 129, text: 'Hai tune jaane kitno ki love storiyaan', translation: 'Endless mountain love stories' },
      { time: 134, text: 'Kesariya tera ishq hai piya...', translation: 'Your love is saffron golden, my beloved...' }
    ]
  },

  // Tum Hi Ho (Aashiqui 2)
  'Tum Hi Ho': {
    id: 'as-2',
    title: 'Tum Hi Ho',
    artist: 'Arijit Singh',
    synced: true,
    source: 'synced_lrc',
    language: 'Hindi',
    lines: [
      { time: 0, text: '♪ (Piano & Rain Melody) ♪' },
      { time: 15, text: 'Hum tere bin ab reh nahi sakte', translation: 'I can no longer live without you' },
      { time: 22, text: 'Tere bina kya wajood mera', translation: 'What existence do I have without you?' },
      { time: 30, text: 'Tujhse juda agar ho jaayenge', translation: 'If I ever get separated from you' },
      { time: 37, text: 'Toh khud se hi ho jaayenge juda', translation: 'I will be severed from my own self' },
      { time: 45, text: 'Kyunki tum hi ho, ab tum hi ho', translation: 'Because you alone are, now you alone are' },
      { time: 53, text: 'Zindagi ab tum hi ho', translation: 'My entire life is you alone' },
      { time: 60, text: 'Chain bhi, mera dard bhi', translation: 'My peace of mind, and my sweet heartache' },
      { time: 68, text: 'Meri aashiqui ab tum hi ho', translation: 'My eternal devotion is only you' },
      { time: 76, text: 'Tera mera rishta hai kaisa', translation: 'What sacred bond is this between us?' },
      { time: 83, text: 'Ek pal door gawaara nahi', translation: 'Even a moment apart is unbearable' },
      { time: 91, text: 'Tere liye har roz hain jeete', translation: 'For you, I live each passing sunrise' },
      { time: 99, text: 'Tujhko diya mera waqt sabhi', translation: 'I offer all my moments to you' },
      { time: 106, text: 'Koi lamha mera na ho tere bina', translation: 'May not a single breath exist without you' },
      { time: 114, text: 'Har saans pe naam tera...', translation: 'Your name on every heartbeat...' }
    ]
  },

  // Channa Mereya
  'Channa Mereya': {
    id: 'as-3',
    title: 'Channa Mereya',
    artist: 'Arijit Singh',
    synced: true,
    source: 'synced_lrc',
    language: 'Hindi / Punjabi',
    lines: [
      { time: 0, text: '♪ (Acoustic Guitar & String Strum) ♪' },
      { time: 12, text: 'Achha chalta hoon, duaon mein yaad rakhna', translation: 'Farewell now, keep me in your prayers' },
      { time: 19, text: 'Mere zikr ka zubaan pe swaad rakhna', translation: 'Keep the sweet taste of my name on your lips' },
      { time: 26, text: 'Dil ke sandookon mein mere achhe kaam rakhna', translation: 'In the treasure chest of your heart, keep my good deeds' },
      { time: 33, text: 'Chitthi-taaron mein bhi mera tu salaam rakhna', translation: 'Even in distant letters and stars, send me your greeting' },
      { time: 40, text: 'Andhera tera maine le liya', translation: 'I have taken away all your darkness' },
      { time: 46, text: 'Mera ujla sitaara tere naam kiya', translation: 'And gifted my brightest star to you' },
      { time: 53, text: 'Channa mereya mereya, channa mereya mereya', translation: 'O moonlight of my soul, my light' },
      { time: 61, text: 'Channa mereya mereya beliya, O piya...', translation: 'O light of my heart, my dear beloved...' },
      { time: 75, text: 'Mehfil mein teri hum na rahein jo', translation: 'If I am absent in your gathering' },
      { time: 82, text: 'Gham toh nahi hai, gham toh nahi hai', translation: 'There is no sorrow, no regret' },
      { time: 89, text: 'Qisse humare nazdeeqiyon ke', translation: 'The tales of our closeness and warmth' },
      { time: 96, text: 'Kam toh nahi hain, kam toh nahi hain', translation: 'Are not few, they will live on forever' },
      { time: 103, text: 'Kiti kitabon mein tune padha hai', translation: 'In which book of longing have you read' },
      { time: 109, text: 'Ki mehandi laga ke nazaare churana...', translation: 'To decorate henna and hide tears behind smiles?' }
    ]
  },

  // Ilahi (Mountain Wanderlust / Manali)
  'Ilahi': {
    id: 'as-6',
    title: 'Ilahi',
    artist: 'Arijit Singh',
    synced: true,
    source: 'synced_lrc',
    language: 'Hindi',
    lines: [
      { time: 0, text: '♪ (Mountain Trek Wind & Acoustic Guitar) ♪' },
      { time: 8, text: 'Shaamein malang si, raatein surang si', translation: 'Evenings carefree and wild, nights like secret tunnels' },
      { time: 13, text: 'Baaghi udaan pe hi na jaane kyun', translation: 'Soaring on rebel wings across mountain peaks' },
      { time: 18, text: 'Rehnuma...', translation: 'O guiding beacon...' },
      { time: 23, text: 'Ilahi mera jee aaye aaye', translation: 'O Divine universe, my wanderer spirit awakens' },
      { time: 28, text: 'Ilahi mera jee aaye aaye', translation: 'O Lord, my heart finds its freedom' },
      { time: 33, text: 'Kal pe sawaal hai, jeena filhaal hai', translation: 'Tomorrow is a mystery, right now is for living' },
      { time: 38, text: 'Khaanaabadoshiyon pe hi jaane kyun', translation: 'On these nomad journeys across Shimla and Manali' },
      { time: 43, text: 'Ilahi mera jee aaye aaye...', translation: 'My wandering soul feels so alive...' },
      { time: 55, text: 'Mera aashiyana zarra zarra', translation: 'Every particle of these pine valleys is my home' },
      { time: 60, text: 'Badle rasta jaise hawa ka jhoka', translation: 'Changing paths like a fresh alpine gust' },
      { time: 65, text: 'Parwaz ko chahiye aasmaan...', translation: 'Flight only seeks the endless open skies...' }
    ]
  },

  // Matargashti (Mohit Chauhan - Tamasha)
  'Matargashti': {
    id: 'mc-1',
    title: 'Matargashti',
    artist: 'Mohit Chauhan',
    synced: true,
    source: 'synced_lrc',
    language: 'Hindi',
    lines: [
      { time: 0, text: '♪ (Accordion & Hilltop Whistle) ♪' },
      { time: 10, text: 'Matargashti khuli sadak mein', translation: 'Wandering joyfully on open mountain roads' },
      { time: 14, text: 'Tagdi ho gayi jab se dosti', translation: 'Ever since our friendship became so deep' },
      { time: 19, text: 'Dildaar ka ghoonghat uthega', translation: 'The beloved will reveal her smile' },
      { time: 23, text: 'Dhol tasha bajega gaao mein', translation: 'Drums will echo across the village valley' },
      { time: 28, text: 'He he he, ho ho ho...', translation: 'Joyful carefree chorus...' },
      { time: 35, text: 'Tu rukh badal, tu rang badal', translation: 'Change the direction, change the colors' },
      { time: 40, text: 'Naino ka nishana lagane de', translation: 'Let glances spark a thousand stories' },
      { time: 45, text: 'Tang tang tang, dil tang tang tang...', translation: 'Rhythmic beats of youthful spirit...' }
    ]
  },

  // Moh Moh Ke Dhaage
  'Moh Moh Ke Dhaage': {
    id: 'mmkd-1',
    title: 'Moh Moh Ke Dhaage',
    artist: 'Papon / Monali Thakur',
    synced: true,
    source: 'synced_lrc',
    language: 'Hindi',
    lines: [
      { time: 0, text: '♪ (Bansuri & Mountain Breeze) ♪' },
      { time: 12, text: 'Yeh moh moh ke dhaage', translation: 'These delicate threads of emotional attachment' },
      { time: 18, text: 'Teri ungliyon se jaa uljhe', translation: 'Have gently intertwined around your fingers' },
      { time: 26, text: 'Koyi toh toh na laage', translation: 'No spell or measure can fathom them' },
      { time: 32, text: 'Kisko kya bataaye', translation: 'Whom shall I explain this silent bond to?' },
      { time: 40, text: 'Tu din sa hai, main raat', translation: 'You are like the bright morning, I am like the quiet night' },
      { time: 46, text: 'Aana dono mil jaayein shaam ko', translation: 'Come, let us unite in the golden twilight' },
      { time: 54, text: 'Yeh moh moh ke dhaage...', translation: 'These tender threads of devotion...' }
    ]
  },

  // Pahadi Folk: Chambe Aar Ki Nadi Paar (Himachal Folk)
  'Chambe Aar Ki Nadi Paar': {
    id: 'ph-chambe',
    title: 'Chambe Aar Ki Nadi Paar',
    artist: 'Himachali Folk Traditional',
    synced: true,
    source: 'synced_lrc',
    language: 'Himachali / Pahadi',
    lines: [
      { time: 0, text: '♪ (Dhol, Nagara & Ransingha Folk Intro) ♪' },
      { time: 10, text: 'Chambe aar ki nadi paar, Chambe da rukhna', translation: 'Across the roaring Ravi river in scenic Chamba valley' },
      { time: 18, text: 'Meriye jinduye Chambe da rukhna', translation: 'O my dear soul, behold the green slopes of Chamba' },
      { time: 26, text: 'Maaye ni meriye, Shimle di raahein', translation: 'O dear mother, along the misty winding roads of Shimla' },
      { time: 34, text: 'Khandi de dharon pe baraf payi', translation: 'Fresh pure snow covers the mountain ridges' },
      { time: 42, text: 'Pahada de thande thande paani', translation: 'Cool natural glacial spring waters flow' },
      { time: 50, text: 'Mithi mithi deodar di chhaon...', translation: 'Under the fragrant shade of ancient Deodar pines...' },
      { time: 58, text: 'O phoolan de desha, meriya pahada...', translation: 'O land of wildflowers, my beloved Himalayas...' }
    ]
  },

  // Bedu Pako Baro Masa (Kumaoni / Garhwali Evergreen)
  'Bedu Pako Baro Masa': {
    id: 'ph-bedu',
    title: 'Bedu Pako Baro Masa',
    artist: 'Pahadi Classic Folk',
    synced: true,
    source: 'synced_lrc',
    language: 'Garhwali / Kumaoni',
    lines: [
      { time: 0, text: '♪ (Traditional Hurka, Flute & Pahadi Chorus) ♪' },
      { time: 8, text: 'Bedu pako baro masa, O narayani kaafal pako chaita', translation: 'Wild mountain figs ripen twelve months, ripe bayberries in spring' },
      { time: 17, text: 'Meri chaila, Bedu pako baro masa...', translation: 'O my playful love, wild mountain figs ripen all year round...' },
      { time: 26, text: 'Rupaye ki dori banoo, O narayani', translation: 'Crafting a silver thread necklace for you' },
      { time: 35, text: 'Ghar aaja pardesiya, O chaila', translation: 'Return home to the hills, O wandering traveller' },
      { time: 44, text: 'Bedu pako baro masa...', translation: 'Wild mountain figs ripen twelve months...' }
    ]
  },

  // Phir Le Aya Dil (Barfi / Arijit)
  'Phir Le Aya Dil': {
    id: 'as-phir-le-aya',
    title: 'Phir Le Aya Dil',
    artist: 'Arijit Singh / Pritam',
    synced: true,
    source: 'synced_lrc',
    language: 'Urdu / Hindi',
    lines: [
      { time: 0, text: '♪ (Harmonium, Sarangi & Gentle Rain) ♪' },
      { time: 14, text: 'Phir le aaya dil majboor kya keeje', translation: 'My helpless heart has brought me here again, what can I do?' },
      { time: 23, text: 'Raas na aaya rehna door kya keeje', translation: 'Living so far away never suited me, what can I do?' },
      { time: 33, text: 'Dil keh raha use mukammal kar bhi aao', translation: 'The heart whispers to fulfill that unfinished tale' },
      { time: 43, text: 'Wo jo adhoori si baat baaki hai', translation: 'That soft unsaid conversation that remained between us' },
      { time: 54, text: 'Wo jo adhoori si yaad baaki hai', translation: 'That tender lingering memory that still remains' },
      { time: 64, text: 'Kismat ko hai manzoor kya keeje...', translation: 'Destiny has willed it so, what can one do...' }
    ]
  }
};
