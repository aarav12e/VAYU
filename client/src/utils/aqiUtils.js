export function getAQIColor(aqi) {
  if (!aqi) return '#7ea8c0';
  if (aqi <= 50) return '#00e676';
  if (aqi <= 100) return '#76ff03';
  if (aqi <= 200) return '#ffea00';
  if (aqi <= 300) return '#ff6d00';
  if (aqi <= 400) return '#d50000';
  return '#6a0080';
}

export function getAQICategory(aqi) {
  if (!aqi) return 'Unknown';
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
}

export function getAQIBgColor(aqi) {
  const color = getAQIColor(aqi);
  return `${color}22`;
}

export function getCategoryClass(category) {
  if (!category) return 'aqi-moderate';
  const map = {
    'Good': 'aqi-good',
    'Satisfactory': 'aqi-satisfactory',
    'Moderate': 'aqi-moderate',
    'Poor': 'aqi-poor',
    'Very Poor': 'aqi-verypoor',
    'Severe': 'aqi-severe',
  };
  return map[category] || 'aqi-moderate';
}
