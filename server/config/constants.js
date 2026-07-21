// All 32 State and Union Territory Capital Cities of India with exact coordinates
const CITIES = [
  { name: 'Mumbai',             query: 'Mumbai',             lat: 19.0760, lng: 72.8777 },
  { name: 'Delhi',              query: 'Delhi',              lat: 28.6139, lng: 77.2090 },
  { name: 'Bengaluru',          query: 'Bengaluru',          lat: 12.9716, lng: 77.5946 },
  { name: 'Chennai',            query: 'Chennai',            lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata',            query: 'Kolkata',            lat: 22.5726, lng: 88.3639 },
  { name: 'Hyderabad',          query: 'Hyderabad',          lat: 17.3850, lng: 78.4867 },
  { name: 'Ahmedabad',          query: 'Ahmedabad',          lat: 23.0225, lng: 72.5714 },
  { name: 'Jaipur',             query: 'Jaipur',             lat: 26.9124, lng: 75.7873 },
  { name: 'Lucknow',            query: 'Lucknow',            lat: 26.8467, lng: 80.9462 },
  { name: 'Chandigarh',         query: 'Chandigarh',         lat: 30.7333, lng: 76.7794 },
  { name: 'Patna',              query: 'Patna',              lat: 25.5941, lng: 85.1376 },
  { name: 'Bhubaneswar',        query: 'Bhubaneswar',        lat: 20.2961, lng: 85.8245 },
  { name: 'Thiruvananthapuram', query: 'Thiruvananthapuram', lat: 8.5241,  lng: 76.9366 },
  { name: 'Bhopal',             query: 'Bhopal',             lat: 23.2599, lng: 77.4126 },
  { name: 'Visakhapatnam',      query: 'Visakhapatnam',      lat: 17.6868, lng: 83.2185 },
  { name: 'Guwahati',           query: 'Guwahati',           lat: 26.1445, lng: 91.7362 },
  { name: 'Ranchi',             query: 'Ranchi',             lat: 23.3441, lng: 85.3096 },
  { name: 'Raipur',             query: 'Raipur',             lat: 21.2514, lng: 81.6296 },
  { name: 'Dehradun',           query: 'Dehradun',           lat: 30.3165, lng: 78.0322 },
  { name: 'Shimla',             query: 'Shimla',             lat: 31.1048, lng: 77.1734 },
  { name: 'Srinagar',           query: 'Srinagar',           lat: 34.0837, lng: 74.7973 },
  { name: 'Panaji',             query: 'Panaji',             lat: 15.4909, lng: 73.8278 },
  { name: 'Leh',                query: 'Leh',                lat: 34.1526, lng: 77.5771 },
  { name: 'Puducherry',         query: 'Puducherry',         lat: 11.9416, lng: 79.8083 },
  { name: 'Agartala',           query: 'Agartala',           lat: 23.8315, lng: 91.2868 },
  { name: 'Shillong',           query: 'Shillong',           lat: 25.5788, lng: 91.8933 },
  { name: 'Imphal',             query: 'Imphal',             lat: 24.8170, lng: 93.9368 },
  { name: 'Kohima',             query: 'Kohima',             lat: 25.6751, lng: 94.1086 },
  { name: 'Aizawl',             query: 'Aizawl',             lat: 23.7271, lng: 92.7176 },
  { name: 'Itanagar',           query: 'Itanagar',           lat: 27.0844, lng: 93.6053 },
  { name: 'Gangtok',            query: 'Gangtok',            lat: 27.3389, lng: 88.6065 },
  { name: 'Pune',               query: 'Pune',               lat: 18.5204, lng: 73.8567 },
];

const BASE_AQIS = {
  Mumbai: 145, Delhi: 240, Bengaluru: 95, Chennai: 112, Kolkata: 168, Pune: 130,
  Hyderabad: 115, Ahmedabad: 155, Jaipur: 160, Lucknow: 195, Chandigarh: 120,
  Patna: 220, Bhubaneswar: 125, Thiruvananthapuram: 65, Bhopal: 135, Visakhapatnam: 110,
  Guwahati: 140, Ranchi: 130, Raipur: 150, Dehradun: 105, Shimla: 45, Srinagar: 85,
  Panaji: 55, Leh: 35, Puducherry: 75, Agartala: 110, Shillong: 40, Imphal: 60,
  Kohima: 50, Aizawl: 30, Itanagar: 45, Gangtok: 35
};

const CITY_WARDS = {
  Mumbai: [
    { ward: 'Andheri', lat: 19.1136, lng: 72.8697, base: 145 },
    { ward: 'Bandra',  lat: 19.0540, lng: 72.8409, base: 138 },
    { ward: 'Kurla',   lat: 19.0726, lng: 72.8843, base: 165 },
    { ward: 'Dharavi', lat: 19.0374, lng: 72.8545, base: 185 },
    { ward: 'Worli',   lat: 19.0139, lng: 72.8169, base: 132 },
    { ward: 'Malad',   lat: 19.1872, lng: 72.8484, base: 140 },
    { ward: 'Powai',   lat: 19.1197, lng: 72.9058, base: 128 },
    { ward: 'Thane',   lat: 19.2183, lng: 72.9781, base: 135 },
  ],
  Chennai: [
    { ward: 'Manali',     lat: 13.1667, lng: 80.2642, base: 188 },
    { ward: 'Velachery',  lat: 12.9759, lng: 80.2206, base: 135 },
    { ward: 'Guindy',     lat: 13.0067, lng: 80.2070, base: 142 },
    { ward: 'T. Nagar',   lat: 13.0418, lng: 80.2341, base: 125 },
    { ward: 'Royapuram',  lat: 13.1098, lng: 80.2936, base: 160 },
    { ward: 'Adyar',      lat: 13.0012, lng: 80.2565, base: 110 },
  ],
  Delhi: [
    { ward: 'Anand Vihar',   lat: 28.6469, lng: 77.3158, base: 310 },
    { ward: 'Okhla',         lat: 28.5355, lng: 77.2667, base: 265 },
    { ward: 'Punjabi Bagh',  lat: 28.6679, lng: 77.1259, base: 240 },
    { ward: 'RK Puram',      lat: 28.5654, lng: 77.1746, base: 220 },
    { ward: 'Dwarka',        lat: 28.5823, lng: 77.0544, base: 195 },
    { ward: 'Rohini',        lat: 28.7326, lng: 77.1189, base: 230 },
  ],
  Bengaluru: [
    { ward: 'Peenya',         lat: 13.0285, lng: 77.5186, base: 162 },
    { ward: 'Silk Board',     lat: 12.9172, lng: 77.6244, base: 148 },
    { ward: 'Whitefield',     lat: 12.9698, lng: 77.7499, base: 115 },
    { ward: 'Electronic City',lat: 12.8452, lng: 77.6762, base: 98  },
    { ward: 'Indiranagar',    lat: 12.9784, lng: 77.6408, base: 85  },
    { ward: 'Jayanagar',      lat: 12.9250, lng: 77.5938, base: 78  },
  ],
};

function getCategory(aqi) {
  if (aqi <= 50)  return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
}

function getBaseAQI(city) {
  return BASE_AQIS[city] || 125;
}

module.exports = {
  CITIES,
  BASE_AQIS,
  CITY_WARDS,
  getCategory,
  getBaseAQI,
};
