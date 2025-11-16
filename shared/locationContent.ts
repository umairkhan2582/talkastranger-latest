// Unique FAQ and Mission/Vision content for each location

export interface LocationContent {
  faq: Array<{ q: string; a: string }>;
  missionVision: {
    mission: string;
    vision: string;
    why: string;
  };
}

// COUNTRY-SPECIFIC CONTENT
export const countryContent: Record<string, LocationContent> = {
  'united-states': {
    faq: [
      { q: 'What makes the US community special on Talk A Stranger?', a: 'The US has the largest user base on our platform with people from all 50 states. You can meet Americans from diverse backgrounds, from New York City natives to California surfers, Texas ranchers to Florida beach lovers.' },
      { q: 'What time are most US users online?', a: 'Peak hours are 7-11 PM EST on weekdays, with highest activity on Friday and Saturday nights. West Coast users are most active 9 PM - 1 AM PST.' },
      { q: 'Can I practice my English with American users?', a: 'Absolutely! Many American users enjoy helping others practice English. You\'ll encounter various accents from Southern drawl to New York fast-talk, giving you authentic language practice.' },
      { q: 'Do I need to be in America to chat with Americans?', a: 'Not at all! Users worldwide connect with Americans daily. Many use it to learn about American culture, sports, or just make friends across the ocean.' },
      { q: 'Are there many young people from the US using this?', a: 'Yes! We have a strong community of US college students, young professionals aged 18-35, especially from major cities like NYC, LA, Chicago, and Miami.' },
      { q: 'Is it safe to video chat with strangers from the United States?', a: 'Completely safe! All conversations are anonymous and encrypted. If anyone makes you uncomfortable, click "Next" instantly. Most American users are friendly and respectful.' }
    ],
    missionVision: {
      mission: 'To bridge the diverse communities across all 50 states, creating a digital melting pot where Americans and global citizens can connect freely. We believe in breaking down barriers between coastal and heartland America, urban and rural communities.',
      vision: 'To become America\'s #1 platform for authentic human connection, where you can meet someone from a small town in Montana or a penthouse in Manhattan with equal ease. We envision a community that represents the true diversity of the United States.',
      why: 'We\'re the only platform specifically optimized for connecting with Americans. Our free gender filters and location matching mean you can easily find American girls or American boys from your preferred region. Plus, our blockchain-based anonymity appeals to privacy-conscious Americans.'
    }
  },
  
  'united-kingdom': {
    faq: [
      { q: 'What\'s unique about chatting with British people?', a: 'British users are known for their wit, humor, and politeness. You\'ll experience authentic British banter, learn about tea culture, football passion, and get insights into life from London to Edinburgh.' },
      { q: 'When are most UK users active?', a: 'Peak times are 8-11 PM GMT during weekdays. Weekend afternoons (2-6 PM) are also very popular, especially on rainy British days!' },
      { q: 'Will I mostly meet people from London?', a: 'No! We have strong communities from Manchester, Birmingham, Glasgow, Liverpool, Bristol, and many smaller towns. You\'ll meet Brits from all corners of the UK.' },
      { q: 'Can I learn about British culture and slang?', a: 'Definitely! British users love sharing their culture, explaining slang like "chuffed," "knackered," or "proper." It\'s like having a personal guide to British English.' },
      { q: 'Do British users chat during work hours?', a: 'Some do during lunch breaks (12-1 PM GMT), but most activity happens in evenings and weekends when people are relaxing at home with a cuppa.' },
      { q: 'Are conversations with UK strangers safe?', a: 'Very safe! British users tend to be respectful and value privacy. All chats are anonymous and you can skip anyone instantly if needed.' }
    ],
    missionVision: {
      mission: 'To connect people across England, Scotland, Wales, and Northern Ireland, celebrating British diversity while welcoming international friends. We champion the British values of respect, humor, and genuine conversation.',
      vision: 'To create the UK\'s most trusted social platform where a Londoner can easily chat with someone from the Scottish Highlands, where international users can experience authentic British conversation, and where everyone feels welcome regardless of accent or background.',
      why: 'Unlike American-focused platforms, we understand British culture, slang, and social norms. Our late-night hours accommodate UK time zones, and our community reflects the true diversity of modern Britain from multicultural London to traditional countryside.'
    }
  },

  'canada': {
    faq: [
      { q: 'How friendly are Canadian users really?', a: 'Incredibly friendly! The Canadian hospitality stereotype is real. Expect warm welcomes, polite conversations, and genuine interest in getting to know you, eh?' },
      { q: 'Do most Canadian users speak English or French?', a: 'About 75% primarily speak English, 20% French (mostly from Quebec), and many are bilingual. It\'s a great way to practice either language!' },
      { q: 'What time are Canadians most active?', a: 'Peak hours vary by province: Eastern (8-11 PM EST), Central (7-10 PM CST), Mountain (6-9 PM MST), Pacific (7-10 PM PST). Weekends see all-day activity.' },
      { q: 'Can I meet people from specific Canadian cities?', a: 'Yes! We have active communities in Toronto, Montreal, Vancouver, Calgary, Ottawa, Edmonton, and many smaller cities across all provinces.' },
      { q: 'What topics do Canadian users like discussing?', a: 'Hockey, Tim Hortons coffee, winter survival stories, maple syrup, beautiful landscapes, multiculturalism, and friendly debates about which province is best!' },
      { q: 'Is it different chatting with Canadians vs Americans?', a: 'Canadians tend to be more reserved initially but warm up quickly. They\'re generally more internationally-minded and love discussing Canadian vs American differences!' }
    ],
    missionVision: {
      mission: 'To unite Canadians from coast to coast to coast - Atlantic, Pacific, and Arctic - while welcoming the world to experience Canadian warmth. We celebrate Canada\'s bilingual, multicultural identity and vast geographical diversity.',
      vision: 'To become Canada\'s go-to platform for meeting new people, where someone in Newfoundland can easily connect with a Vancouverite, where newcomers can practice English or French with friendly locals, and where the Canadian spirit of inclusivity thrives online.',
      why: 'We respect Canadian bilingualism with English and French support, understand the unique challenges of connecting across six time zones, and celebrate Canadian culture from poutine to politeness. Our platform reflects Canadian values of diversity and respect.'
    }
  },

  'australia': {
    faq: [
      { q: 'Are Aussies really as laid-back as they say?', a: 'G\'day mate! Yes! Australian users bring that relaxed, friendly attitude to every chat. Expect casual conversations, good humor, and a "no worries" vibe.' },
      { q: 'What time are Australians online?', a: 'Peak hours are 7-11 PM AEST/AEDT. Remember Australia is ahead of most countries, so their evening is your morning if you\'re in Europe or America!' },
      { q: 'Will I hear lots of Australian slang?', a: 'You betcha! Aussies love their slang. You\'ll hear "arvo" (afternoon), "servo" (gas station), "fair dinkum" (really), and many more. Just ask if confused!' },
      { q: 'Can I meet people from different Australian cities?', a: 'Absolutely! Strong communities from Sydney, Melbourne, Brisbane, Perth, Adelaide, and even smaller towns. Each city has its own unique culture.' },
      { q: 'Do Australians chat about dangerous animals a lot?', a: 'It\'s a common topic! Aussies have great stories about encountering spiders, snakes, and crocs. They love the stereotypes and will happily share wild tales!' },
      { q: 'Are Australian girls and boys friendly to international users?', a: 'Very! Aussies are famously welcoming to international visitors. They enjoy sharing their culture and learning about yours in return.' }
    ],
    missionVision: {
      mission: 'To connect Australians across this vast continent, from Sydney Harbor to the Outback, while sharing Aussie culture with the world. We believe in the Australian values of mateship, equality, and having a fair go.',
      vision: 'To be Australia\'s favorite way to meet new people, where city-dwellers and country folks connect easily, where international users experience authentic Australian culture, and where the friendly Aussie spirit makes everyone feel at home down under.',
      why: 'We understand Australian culture, time zones (AEST/AWST/ACST), and the unique experience of being "upside down" from the rest of the world. Our platform is optimized for Australian internet speeds and social norms.'
    }
  },

  'india': {
    faq: [
      { q: 'What languages do Indian users speak on the platform?', a: 'While most speak English or Hindi, you\'ll find users speaking Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, and many other languages. India\'s linguistic diversity is amazing!' },
      { q: 'When are Indian users most active?', a: 'Peak hours are 8-11 PM IST on weekdays. Sundays see high activity throughout the day as families relax at home.' },
      { q: 'Can I learn about different regions of India?', a: 'Definitely! Meet people from Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Kolkata, Pune, and countless other cities. Each region has unique culture, food, and traditions.' },
      { q: 'Are Indian users open to international friendships?', a: 'Extremely! Indians are very welcoming to international connections. Many want to practice English, share their culture, or learn about other countries.' },
      { q: 'What topics are popular with Indian users?', a: 'Cricket, Bollywood movies, food (especially spicy!), technology, education, startups, festivals like Diwali and Holi, family values, and travel dreams.' },
      { q: 'Is it respectful to discuss Indian culture and traditions?', a: 'Absolutely! Most Indian users love sharing their rich cultural heritage. Feel free to ask about festivals, food, customs, or regional differences - they\'re proud to explain!' }
    ],
    missionVision: {
      mission: 'To unite India\'s incredible diversity - from Kashmir to Kanyakumari, from bustling metros to peaceful villages. We celebrate India\'s 1.4 billion voices while connecting them to the world, honoring traditions while embracing modern technology.',
      vision: 'To become India\'s most trusted platform for meeting new people, where a Mumbaikar can easily connect with someone from a small Kerala village, where NRIs can stay connected to their roots, and where the world can experience India\'s warmth and diversity.',
      why: 'We understand India\'s unique needs: affordable data usage, multilingual support, respect for cultural values, and the importance of family-friendly interactions. Our platform bridges India\'s digital divide and celebrates its rich diversity.'
    }
  }
};

// CITY-SPECIFIC CONTENT
export const cityContent: Record<string, LocationContent> = {
  'new-york': {
    faq: [
      { q: 'What makes New Yorkers unique on Talk A Stranger?', a: 'NYers are fast-talking, direct, and genuine. Expect honest conversations, great stories about subway adventures, and insights into life in the city that never sleeps. No small talk - straight to real conversation!' },
      { q: 'When are most New Yorkers online?', a: 'Late nights! 10 PM - 2 AM EST is prime time. New Yorkers keep late hours. You\'ll also find people during lunch breaks (12-1 PM) and commute times (8-9 AM, 6-7 PM).' },
      { q: 'Will I mostly meet Manhattanites or people from all boroughs?', a: 'All five boroughs are represented! Queens, Brooklyn, Bronx, Staten Island, and Manhattan each have their own vibe. You\'ll experience NYC\'s true diversity.' },
      { q: 'Can I get real NYC advice and recommendations?', a: 'Absolutely! New Yorkers love sharing hidden gems, best pizza spots, subway tips, and which neighborhoods to explore. They\'re walking guidebooks!' },
      { q: 'Are New Yorkers really friendly despite the tough reputation?', a: 'Yes! While they seem tough, NYers are incredibly helpful and loyal once you connect. They appreciate authenticity and hate fakeness.' },
      { q: 'What do New York girls and boys like talking about?', a: 'Career ambitions, arts and culture, food scenes, surviving expensive rent, dating in NYC, favorite neighborhoods, and their love-hate relationship with the city.' }
    ],
    missionVision: {
      mission: 'To capture the electric energy of New York City in digital form - connecting ambitious dreamers, creative artists, hardworking immigrants, and native New Yorkers across all five boroughs. We celebrate NYC\'s unmatched diversity and unstoppable spirit.',
      vision: 'To become the heartbeat of New York\'s social scene, where a Wall Street banker can chat with a Brooklyn artist, where newcomers find their community, and where the essence of New York - ambition, diversity, and realness - thrives in every conversation.',
      why: 'We get New York\'s pace, diversity, and 24/7 lifestyle. Unlike generic platforms, we understand that NYers don\'t waste time, value authenticity, and want real connections in a city of 8 million. Our platform matches NYC\'s energy and hustle.'
    }
  },

  'london': {
    faq: [
      { q: 'What\'s it like chatting with Londoners?', a: 'Londoners are witty, culturally diverse, and surprisingly friendly. Expect intelligent conversations, dry British humor, and insights into one of the world\'s greatest cities. They\'re more open than their reserved reputation suggests!' },
      { q: 'When are London users most active?', a: 'Peak times are 8-11 PM GMT on weekdays. Lunch hours (12-2 PM) see activity from office workers. Weekends, especially Saturday evenings, are very busy.' },
      { q: 'Will I meet people from different parts of London?', a: 'Yes! From posh West London to trendy East London, from South London\'s diverse communities to North London\'s vibrant areas - the whole city is represented.' },
      { q: 'Can I learn about London\'s culture and hidden spots?', a: 'Definitely! Londoners know the best pubs, markets, parks, and cultural venues. They\'ll share recommendations that no guidebook mentions.' },
      { q: 'Is London really as expensive as people say?', a: 'Ask Londoners! They love discussing the cost of living, rent prices, and how they afford to live there. It\'s a common bonding topic!' },
      { q: 'What makes London girls and boys different from other UK users?', a: 'Londoners are more international, fast-paced, and career-focused. They\'re used to diversity and multiculturalism, making them open-minded and interesting to chat with.' }
    ],
    missionVision: {
      mission: 'To unite London\'s 9 million residents across 32 boroughs, celebrating the city\'s unparalleled diversity where over 300 languages are spoken. We bridge communities from the City to the suburbs, from longtime Londoners to fresh arrivals.',
      vision: 'To become London\'s digital social hub, where a Shoreditch creative can chat with a Canary Wharf banker, where newcomers find their tribe, and where London\'s cosmopolitan spirit - that unique blend of tradition and modernity - shines through every conversation.',
      why: 'We understand London\'s unique character: multicultural, fast-paced, expensive, but endlessly fascinating. Our platform reflects London\'s diversity, respects its pace, and caters to its cosmopolitan population better than any other chat platform.'
    }
  },

  'tokyo': {
    faq: [
      { q: 'Do Tokyo users speak English or Japanese?', a: 'Mixed! Many young Tokyoites speak some English and want to practice. Others prefer Japanese. You\'ll find both, and many are happy to teach you Japanese phrases!' },
      { q: 'What time are Tokyo users most active?', a: 'Peak hours are 8-11 PM JST on weekdays after work. Late nights (11 PM - 2 AM) are popular too, as Tokyo never sleeps. Weekend afternoons are busy.' },
      { q: 'What makes Tokyo users different?', a: 'Tokyoites are polite, tech-savvy, and curious about other cultures. They balance traditional Japanese values with ultra-modern city life. Expect thoughtful, respectful conversations.' },
      { q: 'Can I learn about Japanese culture and Tokyo life?', a: 'Absolutely! Tokyo users love sharing their culture, favorite spots, anime/manga recommendations, food culture, and what it\'s like living in the world\'s largest metro area.' },
      { q: 'Are Tokyo girls and boys friendly to foreigners?', a: 'Very! While initially polite and reserved, they warm up quickly. Many are curious about foreign perspectives and enjoy cultural exchange.' },
      { q: 'What topics do Tokyo users enjoy discussing?', a: 'Technology, anime and manga, food culture, fashion, work-life balance challenges, travel, language exchange, city life vs countryside, and seasonal festivals.' }
    ],
    missionVision: {
      mission: 'To connect Tokyo\'s 14 million residents across 23 special wards, bridging ancient traditions with cutting-edge technology. We celebrate Tokyo\'s unique blend of ultra-modern innovation and deep cultural heritage, making meaningful connections in the world\'s largest metro.',
      vision: 'To become Tokyo\'s trusted platform for authentic connection in a city known for loneliness despite its density. We envision helping Tokyoites overcome shyness, practice languages, and find genuine friendships in this fascinating megalopolis.',
      why: 'We understand Tokyo\'s unique culture: the importance of politeness, the desire for anonymity, the need for language support, and the loneliness epidemic in big cities. Our platform respects Japanese social norms while encouraging authentic connection.'
    }
  }
};

// AREA-SPECIFIC CONTENT
export const areaContent: Record<string, LocationContent> = {
  'california': {
    faq: [
      { q: 'What makes California users special?', a: 'Californians are laid-back, health-conscious, and diverse. From tech entrepreneurs in Silicon Valley to surfers in San Diego, Hollywood actors to wine makers in Napa - California represents every lifestyle imaginable!' },
      { q: 'When are Californians most active?', a: 'Peak PST hours are 8-11 PM. Late nights are popular (California nightlife culture). Weekends see high activity as people enjoy the famous California weather.' },
      { q: 'Will I meet people from different parts of California?', a: 'Yes! NorCal (SF Bay, Sacramento), Central Coast (Monterey, SLO), Southern California (LA, San Diego, OC), and even rural areas. Each region has distinct personality!' },
      { q: 'Can I learn about California lifestyle and culture?', a: 'Absolutely! Californians love sharing about beach culture, food scenes, tech industry, entertainment, outdoor activities, and the famous California dream mindset.' },
      { q: 'Do California girls and boys have different vibes than East Coast?', a: 'Definitely! Generally more relaxed, health-conscious, and environmentally aware. Less aggressive than NYC, more outdoor-focused. "West Coast, Best Coast" mentality!' },
      { q: 'What topics do Californians enjoy discussing?', a: 'Tech startups, surfing and beaches, healthy living, entertainment industry, cost of living, earthquakes, perfect weather, traffic complaints, and environmental issues.' }
    ],
    missionVision: {
      mission: 'To unite California\'s 40 million residents across 163,696 square miles - from Redwood forests to SoCal beaches, from Silicon Valley to Central Valley farms. We celebrate the California spirit: innovation, diversity, and dreaming big.',
      vision: 'To become California\'s premier platform for meeting people across this diverse state, where a San Francisco tech worker can chat with a San Diego surfer, where NorCal and SoCal differences are celebrated, and where the California lifestyle attracts global interest.',
      why: 'We understand California\'s unique culture: the tech industry, entertainment world, outdoor lifestyle, progressive values, and high cost of living. Our platform reflects California\'s innovation, diversity, and forward-thinking spirit better than generic alternatives.'
    }
  },

  'texas': {
    faq: [
      { q: 'Are Texans really as friendly as the stereotype?', a: 'Absolutely! Texas hospitality is real. Expect warm welcomes, "y\'all" in every sentence, and genuine friendliness. Texans are proud of their state and love sharing what makes it special!' },
      { q: 'When are most Texans online?', a: 'Peak CST hours are 7-10 PM. Friday Night Lights (football nights) see high activity. Weekends are busy, especially Sunday afternoons after church and football.' },
      { q: 'Will I meet people from different Texas cities?', a: 'Yes! Major metros (Houston, Dallas, San Antonio, Austin, Fort Worth, El Paso) plus smaller towns. Each city has unique culture - Houston\'s diversity, Austin\'s weirdness, Dallas\'s sophistication!' },
      { q: 'What do Texans love talking about?', a: 'BBQ and Tex-Mex, Friday Night Football, cowboy culture, Texas pride, oil industry, southern hospitality, guns and freedom, the Alamo, and why Texas is the best state!' },
      { q: 'Can I learn about real Texas culture beyond the cowboy stereotype?', a: 'Definitely! While some cowboy culture exists, modern Texas is diverse, high-tech, multicultural, and cosmopolitan. You\'ll learn the real, complex Texas story.' },
      { q: 'Are Texas girls and boys more conservative than other states?', a: 'Texas is diverse! Big cities are quite liberal (especially Austin), while rural areas are more traditional. You\'ll meet all perspectives and can discuss everything respectfully.' }
    ],
    missionVision: {
      mission: 'To connect Texans across the Lone Star State\'s 268,596 square miles - from Dallas skyscrapers to West Texas deserts, from Houston\'s diversity to Austin\'s creativity. We celebrate Texas values: independence, hospitality, and pride.',
      vision: 'To become Texas\'s favorite platform for meeting new people, where urban and rural Texans connect easily, where newcomers discover what makes Texas special, and where Texas hospitality extends into the digital world.',
      why: 'We understand Texas culture: the pride, the scale, the diversity, and the unique Texas identity. Unlike generic platforms, we respect Texas values while celebrating its surprising diversity and modern dynamism.'
    }
  }
};

// Helper function to get content for any location
export function getLocationContent(slug: string, type: 'country' | 'city' | 'area'): LocationContent | null {
  const contentMap = {
    country: countryContent,
    city: cityContent,
    area: areaContent
  };
  
  return contentMap[type][slug] || null;
}
