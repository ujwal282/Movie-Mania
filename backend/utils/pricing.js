/**
 * Dynamic Pricing Algorithm
 * Calculates ticket price based on multiple factors:
 * - Seat type (VIP vs Regular)
 * - Weekend booking (+20%)
 * - Peak/popular showtime hours (+15% if showtime is >= 5:00 PM / 17:00)
 * - Low seat availability (+10% if remaining seats < 20%)
 * 
 * Formula:
 * finalPrice = basePrice * seatTypeMultiplier * weekendMultiplier * popularityMultiplier * demandMultiplier
 */

const calculateDynamicPrice = ({
  basePrice,
  seatType = 'Regular',
  dateTime,
  popularityMultiplier = 1.0,
  totalSeatsCount = 80,
  bookedSeatsCount = 0
}) => {
  const showDate = new Date(dateTime);
  
  // 1. Seat Type Multiplier
  const seatTypeMultiplier = seatType.toUpperCase() === 'VIP' ? 1.5 : 1.0;

  // 2. Weekend Multiplier (+20% for Friday, Saturday, Sunday)
  // JS getDay(): 0 = Sunday, 5 = Friday, 6 = Saturday
  const day = showDate.getDay();
  const isWeekend = day === 0 || day === 5 || day === 6;
  const weekendMultiplier = isWeekend ? 1.2 : 1.0;

  // 3. Peak Hour Multiplier (+15% if showtime is >= 17:00 / 5 PM)
  const hour = showDate.getHours();
  const isPeakHour = hour >= 17;
  const hourMultiplier = isPeakHour ? 1.15 : 1.0;

  // 4. Combine base popularity multiplier with hour multiplier
  const finalPopularityMultiplier = popularityMultiplier * hourMultiplier;

  // 5. Demand Multiplier (+10% if availability is under 20%)
  const availableSeats = totalSeatsCount - bookedSeatsCount;
  const occupancyRate = totalSeatsCount > 0 ? (availableSeats / totalSeatsCount) : 1.0;
  const isLowAvailability = occupancyRate < 0.20;
  const demandMultiplier = isLowAvailability ? 1.1 : 1.0;

  // 6. Calculate final price
  const rawPrice = basePrice * seatTypeMultiplier * weekendMultiplier * finalPopularityMultiplier * demandMultiplier;
  
  // Round to nearest integer for NRS currency
  const finalPrice = Math.round(rawPrice);

  return {
    basePrice,
    seatType,
    isWeekend,
    isPeakHour,
    isLowAvailability,
    seatTypeMultiplier,
    weekendMultiplier,
    popularityMultiplier: finalPopularityMultiplier,
    demandMultiplier,
    finalPrice
  };
};

module.exports = { calculateDynamicPrice };
