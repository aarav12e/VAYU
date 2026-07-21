export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export const CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Kolkata', 'Hyderabad',
  'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh', 'Patna', 'Bhubaneswar',
  'Thiruvananthapuram', 'Bhopal', 'Visakhapatnam', 'Guwahati', 'Ranchi',
  'Raipur', 'Dehradun', 'Shimla', 'Srinagar', 'Panaji', 'Leh', 'Puducherry',
  'Agartala', 'Shillong', 'Imphal', 'Kohima', 'Aizawl', 'Itanagar', 'Gangtok', 'Pune'
];

export const AQI_COLOR_MAP = {
  Good: '#00e676',
  Satisfactory: '#76ff03',
  Moderate: '#ffea00',
  Poor: '#ff6d00',
  'Very Poor': '#d50000',
  Severe: '#9c27b0',
};
