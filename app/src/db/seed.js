import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://travelplanner_app:travelplanner_pass@localhost:5432/stz_travelplanner",
});

const ITINERARIES = [
  {
    title: "3 Days in Rome",
    destination: "Rome",
    country_code: "IT",
    latitude: 41.9028,
    longitude: 12.4964,
    duration_days: 3,
    budget_amount: 450,
    budget_currency: "EUR",
    description:
      "Discover the Eternal City in three unforgettable days. From ancient ruins to mouthwatering pasta, Rome delivers history and flavor at every corner.",
    tier: "free",
    rating: 4.8,
    days: [
      {
        day_number: 1,
        title: "Ancient Rome & the Colosseum",
        items: [
          {
            time: "09:00",
            title: "Colosseum & Roman Forum",
            description:
              "Start your Roman adventure at the iconic Colosseum. Book skip-the-line tickets to explore the amphitheater and the adjacent Roman Forum where senators once debated the fate of an empire.",
            affiliate_url: "https://www.getyourguide.com/rome-l711/colosseum-skip-the-line",
            partner_name: "GetYourGuide",
          },
          {
            time: "13:00",
            title: "Lunch at Rione Monti",
            description:
              "Head to the charming Monti neighborhood for authentic Roman cuisine. Try cacio e pepe at a traditional trattoria in Rome's oldest rione.",
            affiliate_url: null,
            partner_name: null,
          },
          {
            time: "15:30",
            title: "Palatine Hill & Circus Maximus",
            description:
              "Explore the birthplace of Rome on Palatine Hill with panoramic views over the Forum, then stroll along the ancient Circus Maximus chariot racing grounds.",
            affiliate_url: "https://www.booking.com/searchresults.html?dest=Rome",
            partner_name: "Booking.com",
          },
        ],
      },
      {
        day_number: 2,
        title: "Vatican City & Trastevere",
        items: [
          {
            time: "08:00",
            title: "Vatican Museums & Sistine Chapel",
            description:
              "Arrive early to beat the crowds at the Vatican Museums. Marvel at Raphael's Rooms and Michelangelo's breathtaking Sistine Chapel ceiling before entering St. Peter's Basilica.",
            affiliate_url: "https://www.getyourguide.com/vatican-l702/vatican-museums-tickets",
            partner_name: "GetYourGuide",
          },
          {
            time: "12:30",
            title: "St. Peter's Square & Basilica",
            description:
              "Take in Bernini's magnificent colonnade and climb the dome for the best view in Rome. Free entry to the basilica itself.",
            affiliate_url: null,
            partner_name: null,
          },
          {
            time: "19:00",
            title: "Trastevere Food Tour",
            description:
              "Cross the Tiber to Trastevere for an evening food tour. Sample supplì, pizza al taglio, artisan gelato, and local wines in Rome's most atmospheric neighborhood.",
            affiliate_url: "https://www.viator.com/Rome-tours/Food-Tours/d511-g6-c13",
            partner_name: "Viator",
          },
        ],
      },
      {
        day_number: 3,
        title: "Baroque Rome & Farewell",
        items: [
          {
            time: "09:30",
            title: "Trevi Fountain & Spanish Steps",
            description:
              "Toss a coin in the Trevi Fountain to ensure your return to Rome, then climb the iconic Spanish Steps for morning people-watching and coffee at Antico Caffè Greco.",
            affiliate_url: null,
            partner_name: null,
          },
          {
            time: "11:30",
            title: "Pantheon & Piazza Navona",
            description:
              "Step inside the perfectly preserved Pantheon, then wander to Piazza Navona to admire Bernini's Fountain of the Four Rivers and enjoy a leisurely Italian lunch.",
            affiliate_url: "https://www.getyourguide.com/rome-l711/pantheon-guided-tour",
            partner_name: "GetYourGuide",
          },
          {
            time: "15:00",
            title: "Villa Borghese Gardens",
            description:
              "Spend your final afternoon relaxing in Rome's most beautiful park. Rent a rowboat on the lake or visit the stunning Borghese Gallery (pre-booking essential).",
            affiliate_url: "https://www.booking.com/searchresults.html?dest=Rome",
            partner_name: "Booking.com",
          },
        ],
      },
    ],
  },
  {
    title: "5 Days in Tokyo",
    destination: "Tokyo",
    country_code: "JP",
    latitude: 35.6762,
    longitude: 139.6503,
    duration_days: 5,
    budget_amount: 1200,
    budget_currency: "EUR",
    description:
      "Immerse yourself in the dazzling contrast of ancient temples and neon-lit streets. Tokyo is a city where tradition and technology dance together in perfect harmony.",
    tier: "free",
    rating: 4.9,
    days: [
      {
        day_number: 1,
        title: "Shibuya & Shinjuku",
        items: [
          {
            time: "10:00",
            title: "Shibuya Crossing & Hachiko Statue",
            description:
              "Experience the world's busiest pedestrian crossing, then pay respects to Hachiko, Japan's most loyal dog. Head up to Shibuya Sky for a 360-degree view of the city.",
            affiliate_url: "https://www.klook.com/activity/shibuya-sky-tickets",
            partner_name: "Klook",
          },
          {
            time: "13:00",
            title: "Meiji Shrine & Harajuku",
            description:
              "Walk through the towering torii gate into the serene Meiji Shrine forest. Afterward, explore Takeshita Street in Harajuku for quirky fashion and crepes.",
            affiliate_url: null,
            partner_name: null,
          },
          {
            time: "18:00",
            title: "Shinjuku Golden Gai",
            description:
              "Explore the atmospheric narrow alleys of Golden Gai with over 200 tiny bars. End the evening in Omoide Yokocho (Memory Lane) with yakitori and cold beer.",
            affiliate_url: "https://www.viator.com/Tokyo-tours/Nightlife/d334-g16",
            partner_name: "Viator",
          },
        ],
      },
      {
        day_number: 2,
        title: "Temples & Tradition",
        items: [
          {
            time: "08:00",
            title: "Senso-ji Temple & Asakusa",
            description:
              "Visit Tokyo's oldest temple through the iconic Kaminarimon gate. Browse Nakamise-dori shopping street for traditional snacks and souvenirs before the crowds arrive.",
            affiliate_url: null,
            partner_name: null,
          },
          {
            time: "12:00",
            title: "Tokyo Skytree",
            description:
              "Ascend the tallest tower in Japan for incredible views stretching to Mount Fuji on clear days. The Tembo Galleria at 450m is worth the extra ticket.",
            affiliate_url: "https://www.klook.com/activity/tokyo-skytree-tickets",
            partner_name: "Klook",
          },
          {
            time: "16:00",
            title: "Ueno Park & Museums",
            description:
              "Stroll through Ueno Park and visit the Tokyo National Museum for an outstanding collection of Japanese art. Wind down at Ameya-Yokocho market for street food.",
            affiliate_url: "https://www.getyourguide.com/tokyo-l193/ueno-museum-tickets",
            partner_name: "GetYourGuide",
          },
        ],
      },
      {
        day_number: 3,
        title: "Tsukiji & Ginza",
        items: [
          {
            time: "07:00",
            title: "Tsukiji Outer Market",
            description:
              "Arrive early for the freshest sushi breakfast of your life. Sample tamagoyaki, tuna sashimi, and mochi at the dozens of stalls in this legendary market district.",
            affiliate_url: "https://www.viator.com/Tokyo-tours/Food-Tours/d334-g6-c13",
            partner_name: "Viator",
          },
          {
            time: "11:00",
            title: "Imperial Palace East Gardens",
            description:
              "Enjoy the beautifully maintained gardens of the Imperial Palace. The East Gardens are free to enter and offer a peaceful retreat from the city bustle.",
            affiliate_url: null,
            partner_name: null,
          },
          {
            time: "15:00",
            title: "Ginza Shopping & TeamLab",
            description:
              "Explore the upscale Ginza district and experience the immersive digital art of TeamLab Borderless. Book tickets well in advance as they sell out fast.",
            affiliate_url: "https://www.klook.com/activity/teamlab-borderless-tokyo",
            partner_name: "Klook",
          },
        ],
      },
      {
        day_number: 4,
        title: "Akihabara & Odaiba",
        items: [
          {
            time: "10:00",
            title: "Akihabara Electric Town",
            description:
              "Dive into the heart of otaku culture. Browse multi-floor electronics stores, manga shops, retro game arcades, and themed cafés in Tokyo's geek paradise.",
            affiliate_url: null,
            partner_name: null,
          },
          {
            time: "14:00",
            title: "Odaiba Waterfront",
            description:
              "Take the futuristic Yurikamome monorail across Rainbow Bridge to Odaiba. Visit the life-size Unicorn Gundam, Miraikan science museum, and enjoy the artificial beach.",
            affiliate_url: "https://www.klook.com/activity/odaiba-attractions",
            partner_name: "Klook",
          },
        ],
      },
      {
        day_number: 5,
        title: "Day Trip & Farewell",
        items: [
          {
            time: "08:00",
            title: "Day Trip to Kamakura",
            description:
              "Take a 1-hour train ride to Kamakura to see the Great Buddha (Daibutsu) and the beautiful Hase-dera temple. The coastal town offers a perfect change of pace.",
            affiliate_url: "https://www.getyourguide.com/tokyo-l193/kamakura-day-trip",
            partner_name: "GetYourGuide",
          },
          {
            time: "15:00",
            title: "Nakameguro & Daikanyama",
            description:
              "Return to Tokyo for a leisurely afternoon in the stylish Nakameguro area. Walk along the canal, browse indie boutiques, and sip craft coffee at Tsutaya Books.",
            affiliate_url: null,
            partner_name: null,
          },
          {
            time: "19:00",
            title: "Farewell Dinner in Roppongi",
            description:
              "End your Tokyo adventure with a memorable dinner. Choose from Michelin-starred sushi to izakaya dining at Roppongi Hills, with Tokyo Tower glowing in the distance.",
            affiliate_url: "https://www.booking.com/searchresults.html?dest=Tokyo",
            partner_name: "Booking.com",
          },
        ],
      },
    ],
  },
  {
    title: "Swiss Alps Road Trip 7 Days",
    destination: "Switzerland",
    country_code: "CH",
    latitude: 46.8182,
    longitude: 8.2275,
    duration_days: 7,
    budget_amount: 2500,
    budget_currency: "CHF",
    description:
      "Wind through the heart of the Swiss Alps on this epic 7-day road trip. From crystal-clear lakes to snow-capped peaks, every turn reveals a postcard-perfect panorama.",
    tier: "free",
    rating: 4.7,
    days: [
      {
        day_number: 1,
        title: "Lucerne & Lake Gateway",
        items: [
          {
            time: "09:00",
            title: "Chapel Bridge & Old Town",
            description:
              "Begin in Lucerne at the iconic Chapel Bridge, Europe's oldest covered wooden bridge. Wander the cobblestone streets of the Old Town and admire the painted facades.",
            affiliate_url: "https://www.booking.com/searchresults.html?dest=Lucerne",
            partner_name: "Booking.com",
          },
          {
            time: "13:00",
            title: "Lake Lucerne Cruise",
            description:
              "Board a paddle steamer for a scenic cruise across Lake Lucerne. The 1-hour ride to Weggis offers stunning views of Mount Pilatus and Rigi on either side.",
            affiliate_url: "https://www.getyourguide.com/lucerne-l547/lake-cruise",
            partner_name: "GetYourGuide",
          },
          {
            time: "16:00",
            title: "Mount Pilatus Gondola",
            description:
              "Take the aerial panorama gondola up Mount Pilatus for breathtaking views. On clear days, you can see over 70 Alpine peaks from the summit terrace.",
            affiliate_url: "https://www.klook.com/activity/mount-pilatus-lucerne",
            partner_name: "Klook",
          },
        ],
      },
      {
        day_number: 2,
        title: "Interlaken & Twin Lakes",
        items: [
          {
            time: "09:00",
            title: "Drive to Interlaken",
            description:
              "Take the scenic A8 motorway along Lake Brienz. Stop at Giessbach Falls, accessible by a historic funicular, before arriving in Interlaken between its two famous lakes.",
            affiliate_url: null,
            partner_name: null,
          },
          {
            time: "14:00",
            title: "Paragliding over Interlaken",
            description:
              "Soar tandem above the stunning landscape between Lake Thun and Lake Brienz. No experience needed - the 15-minute flight is an unforgettable Alpine highlight.",
            affiliate_url: "https://www.getyourguide.com/interlaken-l564/paragliding",
            partner_name: "GetYourGuide",
          },
        ],
      },
      {
        day_number: 3,
        title: "Jungfraujoch - Top of Europe",
        items: [
          {
            time: "07:30",
            title: "Jungfraujoch Railway",
            description:
              "Take the highest railway in Europe to the Jungfraujoch at 3,454m. Visit the Ice Palace, Sphinx observation deck, and walk on the Aletsch Glacier - Europe's longest.",
            affiliate_url: "https://www.klook.com/activity/jungfraujoch-tickets",
            partner_name: "Klook",
          },
          {
            time: "15:00",
            title: "Lauterbrunnen Valley",
            description:
              "Descend to the breathtaking Lauterbrunnen Valley with its 72 waterfalls. Visit Staubbach Falls and Trummelbach Falls, carved inside the mountain by glacial meltwater.",
            affiliate_url: null,
            partner_name: null,
          },
        ],
      },
      {
        day_number: 4,
        title: "Bern & Westward",
        items: [
          {
            time: "09:00",
            title: "Bern Old Town (UNESCO)",
            description:
              "Explore Switzerland's capital and its UNESCO-listed medieval old town. See the Zytglogge clock tower, the Bear Park, and the stunning views from the Rosengarten.",
            affiliate_url: null,
            partner_name: null,
          },
          {
            time: "14:00",
            title: "Gruyères Medieval Village",
            description:
              "Drive to the fairy-tale village of Gruyères. Tour the medieval castle, sample fondue at its birthplace, and visit the surprisingly excellent HR Giger Museum.",
            affiliate_url: "https://www.viator.com/Bern-tours/Day-Trips/d4543-g1",
            partner_name: "Viator",
          },
        ],
      },
      {
        day_number: 5,
        title: "Zermatt & the Matterhorn",
        items: [
          {
            time: "08:00",
            title: "Drive to Täsch & Train to Zermatt",
            description:
              "Park in Täsch and take the shuttle train to car-free Zermatt. The village sits at the foot of the legendary Matterhorn, one of the most photographed peaks on Earth.",
            affiliate_url: "https://www.booking.com/searchresults.html?dest=Zermatt",
            partner_name: "Booking.com",
          },
          {
            time: "11:00",
            title: "Gornergrat Railway",
            description:
              "Ride the highest open-air cogwheel railway in Europe to Gornergrat at 3,089m. The panorama includes 29 peaks over 4,000m and the Monte Rosa massif.",
            affiliate_url: "https://www.klook.com/activity/gornergrat-railway-tickets",
            partner_name: "Klook",
          },
          {
            time: "16:00",
            title: "Matterhorn Glacier Paradise",
            description:
              "Ascend to Europe's highest cable car station at 3,883m. Step onto the viewing platform for face-to-face views of the Matterhorn and visit the Glacier Palace ice cave.",
            affiliate_url: "https://www.getyourguide.com/zermatt-l548/matterhorn-glacier-paradise",
            partner_name: "GetYourGuide",
          },
        ],
      },
      {
        day_number: 6,
        title: "Lugano & Italian Switzerland",
        items: [
          {
            time: "09:00",
            title: "Simplon Pass Drive",
            description:
              "Cross the dramatic Simplon Pass connecting the Valais to Ticino. Napoleon built this road in the early 1800s. The winding descent reveals a sudden shift to Mediterranean landscape.",
            affiliate_url: null,
            partner_name: null,
          },
          {
            time: "14:00",
            title: "Lugano Lakefront & Monte San Salvatore",
            description:
              "Enjoy the palm-lined promenade of Lugano and take the funicular up Monte San Salvatore for sweeping views over the lake district and into Italy.",
            affiliate_url: "https://www.booking.com/searchresults.html?dest=Lugano",
            partner_name: "Booking.com",
          },
        ],
      },
      {
        day_number: 7,
        title: "Gotthard Pass & Return",
        items: [
          {
            time: "09:00",
            title: "Gotthard Pass Old Road",
            description:
              "Take the legendary cobblestone Gotthard Pass road (Tremola) with its 24 hairpin turns. Stop at the Hospice and the Devil's Bridge for photos and legends.",
            affiliate_url: null,
            partner_name: null,
          },
          {
            time: "14:00",
            title: "Lake Zurich Farewell",
            description:
              "End your Swiss road trip in Zurich. Stroll along the lakefront promenade, browse the boutiques on Bahnhofstrasse, and toast to the Alps over a final fondue dinner.",
            affiliate_url: "https://www.booking.com/searchresults.html?dest=Zurich",
            partner_name: "Booking.com",
          },
        ],
      },
    ],
  },
  {
    title: "10 Days in Bali",
    destination: "Bali",
    country_code: "ID",
    latitude: -8.3405,
    longitude: 115.0920,
    duration_days: 10,
    budget_amount: 1800,
    budget_currency: "EUR",
    description:
      "From terraced rice paddies to volcanic sunrises, Bali enchants at every turn. This 10-day journey covers culture, nature, beaches, and spiritual discovery on the Island of the Gods.",
    tier: "explorer",
    rating: 4.8,
    days: [
      {
        day_number: 1,
        title: "Arrival in Seminyak",
        items: [
          {
            time: "14:00",
            title: "Check in & Beach Time",
            description:
              "Settle into your Seminyak villa and head to the beach. The golden sand stretches for miles, perfect for an afternoon dip and your first Bintang sunset.",
            affiliate_url: "https://www.booking.com/searchresults.html?dest=Seminyak+Bali",
            partner_name: "Booking.com",
          },
          {
            time: "18:30",
            title: "Sunset at La Plancha",
            description:
              "Grab a colorful beanbag on the beach at La Plancha for the famous Seminyak sunset. Order cocktails and fresh seafood as the sky turns orange and pink.",
            affiliate_url: null,
            partner_name: null,
          },
        ],
      },
      {
        day_number: 2,
        title: "Ubud Cultural Immersion",
        items: [
          {
            time: "08:00",
            title: "Drive to Ubud",
            description:
              "Head north to Bali's cultural heart. Stop at the Tegenungan Waterfall for a refreshing swim before arriving in the artistic town surrounded by lush jungle.",
            affiliate_url: null,
            partner_name: null,
          },
          {
            time: "11:00",
            title: "Sacred Monkey Forest",
            description:
              "Walk through the atmospheric Monkey Forest Sanctuary. Over 1,200 Balinese long-tailed macaques roam among ancient temple ruins draped in moss and banyan roots.",
            affiliate_url: "https://www.getyourguide.com/ubud-l1023/monkey-forest-tour",
            partner_name: "GetYourGuide",
          },
          {
            time: "16:00",
            title: "Ubud Art Market & Palace",
            description:
              "Browse handcrafted goods at Ubud Art Market and visit the adjacent Ubud Royal Palace. In the evening, catch a traditional Kecak fire dance performance.",
            affiliate_url: "https://www.viator.com/Bali-tours/Cultural-Tours/d712-g3",
            partner_name: "Viator",
          },
        ],
      },
      {
        day_number: 3,
        title: "Rice Terraces & Waterfalls",
        items: [
          {
            time: "07:00",
            title: "Tegallalang Rice Terraces",
            description:
              "Visit the iconic Tegallalang rice terraces at dawn before the crowds. The cascading paddies have been farmed using the traditional subak irrigation system for centuries.",
            affiliate_url: null,
            partner_name: null,
          },
          {
            time: "11:00",
            title: "Tirta Empul Water Temple",
            description:
              "Participate in a purification ritual at Tirta Empul, one of Bali's holiest water temples. The sacred spring pools are believed to have healing properties.",
            affiliate_url: "https://www.getyourguide.com/bali-l347/tirta-empul-tour",
            partner_name: "GetYourGuide",
          },
          {
            time: "15:00",
            title: "Tukad Cepung Waterfall",
            description:
              "Hike through a narrow canyon to discover Tukad Cepung, a hidden waterfall inside a cave. When sunlight filters through the rocks, it creates a magical light show.",
            affiliate_url: null,
            partner_name: null,
          },
        ],
      },
      {
        day_number: 4,
        title: "Mount Batur Sunrise",
        items: [
          {
            time: "02:00",
            title: "Mount Batur Sunrise Trek",
            description:
              "Start the pre-dawn hike up the active volcano Mount Batur (1,717m). Reach the summit for a breathtaking sunrise over Lake Batur and Mount Agung. Breakfast eggs cooked in volcanic steam.",
            affiliate_url: "https://www.klook.com/activity/mount-batur-sunrise-trek",
            partner_name: "Klook",
          },
          {
            time: "12:00",
            title: "Batur Natural Hot Springs",
            description:
              "Soak your tired muscles in the natural hot springs overlooking Lake Batur. The volcanic-heated pools are the perfect reward after the early morning trek.",
            affiliate_url: "https://www.booking.com/searchresults.html?dest=Kintamani+Bali",
            partner_name: "Booking.com",
          },
        ],
      },
      {
        day_number: 5,
        title: "East Bali Temples",
        items: [
          {
            time: "08:00",
            title: "Besakih Mother Temple",
            description:
              "Visit Bali's largest and holiest temple complex on the slopes of Mount Agung. The 23 separate temples date back over 1,000 years and are still actively used for worship.",
            affiliate_url: "https://www.getyourguide.com/bali-l347/besakih-temple-tour",
            partner_name: "GetYourGuide",
          },
          {
            time: "14:00",
            title: "Lempuyang Temple Gates of Heaven",
            description:
              "Climb 1,700 steps to the famous 'Gates of Heaven' at Lempuyang Temple. The split gate frames Mount Agung perfectly - an iconic Bali photograph.",
            affiliate_url: null,
            partner_name: null,
          },
        ],
      },
      {
        day_number: 6,
        title: "Nusa Penida Day Trip",
        items: [
          {
            time: "07:00",
            title: "Fast Boat to Nusa Penida",
            description:
              "Take a 45-minute speedboat to Nusa Penida island. Visit the jaw-dropping Kelingking Beach (T-Rex cliff), Angel's Billabong natural infinity pool, and Broken Beach sea arch.",
            affiliate_url: "https://www.klook.com/activity/nusa-penida-day-trip",
            partner_name: "Klook",
          },
          {
            time: "14:00",
            title: "Snorkeling with Manta Rays",
            description:
              "Snorkel at Manta Point for a chance to swim alongside giant oceanic manta rays with wingspans up to 5 meters. An absolutely unforgettable marine encounter.",
            affiliate_url: "https://www.viator.com/Bali-tours/Snorkeling/d712-g13",
            partner_name: "Viator",
          },
        ],
      },
      {
        day_number: 7,
        title: "Uluwatu & Southern Cliffs",
        items: [
          {
            time: "10:00",
            title: "Uluwatu Temple",
            description:
              "Perched on a 70-meter cliff above the Indian Ocean, Uluwatu Temple is spectacular. Watch for cheeky monkeys and enjoy the dramatic coastal scenery.",
            affiliate_url: null,
            partner_name: null,
          },
          {
            time: "14:00",
            title: "Padang Padang Beach",
            description:
              "Descend through a narrow cave entrance to reach the hidden Padang Padang beach. Famous from 'Eat Pray Love', this sheltered cove has perfect turquoise water.",
            affiliate_url: "https://www.booking.com/searchresults.html?dest=Uluwatu+Bali",
            partner_name: "Booking.com",
          },
          {
            time: "18:00",
            title: "Kecak Dance at Sunset",
            description:
              "Watch the mesmerizing Kecak fire dance performed at Uluwatu's amphitheater as the sun sets over the ocean. A truly magical Balinese cultural experience.",
            affiliate_url: "https://www.getyourguide.com/bali-l347/uluwatu-kecak-dance",
            partner_name: "GetYourGuide",
          },
        ],
      },
      {
        day_number: 8,
        title: "Canggu Beach Life",
        items: [
          {
            time: "09:00",
            title: "Surf Lesson at Batu Bolong",
            description:
              "Try surfing at Batu Bolong beach in Canggu, perfect for beginners. The mellow waves and sandy bottom make it the ideal spot to catch your first wave in Bali.",
            affiliate_url: "https://www.klook.com/activity/bali-surf-lesson-canggu",
            partner_name: "Klook",
          },
          {
            time: "14:00",
            title: "Tanah Lot Temple",
            description:
              "Visit the iconic Tanah Lot, a sea temple perched on a rock formation surrounded by crashing waves. One of Bali's most photographed landmarks, especially at golden hour.",
            affiliate_url: null,
            partner_name: null,
          },
        ],
      },
      {
        day_number: 9,
        title: "North Bali Hidden Gems",
        items: [
          {
            time: "07:00",
            title: "Sekumpul Waterfall",
            description:
              "Trek through jungle to reach Sekumpul, widely considered Bali's most beautiful waterfall. The twin falls cascade 80 meters through lush tropical vegetation.",
            affiliate_url: null,
            partner_name: null,
          },
          {
            time: "13:00",
            title: "Handara Gate & Twin Lakes",
            description:
              "Stop at the famous Handara Gate and continue to the serene twin lakes of Buyan and Tamblingan, surrounded by pristine rainforest far from the tourist crowds.",
            affiliate_url: "https://www.viator.com/Bali-tours/Day-Trips/d712-g1",
            partner_name: "Viator",
          },
        ],
      },
      {
        day_number: 10,
        title: "Spa Day & Departure",
        items: [
          {
            time: "09:00",
            title: "Balinese Spa Experience",
            description:
              "Indulge in a traditional Balinese spa with flower bath, body scrub, and 90-minute massage. The perfect way to end your Bali journey feeling completely rejuvenated.",
            affiliate_url: "https://www.klook.com/activity/bali-spa-packages",
            partner_name: "Klook",
          },
          {
            time: "13:00",
            title: "Last Lunch & Souvenir Shopping",
            description:
              "Enjoy a final Balinese feast of nasi goreng and fresh juice, then pick up last-minute souvenirs - luwak coffee, silver jewelry, and handwoven textiles make perfect gifts.",
            affiliate_url: null,
            partner_name: null,
          },
        ],
      },
    ],
  },
  {
    title: "4 Days in New York",
    destination: "New York",
    country_code: "US",
    latitude: 40.7128,
    longitude: -74.0060,
    duration_days: 4,
    budget_amount: 1500,
    budget_currency: "USD",
    description:
      "The city that never sleeps packs more into four days than most destinations offer in a month. From Broadway lights to Brooklyn brownstones, NYC is pure electric energy.",
    tier: "explorer",
    rating: 4.6,
    days: [
      {
        day_number: 1,
        title: "Manhattan Icons",
        items: [
          {
            time: "09:00",
            title: "Statue of Liberty & Ellis Island",
            description:
              "Take the first ferry to Liberty Island for fewer crowds. Climb the pedestal for harbor views, then explore Ellis Island's Immigration Museum where 12 million people entered America.",
            affiliate_url: "https://www.getyourguide.com/new-york-l59/statue-of-liberty-tickets",
            partner_name: "GetYourGuide",
          },
          {
            time: "14:00",
            title: "9/11 Memorial & One World Observatory",
            description:
              "Pay respects at the deeply moving 9/11 Memorial reflecting pools, then ascend 102 floors to One World Observatory for Manhattan's most dramatic panoramic view.",
            affiliate_url: "https://www.klook.com/activity/one-world-observatory-tickets",
            partner_name: "Klook",
          },
          {
            time: "19:00",
            title: "Broadway Show",
            description:
              "Experience the magic of Broadway with a world-class show in the Theater District. Book in advance for popular shows or try the TKTS booth in Times Square for same-day discounts.",
            affiliate_url: "https://www.viator.com/New-York-City-tours/Theater-Shows/d687-g25",
            partner_name: "Viator",
          },
        ],
      },
      {
        day_number: 2,
        title: "Central Park & Uptown",
        items: [
          {
            time: "08:00",
            title: "Central Park Morning Walk",
            description:
              "Start with a peaceful walk through Central Park. Visit Bethesda Fountain, the Bow Bridge, and Strawberry Fields. Rent a rowboat on the Lake or grab coffee at the Loeb Boathouse.",
            affiliate_url: null,
            partner_name: null,
          },
          {
            time: "11:00",
            title: "Metropolitan Museum of Art",
            description:
              "Spend hours in one of the world's greatest museums. Don't miss the Temple of Dendur, European paintings, and the rooftop garden with Central Park views.",
            affiliate_url: "https://www.getyourguide.com/new-york-l59/met-museum-tickets",
            partner_name: "GetYourGuide",
          },
          {
            time: "17:00",
            title: "Top of the Rock at Sunset",
            description:
              "Head to Rockefeller Center for sunset views from the Top of the Rock. Unlike the Empire State Building, you get the ESB in your photos along with Central Park and downtown Manhattan.",
            affiliate_url: "https://www.klook.com/activity/top-of-the-rock-tickets",
            partner_name: "Klook",
          },
        ],
      },
      {
        day_number: 3,
        title: "Brooklyn & Downtown",
        items: [
          {
            time: "09:00",
            title: "Brooklyn Bridge Walk",
            description:
              "Walk across the iconic Brooklyn Bridge in the morning light. The 1.1-mile walk offers stunning views of the Manhattan skyline. Start from Brooklyn for the best photo angle.",
            affiliate_url: null,
            partner_name: null,
          },
          {
            time: "11:00",
            title: "DUMBO & Brooklyn Heights",
            description:
              "Explore DUMBO's cobblestone streets and snap the classic Manhattan Bridge view from Washington Street. Walk the Brooklyn Heights Promenade for the best skyline panorama in the city.",
            affiliate_url: "https://www.booking.com/searchresults.html?dest=Brooklyn+New+York",
            partner_name: "Booking.com",
          },
          {
            time: "15:00",
            title: "High Line & Chelsea Market",
            description:
              "Walk the elevated High Line park built on a former railway. Browse the artisan food vendors inside Chelsea Market for lobster rolls, tacos, and gelato.",
            affiliate_url: "https://www.viator.com/New-York-City-tours/Food-Tours/d687-g6-c13",
            partner_name: "Viator",
          },
        ],
      },
      {
        day_number: 4,
        title: "Culture & Farewell",
        items: [
          {
            time: "09:00",
            title: "Greenwich Village & SoHo",
            description:
              "Wander the tree-lined streets of the Village, see Washington Square Park, then head to SoHo for cast-iron architecture and boutique shopping on cobblestone streets.",
            affiliate_url: null,
            partner_name: null,
          },
          {
            time: "13:00",
            title: "Little Italy & Chinatown",
            description:
              "Grab a cannoli at Ferrara's in Little Italy, then cross into the bustling streets of Chinatown for dim sum and the vibrant markets of Canal Street.",
            affiliate_url: null,
            partner_name: null,
          },
          {
            time: "17:00",
            title: "Empire State Building at Night",
            description:
              "End your NYC adventure at the Empire State Building after dark. The 86th floor observation deck offers 360-degree views of the glittering city lights stretching to the horizon.",
            affiliate_url: "https://www.klook.com/activity/empire-state-building-tickets",
            partner_name: "Klook",
          },
        ],
      },
    ],
  },
  {
    title: "Iceland Ring Road 12 Days",
    destination: "Iceland",
    country_code: "IS",
    latitude: 64.1466,
    longitude: -21.9426,
    duration_days: 12,
    budget_amount: 4500,
    budget_currency: "EUR",
    description:
      "Circle the entire island on the legendary Ring Road. From erupting geysers to glacier lagoons, Iceland is Earth at its most raw and magnificent. This premium itinerary covers every major highlight.",
    tier: "premium",
    rating: 4.9,
    days: [
      {
        day_number: 1,
        title: "Reykjavik Arrival",
        items: [
          {
            time: "10:00",
            title: "Reykjavik City Walk",
            description:
              "Explore Iceland's colorful capital. Visit Hallgrimskirkja church, Harpa concert hall, and the Sun Voyager sculpture on the waterfront. The Old Harbor area has great seafood restaurants.",
            affiliate_url: "https://www.booking.com/searchresults.html?dest=Reykjavik",
            partner_name: "Booking.com",
          },
          {
            time: "16:00",
            title: "Sky Lagoon",
            description:
              "Ease into your Iceland trip at the stunning Sky Lagoon. The infinity-edge geothermal pool overlooks the North Atlantic - the perfect jet lag remedy.",
            affiliate_url: "https://www.klook.com/activity/sky-lagoon-iceland",
            partner_name: "Klook",
          },
        ],
      },
      {
        day_number: 2,
        title: "Golden Circle",
        items: [
          {
            time: "08:00",
            title: "Thingvellir National Park",
            description:
              "Walk between the North American and Eurasian tectonic plates at this UNESCO site. The Althing, the world's oldest parliament, was founded here in 930 AD.",
            affiliate_url: null,
            partner_name: null,
          },
          {
            time: "12:00",
            title: "Geysir & Gullfoss",
            description:
              "Watch Strokkur geyser erupt every 5-8 minutes, launching boiling water 30 meters into the air. Continue to Gullfoss, a thundering two-tiered waterfall that plunges into a canyon.",
            affiliate_url: "https://www.getyourguide.com/reykjavik-l30/golden-circle-tour",
            partner_name: "GetYourGuide",
          },
          {
            time: "16:00",
            title: "Secret Lagoon",
            description:
              "Soak in Iceland's oldest swimming pool in Fludir. Less crowded and more authentic than the Blue Lagoon, with natural hot springs and occasional geyser views.",
            affiliate_url: "https://www.klook.com/activity/secret-lagoon-iceland",
            partner_name: "Klook",
          },
        ],
      },
      {
        day_number: 3,
        title: "South Coast Waterfalls",
        items: [
          {
            time: "09:00",
            title: "Seljalandsfoss & Skogafoss",
            description:
              "Walk behind the curtain of Seljalandsfoss waterfall, then stand in the mist of the mighty 60m Skogafoss. Climb the stairs beside Skogafoss for a view from the top.",
            affiliate_url: null,
            partner_name: null,
          },
          {
            time: "14:00",
            title: "Reynisfjara Black Sand Beach",
            description:
              "Visit the dramatic black basalt beach at Vik. The hexagonal basalt columns and roaring Atlantic waves make this one of the most otherworldly beaches on the planet. Stay clear of sneaker waves.",
            affiliate_url: "https://www.booking.com/searchresults.html?dest=Vik+Iceland",
            partner_name: "Booking.com",
          },
        ],
      },
      {
        day_number: 4,
        title: "Glacier Adventures",
        items: [
          {
            time: "09:00",
            title: "Glacier Hike on Solheimajokull",
            description:
              "Strap on crampons for a guided hike on the Solheimajokull glacier tongue. Walk among blue ice formations, moulins, and crevasses with a certified glacier guide.",
            affiliate_url: "https://www.getyourguide.com/vik-l2662/glacier-hike",
            partner_name: "GetYourGuide",
          },
          {
            time: "15:00",
            title: "Jokulsarlon Glacier Lagoon",
            description:
              "Watch massive icebergs calve from the Breidamerkurjokull glacier and float through the lagoon to the sea. Take a zodiac boat ride among the blue ice sculptures.",
            affiliate_url: "https://www.klook.com/activity/jokulsarlon-boat-tour",
            partner_name: "Klook",
          },
        ],
      },
      {
        day_number: 5,
        title: "Diamond Beach & East Fjords",
        items: [
          {
            time: "08:00",
            title: "Diamond Beach Sunrise",
            description:
              "Crystal-clear icebergs wash up on the black volcanic sand, sparkling like diamonds in the morning light. One of Iceland's most photogenic locations, directly across from Jokulsarlon.",
            affiliate_url: null,
            partner_name: null,
          },
          {
            time: "12:00",
            title: "East Fjords Scenic Drive",
            description:
              "Wind through the dramatic East Fjords, Iceland's most remote and least-visited region. Stop in the charming fishing villages of Djupivogur and Faskrudsfjordur for fresh seafood.",
            affiliate_url: "https://www.booking.com/searchresults.html?dest=Egilsstadir+Iceland",
            partner_name: "Booking.com",
          },
        ],
      },
      {
        day_number: 6,
        title: "Eastfjords to Myvatn",
        items: [
          {
            time: "09:00",
            title: "Studlagil Canyon",
            description:
              "Hike to the stunning Studlagil Canyon with its magnificent basalt columns rising from the turquoise glacial river. One of Iceland's newest viral attractions and absolutely worth the detour.",
            affiliate_url: null,
            partner_name: null,
          },
          {
            time: "15:00",
            title: "Dettifoss Waterfall",
            description:
              "Feel the raw power of Europe's most powerful waterfall. Dettifoss drops 45 meters with a flow rate of 500 cubic meters per second - the spray is visible from miles away.",
            affiliate_url: null,
            partner_name: null,
          },
        ],
      },
      {
        day_number: 7,
        title: "Lake Myvatn Area",
        items: [
          {
            time: "09:00",
            title: "Myvatn Nature Baths",
            description:
              "Soak in the 'Blue Lagoon of the North' without the crowds. The milky-blue geothermal waters of Myvatn Nature Baths offer views across the volcanic landscape and lake.",
            affiliate_url: "https://www.klook.com/activity/myvatn-nature-baths",
            partner_name: "Klook",
          },
          {
            time: "13:00",
            title: "Namafjall & Grjotagja Cave",
            description:
              "Explore the bubbling mud pots and sulfuric vents of Namafjall geothermal area, then visit the underground hot spring cave of Grjotagja, made famous by Game of Thrones.",
            affiliate_url: null,
            partner_name: null,
          },
          {
            time: "16:00",
            title: "Godafoss Waterfall",
            description:
              "Visit the 'Waterfall of the Gods' where Viking chieftain Thorgeir threw his Norse god statues when Iceland converted to Christianity in 1000 AD. Beautiful from both sides of the canyon.",
            affiliate_url: "https://www.getyourguide.com/akureyri-l1026/godafoss-tour",
            partner_name: "GetYourGuide",
          },
        ],
      },
      {
        day_number: 8,
        title: "Akureyri & Whale Watching",
        items: [
          {
            time: "09:00",
            title: "Akureyri Town",
            description:
              "Explore the capital of the north. Visit the Arctic Botanical Garden (the world's most northerly), the iconic Akureyrarkirkja church, and the charming downtown cafés.",
            affiliate_url: null,
            partner_name: null,
          },
          {
            time: "13:00",
            title: "Whale Watching from Husavik",
            description:
              "Drive to Husavik, Europe's whale watching capital. Join a 3-hour boat tour with near-guaranteed sightings of humpback whales, plus dolphins and occasional blue whales.",
            affiliate_url: "https://www.getyourguide.com/husavik-l2660/whale-watching",
            partner_name: "GetYourGuide",
          },
        ],
      },
      {
        day_number: 9,
        title: "Troll Peninsula",
        items: [
          {
            time: "08:00",
            title: "Siglufjordur Herring Museum",
            description:
              "Drive the stunning Troll Peninsula coast to Siglufjordur, Iceland's most charming northern village. The award-winning Herring Era Museum tells the story of Iceland's boom years.",
            affiliate_url: null,
            partner_name: null,
          },
          {
            time: "14:00",
            title: "Hofsos Infinity Pool",
            description:
              "Swim in the Hofsos infinity pool perched on the edge of the Skagafjordur fjord. The heated pool appears to merge with the ocean and the distant Drangey island.",
            affiliate_url: "https://www.booking.com/searchresults.html?dest=Skagafjordur+Iceland",
            partner_name: "Booking.com",
          },
        ],
      },
      {
        day_number: 10,
        title: "Snaefellsnes Peninsula",
        items: [
          {
            time: "08:00",
            title: "Kirkjufell Mountain",
            description:
              "Photograph Iceland's most iconic mountain and the adjacent Kirkjufellsfoss waterfall. This 'arrowhead' mountain in Grundarfjordur is a must-see, especially in golden hour light.",
            affiliate_url: null,
            partner_name: null,
          },
          {
            time: "13:00",
            title: "Snaefellsjokull National Park",
            description:
              "Explore the glacier-capped volcano that Jules Verne chose as the entrance to the center of the Earth. Visit Djupalonssandur black pebble beach and the Londrangar basalt cliffs.",
            affiliate_url: "https://www.getyourguide.com/snaefellsnes-l2661/peninsula-tour",
            partner_name: "GetYourGuide",
          },
        ],
      },
      {
        day_number: 11,
        title: "Western Iceland & Hot Springs",
        items: [
          {
            time: "09:00",
            title: "Hraunfossar & Barnafoss",
            description:
              "Visit the unique Hraunfossar waterfalls where hundreds of rivulets stream out of a lava field over a distance of 900 meters. Adjacent Barnafoss has a darker, legendary origin story.",
            affiliate_url: null,
            partner_name: null,
          },
          {
            time: "14:00",
            title: "Deildartunguhver Hot Spring",
            description:
              "See Europe's most powerful hot spring gushing 180 liters per second at 97C. The nearby Krauma geothermal baths use this water, cooled and mixed to a perfect temperature.",
            affiliate_url: "https://www.klook.com/activity/krauma-baths-iceland",
            partner_name: "Klook",
          },
        ],
      },
      {
        day_number: 12,
        title: "Blue Lagoon & Departure",
        items: [
          {
            time: "09:00",
            title: "Blue Lagoon",
            description:
              "Conclude your Ring Road journey at Iceland's most famous attraction. The milky-blue geothermal spa set among black lava fields is the ultimate relaxation before your flight home.",
            affiliate_url: "https://www.klook.com/activity/blue-lagoon-iceland-tickets",
            partner_name: "Klook",
          },
          {
            time: "14:00",
            title: "Reykjanes Peninsula",
            description:
              "If time allows, drive through the Reykjanes UNESCO Geopark. See the Bridge Between Continents, Gunnuhver hot springs, and the Reykjanesviti lighthouse before heading to the airport.",
            affiliate_url: null,
            partner_name: null,
          },
        ],
      },
    ],
  },
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Clear existing data
    await client.query("DELETE FROM affiliate_clicks");
    await client.query("DELETE FROM saved_trips");
    await client.query("DELETE FROM itinerary_items");
    await client.query("DELETE FROM itinerary_days");
    await client.query("DELETE FROM itineraries");

    for (const itin of ITINERARIES) {
      const itinRes = await client.query(
        `INSERT INTO itineraries (title, destination, country_code, duration_days, budget_amount, budget_currency, description, tier, rating, latitude, longitude)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
        [
          itin.title,
          itin.destination,
          itin.country_code,
          itin.duration_days,
          itin.budget_amount,
          itin.budget_currency,
          itin.description,
          itin.tier,
          itin.rating,
          itin.latitude || null,
          itin.longitude || null,
        ]
      );
      const itineraryId = itinRes.rows[0].id;

      for (const day of itin.days) {
        const dayRes = await client.query(
          `INSERT INTO itinerary_days (itinerary_id, day_number, title) VALUES ($1, $2, $3) RETURNING id`,
          [itineraryId, day.day_number, day.title]
        );
        const dayId = dayRes.rows[0].id;

        for (const item of day.items) {
          await client.query(
            `INSERT INTO itinerary_items (day_id, time, title, description, affiliate_url, partner_name)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [dayId, item.time, item.title, item.description, item.affiliate_url, item.partner_name]
          );
        }
      }
    }

    await client.query("COMMIT");
    console.log(`Seeded ${ITINERARIES.length} itineraries successfully.`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
