/* ==========================================================================
   Fernhill Realty: listings.js
   All the sample content lives here. Replace it with your own homes.

   Each listing:
     id          short, lowercase, hyphens only (it becomes the link: #home-<id>)
     status      'sale' or 'rent'
     price       a number (rent is per month)
     was         optional: the old price, shows "Price drop"
     hood        one of the ids in HOODS below
     x, y        where the pin goes on the map (0 to 1000, 0 to 760)
     daysOn      days on the market (5 or fewer shows "New")
     open        optional open house: { dow: 6, from: '1:00 PM', to: '3:00 PM' } (0 is Sunday)
     photo       optional: path to a real photo, e.g. 'photos/larkspur-1.jpg'
     photos      optional: up to three photos [front, evening, street], e.g. ['photos/a.jpg', 'photos/b.jpg', 'photos/c.jpg']
     art         the drawing used when there is no photo (see art.js)
   ========================================================================== */
window.FH = {
  HOODS: [
    { id: 'maple-ridge', name: 'Maple Ridge', blurb: 'Wide lots, quiet cul-de-sacs and the best-rated schools in town.', perSqft: 285, walk: 3, art: { style: 'gable', seed: 7, time: 'day', colors: { wall: '#e9e2c4', roof: '#4c5c2d' }, garage: true, shutters: true } },
    { id: 'riverbend', name: 'Riverbend', blurb: 'Townhomes along the river path, ten minutes from downtown on foot.', perSqft: 340, walk: 4, art: { style: 'townhouse', seed: 14, time: 'mist', units: 3, colors: { units: ['#8e9a6c', '#e4dcc0', '#6f7d52'], roof: '#313e17' } } },
    { id: 'old-mill', name: 'Old Mill District', blurb: 'Brick lofts and corner cafes in the old foundry and mill buildings.', perSqft: 395, walk: 5, art: { style: 'loft', seed: 21, time: 'dusk', colors: { wall: '#9b5a42', trim: '#e9e0c4', door: '#1b0c0c' } } },
    { id: 'cedar-hollow', name: 'Cedar Hollow', blurb: 'Bungalows and cottages tucked against the forest trails.', perSqft: 255, walk: 2, art: { style: 'cottage', seed: 5, time: 'day', colors: { wall: '#d8c9a0', roof: '#5b4030', door: '#4c5c2d' } } },
    { id: 'harbour-point', name: 'Harbour Point', blurb: 'Glass towers and waterfront condos with marina views.', perSqft: 470, walk: 5, art: { style: 'tower', seed: 31, time: 'dusk', colors: { wall: '#4c5c2d', accent: '#313e17', trim: '#d9d3b4' } } },
    { id: 'northgate', name: 'Northgate', blurb: 'New-build townhomes and starter homes close to the commuter line.', perSqft: 265, walk: 3, art: { style: 'townhouse', seed: 44, time: 'day', flat: true, units: 3, colors: { units: ['#e7e3d4', '#3a3a32', '#e7e3d4'], roof: '#1b1a16' } } }
  ],

  AGENTS: [
    { id: 'maya', name: 'Maya Okafor', role: 'Buyer agent', areas: 'Maple Ridge, Northgate', phone: '(555) 010-0181', email: 'maya@fernhillrealty.example', tone: 0 },
    { id: 'daniel', name: 'Daniel Brooks', role: 'Waterfront and condos', areas: 'Harbour Point, Old Mill District', phone: '(555) 010-0182', email: 'daniel@fernhillrealty.example', tone: 1 },
    { id: 'priya', name: 'Priya Raman', role: 'Rentals and investors', areas: 'Old Mill District, Riverbend', phone: '(555) 010-0183', email: 'priya@fernhillrealty.example', tone: 2 },
    { id: 'tom', name: 'Tom Beaumont', role: 'Seller agent', areas: 'Cedar Hollow, first-time buyers', phone: '(555) 010-0184', email: 'tom@fernhillrealty.example', tone: 3 }
  ],

  LISTINGS: [
    { id: 'larkspur-14', status: 'sale', price: 689000, hood: 'maple-ridge', address: '14 Larkspur Lane', type: 'House', beds: 4, baths: 3, sqft: 2480, lot: '0.18 acre', year: 2016, parking: '2-car garage', tax: 4380, hoa: 0, daysOn: 3, agent: 'maya', x: 240, y: 262,
      desc: 'A bright two-storey home on a quiet lane, with a big kitchen that opens onto a fenced back garden. The primary suite has a walk-in closet and a soaking tub, and the finished basement makes a good rec room or home office.',
      features: ['Fenced back garden', 'Finished basement', 'Walk-in closet', 'Heated garage', 'Near two schools'],
      art: { style: 'gable', seed: 3, colors: { wall: '#e9e2c4', trim: '#fbf8ea', roof: '#4c5c2d', door: '#313e17' }, garage: true, shutters: true } },
    { id: 'millrace-4b', status: 'sale', price: 412000, hood: 'old-mill', address: '208 Millrace Street #4B', type: 'Loft condo', beds: 2, baths: 2, sqft: 1180, lot: '', year: 1912, parking: '1 underground stall', tax: 2890, hoa: 410, daysOn: 9, open: { dow: 6, from: '1:00 PM', to: '3:00 PM' }, agent: 'daniel', x: 545, y: 352,
      desc: 'A top-floor loft in a restored 1912 mill, with exposed brick, 12-foot ceilings and arched windows facing the courtyard. The cafe downstairs opens at seven.',
      features: ['Exposed brick', '12-foot ceilings', 'In-suite laundry', 'Storage locker', 'Bike room'],
      art: { style: 'loft', seed: 8, colors: { wall: '#9b5a42', trim: '#e9e0c4', door: '#1b0c0c' } } },
    { id: 'heron-1802', status: 'sale', price: 879000, was: 925000, hood: 'harbour-point', address: '9 Heron Point Drive #1802', type: 'Condo', beds: 2, baths: 2, sqft: 1340, lot: '', year: 2019, parking: '2 underground stalls', tax: 5120, hoa: 612, daysOn: 21, agent: 'daniel', x: 780, y: 525,
      desc: 'A corner suite on the 18th floor with floor-to-ceiling glass and a long balcony over the marina. The building has a gym, a guest suite and a rooftop terrace.',
      features: ['Marina views', 'Floor-to-ceiling windows', 'Gym and terrace', 'Concierge', 'Two parking stalls'],
      art: { style: 'tower', seed: 12, time: 'dusk', colors: { wall: '#4c5c2d', accent: '#313e17', trim: '#d9d3b4' } } },
    { id: 'cedar-62', status: 'sale', price: 449900, hood: 'cedar-hollow', address: '62 Cedar Hollow Road', type: 'Cottage', beds: 3, baths: 2, sqft: 1560, lot: '0.3 acre', year: 1978, parking: 'Driveway, 3 cars', tax: 3050, hoa: 0, daysOn: 12, agent: 'tom', x: 196, y: 618,
      desc: 'A renovated cottage with a stone fireplace and a sunroom that looks out on the trees. The yard backs onto the Cedar Hollow trail network.',
      features: ['Stone fireplace', 'Sunroom', 'Backs onto trails', 'New roof (2022)', 'Garden shed'],
      art: { style: 'cottage', seed: 6, colors: { wall: '#d8c9a0', roof: '#5b4030', door: '#4c5c2d', brick: '#8a8068' } } },
    { id: 'rivermist-31', status: 'sale', price: 539000, hood: 'riverbend', address: '31 Rivermist Court', type: 'Townhouse', beds: 3, baths: 3, sqft: 1720, lot: '', year: 2012, parking: 'Attached garage', tax: 3620, hoa: 285, daysOn: 6, agent: 'priya', x: 330, y: 424,
      desc: 'An end-unit townhome steps from the river path, with a south-facing patio and a third-floor bonus room. Low monthly fees cover snow clearing and landscaping.',
      features: ['End unit', 'South-facing patio', 'Bonus room', 'Steps from river path', 'Pet friendly'],
      art: { style: 'townhouse', seed: 15, time: 'mist', units: 3, colors: { units: ['#e9e2c4', '#b9c58f', '#d7cfa8'], roof: '#4c5c2d' } } },
    { id: 'northgate-77', status: 'sale', price: 469000, hood: 'northgate', address: '77 Northgate Crescent', type: 'Townhouse', beds: 3, baths: 3, sqft: 1590, lot: '', year: 2024, parking: 'Attached garage', tax: 2790, hoa: 190, daysOn: 2, agent: 'maya', x: 724, y: 198,
      desc: 'A new-build townhome with a quartz kitchen, triple-pane windows and a rooftop deck. Still under the builder warranty, and a five-minute walk to the commuter train.',
      features: ['New build (2024)', 'Rooftop deck', 'Quartz kitchen', 'Builder warranty', 'Near commuter train'],
      art: { style: 'townhouse', seed: 45, time: 'dusk', flat: true, units: 3, colors: { units: ['#e7e3d4', '#3a3a32', '#e7e3d4'], roof: '#1b1a16', door: '#8a5a2b' } } },
    { id: 'wren-5', status: 'sale', price: 519000, hood: 'cedar-hollow', address: '5 Wren Hollow Way', type: 'Bungalow', beds: 3, baths: 2, sqft: 1710, lot: '0.22 acre', year: 1994, parking: 'Double garage', tax: 3340, hoa: 0, daysOn: 17, agent: 'tom', x: 118, y: 566,
      desc: 'A single-level bungalow with a wide front porch, an open kitchen and a heated double garage. Everything you need is on one floor, with a bright walk-out basement below.',
      features: ['One-level living', 'Wide front porch', 'Walk-out basement', 'Heated double garage', 'Mature trees'],
      art: { style: 'bungalow', seed: 9, colors: { wall: '#c9d2a4', trim: '#f7f3e4', roof: '#5a4a38', door: '#9a4a2e' } } },
    { id: 'quarry-120', status: 'sale', price: 1195000, hood: 'maple-ridge', address: '120 Quarry Lane', type: 'House', beds: 5, baths: 4, sqft: 3650, lot: '0.25 acre', year: 2021, parking: '3-car garage', tax: 7420, hoa: 0, daysOn: 8, open: { dow: 6, from: '1:00 PM', to: '3:00 PM' }, agent: 'maya', x: 334, y: 224,
      desc: 'An architect-designed home in cedar and glass, with a double-height living room, a chef kitchen and a covered terrace with an outdoor fireplace. Radiant heat runs throughout.',
      features: ['Double-height living room', 'Radiant floor heat', 'Covered terrace', 'EV charger', 'Home office'],
      art: { style: 'modern', seed: 17, colors: { wall: '#ece8d8', accent: '#4a3a2a', roof: '#1b1a16', door: '#8a5a2b' } } },
    { id: 'tidewater-305', status: 'rent', price: 2850, hood: 'harbour-point', address: '18 Tidewater Quay #305', type: 'Condo', beds: 1, baths: 1, sqft: 780, lot: '', year: 2018, parking: '1 underground stall', tax: 0, hoa: 0, daysOn: 4, agent: 'daniel', x: 882, y: 522,
      desc: 'A furnished-optional one-bedroom on the boardwalk with a balcony and a view of the boats. Water, heat and parking are included in the rent.',
      features: ['Furnished optional', 'Water and heat included', 'Balcony', 'Gym access', 'Parking included'],
      art: { style: 'tower', seed: 33, time: 'day', colors: { wall: '#59693a', accent: '#2c3a1c', trim: '#e9e3c6' } } },
    { id: 'foundry-12', status: 'rent', price: 2350, hood: 'old-mill', address: '403 Foundry Row #12', type: 'Loft', beds: 1, baths: 1, sqft: 890, lot: '', year: 1924, parking: 'Street permit', tax: 0, hoa: 0, daysOn: 7, agent: 'priya', x: 604, y: 424,
      desc: 'A sunny one-bedroom loft with original timber beams and tall factory windows. Cats and small dogs are welcome, and the laundry room is on the same floor.',
      features: ['Pet friendly', 'Timber beams', 'Laundry on floor', 'Bike storage', 'Walk to cafes'],
      art: { style: 'loft', seed: 27, time: 'mist', arch: false, tank: false, colors: { wall: '#7d5442', trim: '#e9e0c4', door: '#313e17' } } },
    { id: 'brookfield-44', status: 'rent', price: 3100, hood: 'riverbend', address: '44 Brookfield Terrace', type: 'Townhouse', beds: 3, baths: 2, sqft: 1480, lot: '', year: 2009, parking: 'Garage and driveway', tax: 0, hoa: 0, daysOn: 11, agent: 'priya', x: 404, y: 392,
      desc: 'A three-bedroom townhome with a fenced yard and a finished lower level. A short walk to the river path and the Riverbend market.',
      features: ['Fenced yard', 'Finished lower level', 'Garage', 'Pet friendly', 'Near river path'],
      art: { style: 'townhouse', seed: 16, time: 'day', units: 3, colors: { units: ['#8e9a6c', '#e4dcc0', '#6f7d52'], roof: '#313e17' } } },
    { id: 'sapling-210', status: 'sale', price: 389000, hood: 'northgate', address: '210 Sapling Street', type: 'House', beds: 2, baths: 1, sqft: 1040, lot: '0.12 acre', year: 1986, parking: 'Single garage', tax: 2480, hoa: 0, daysOn: 14, agent: 'tom', x: 792, y: 238,
      desc: 'A tidy starter home with a new kitchen, fresh paint and a sunny yard ready for a garden. A good first step into the neighbourhood.',
      features: ['New kitchen (2023)', 'Fresh paint', 'Sunny yard', 'Single garage', 'Close to transit'],
      art: { style: 'bungalow', seed: 24, colors: { wall: '#d9c79a', trim: '#f7f3e4', roof: '#6b5a45', door: '#4c5c2d' } } },
    { id: 'orchard-2', status: 'sale', price: 949000, was: 989000, hood: 'maple-ridge', address: '2 Orchard Gate', type: 'House', beds: 5, baths: 4, sqft: 3120, lot: '0.4 acre', year: 2008, parking: '3-car garage', tax: 6180, hoa: 0, daysOn: 26, open: { dow: 0, from: '2:00 PM', to: '4:00 PM' }, agent: 'maya', x: 158, y: 304,
      desc: 'A farmhouse-style home on a corner lot with a wraparound porch, a mudroom and a kitchen made for gatherings. The back garden has a vegetable patch and a small orchard.',
      features: ['Wraparound porch', 'Corner lot', 'Mudroom', 'Apple and pear trees', 'Main-floor office'],
      art: { style: 'farmhouse', seed: 19, colors: { wall: '#f3f0e4', trim: '#ffffff', roof: '#34382a', door: '#4c5c2d' } } },
    { id: 'mallard-11', status: 'sale', price: 624000, hood: 'riverbend', address: '11 Mallard Row', type: 'Duplex', beds: 3, baths: 2, sqft: 1840, lot: '', year: 2020, parking: 'Garage', tax: 3910, hoa: 0, daysOn: 5, agent: 'priya', x: 262, y: 396,
      desc: 'One side of a modern duplex with no shared interior walls above the foundation, a sunny corner kitchen and a private yard. Walk to the river path in two minutes.',
      features: ['Modern duplex', 'Private yard', 'Garage', 'Two minutes to river path', 'Energy efficient'],
      art: { style: 'townhouse', seed: 28, time: 'day', flat: true, units: 2, colors: { units: ['#d6d1bd', '#4a3a2a'], roof: '#1b1a16', door: '#8a5a2b' } } },
    { id: 'fern-ridge', status: 'sale', price: 579000, hood: 'cedar-hollow', address: '28 Fern Ridge Trail', type: 'Cabin', beds: 3, baths: 2, sqft: 1890, lot: '0.6 acre', year: 2003, parking: 'Driveway, 4 cars', tax: 3480, hoa: 0, daysOn: 19, agent: 'tom', x: 292, y: 598,
      desc: 'A log-style cabin on over half an acre, with vaulted ceilings, a wood stove and a deep porch for slow mornings. Quiet, private and still close to town.',
      features: ['Vaulted ceilings', 'Wood stove', 'Deep porch', '0.6 acre lot', 'Hot tub hookup'],
      art: { style: 'cottage', seed: 36, time: 'mist', logs: true, porch: true, colors: { wall: '#8c6a45', roof: '#2e2a1c', door: '#313e17', trim: '#e9dfc0' } } },
    { id: 'millrace-row-9', status: 'sale', price: 635000, hood: 'old-mill', address: '9 Millrace Row', type: 'Row house', beds: 3, baths: 2, sqft: 1760, lot: '', year: 1928, parking: 'Rear laneway pad', tax: 4010, hoa: 0, daysOn: 10, agent: 'daniel', x: 452, y: 340,
      desc: 'A restored 1928 brick row house with original hardwood, a new kitchen and a south-facing laneway garden. The street is lined with mature maples.',
      features: ['Original hardwood', 'Restored brick', 'New kitchen', 'Laneway garden', 'Walk to everything'],
      art: { style: 'townhouse', seed: 38, time: 'day', units: 3, colors: { units: ['#a2593f', '#c8b48a', '#7d8a5a'], roof: '#313e17' } } }
  ]
};
