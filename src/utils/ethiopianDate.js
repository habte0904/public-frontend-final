// Utility for Ethiopian (Amharic) <-> Gregorian conversions and formatting
// Implementation uses Julian Day Number (JDN) intermediary.
// Based on common epoch used by Ethiopic calendar conversions.

// The earlier JDN-based implementation caused off-by-one year issues at
// boundary dates; use a Meskerem1 (Ethiopian new year) based conversion that
// follows the standard rule used in practice:
// Meskerem 1 usually falls on Sep 11 (Gregorian), but on Sep 12 in years
// preceding a Gregorian leap year.

function isGregorianLeap(y) {
  return (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0));
}

// Public helpers
function gregorianToEthiopian(gDate) {
  if (!(gDate instanceof Date)) gDate = new Date(gDate);
  const gY = gDate.getFullYear();
  const gM = gDate.getMonth() + 1; // 1..12
  const gD = gDate.getDate();

  // Choose the likely Ethiopian year based on whether the Gregorian date
  // is on/after Meskerem 1 (Sep 11 or Sep 12 depending on leap rules)
  let ethYear = (gM > 9 || (gM === 9 && gD >= 11)) ? gY - 7 : gY - 8;

  // Compute Meskerem1 for the candidate Ethiopian year
  const candidateGregorian = ethYear + 7;
  const meskeremDay = isGregorianLeap(candidateGregorian + 1) ? 12 : 11;
  const meskeremDate = new Date(candidateGregorian, 8, meskeremDay);

  // If the given Gregorian date is before Meskerem1, shift to previous Ethiopic year
  if (gDate < meskeremDate) ethYear -= 1;

  // Fresh meskerem start
  const gYearForMes = ethYear + 7;
  const meskeremDayFinal = isGregorianLeap(gYearForMes + 1) ? 12 : 11;
  const meskeremStart = new Date(gYearForMes, 8, meskeremDayFinal);

  const msDiff = new Date(gDate.getFullYear(), gDate.getMonth(), gDate.getDate()).getTime() -
    new Date(meskeremStart.getFullYear(), meskeremStart.getMonth(), meskeremStart.getDate()).getTime();
  const diffDays = Math.floor(msDiff / (24 * 60 * 60 * 1000));

  const month = Math.floor(diffDays / 30) + 1;
  const day = (diffDays % 30) + 1;

  return { year: ethYear, month, day };
}

function ethiopianToGregorian(eYear, eMonth, eDay) {
  const gYear = Number(eYear) + 7; // Gregorian year containing Meskerem1
  const meskerem = isGregorianLeap(gYear + 1) ? 12 : 11;
  const start = new Date(gYear, 8, meskerem);

  const offset = (Number(eMonth) - 1) * 30 + (Number(eDay) - 1);
  const result = new Date(start);
  result.setDate(start.getDate() + offset);

  return { year: result.getFullYear(), month: result.getMonth() + 1, day: result.getDate() };
}

function formatEthiopian(dateLike, opts = { amharic: false }) {
  // Accept either a Date (Gregorian) or eth object {year, month, day}
  let e;
  if (dateLike instanceof Date) {
    e = gregorianToEthiopian(dateLike);
  } else if (dateLike && dateLike.year) {
    e = dateLike;
  } else {
    return "";
  }

  const monthsAm = [
    "መስከረም",
    "ጥቅምት",
    "ህዳር",
    "ታህሳስ",
    "ጥር",
    "የካቲት",
    "መጋቢት",
    "ሚያዝያ",
    "ግንቦት",
    "ሰኔ",
    "ሐምሌ",
    "ነሐሴ",
    "ጳጉሜን",
  ];

  const monthsEn = [
    "Meskerem",
    "Tikimt",
    "Hidar",
    "Tahsas",
    "Tir",
    "Yekatit",
    "Megabit",
    "Miazia",
    "Ginbot",
    "Sene",
    "Hamle",
    "Nehase",
    "Pagumen",
  ];

  const months = opts.amharic ? monthsAm : monthsEn;
  return `${e.year} - ${months[e.month - 1]} ${e.day}`;
}

export { gregorianToEthiopian, ethiopianToGregorian, formatEthiopian };

// Format time in Ethiopia (EAT timezone) and optionally map to Ethiopian clock numbers
function formatEthiopianTime(dateLike, opts = { amharic: false, clock: 'ethiopian', periodStyle: 'full' }) {
  // Safely handle various input types:
  // - Date objects (full datetime)
  // - date-time strings (ISO or with time component)
  // - time-only strings like "08:00" or "8:00 PM"
  // - undefined / null -> return empty string
  if (!dateLike && dateLike !== 0) return "";

  let rawHour = null;
  let minute = "00";

  // Time-only strings such as "10:00" or "10:00:00" or with AM/PM
  const timeOnly = typeof dateLike === 'string' && dateLike.trim().match(/^\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?\s*$/);
  if (timeOnly) {
    rawHour = Number(timeOnly[1]);
    minute = timeOnly[2] || "00";
    const ampm = timeOnly[4];
    if (ampm) {
      if (ampm.toLowerCase() === 'pm' && rawHour < 12) rawHour += 12;
      if (ampm.toLowerCase() === 'am' && rawHour === 12) rawHour = 0;
    }
  } else {
    // Try to interpret as Date (may be a full ISO string or a Date object)
    const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
    if (!isNaN(d.getTime())) {
      // Use Intl to get the time in Africa/Addis_Ababa timezone (EAT)
      try {
        const hourParts = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: false, timeZone: 'Africa/Addis_Ababa' }).formatToParts(d);
        const hourPart = hourParts.find(p => p.type === 'hour')?.value ?? '0';
        minute = hourParts.find(p => p.type === 'minute')?.value ?? '00';
        rawHour = Number(hourPart);
      } catch (err) {
        // Fallback: try to extract a time substring from the input string
        const tmatch = typeof dateLike === 'string' && dateLike.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
        if (tmatch) {
          const parts = tmatch[1].split(':');
          rawHour = Number(parts[0]);
          minute = parts[1] || '00';
        } else {
          return "";
        }
      }
    } else {
      // Could not parse input as date or time -> safe empty string
      return "";
    }
  }

  if (rawHour === null || Number.isNaN(rawHour)) return "";

  if (opts.clock === '24') {
    return `${String(rawHour).padStart(2, '0')}:${minute}`;
  }

  // Map to Ethiopian clock (hours start at 6:00 => 1)
  const ethHour = ((rawHour + 6 - 1) % 12) + 1; // maps 6->12, 7->1, 19->1 etc
  // Build localized period label.
  let periodLabel = rawHour >= 12 ? 'PM' : 'AM';

  if (opts.amharic) {
    // periodStyle: 'short' -> single-letter/char; 'full' -> full-word
    const style = opts.periodStyle === 'short' ? 'short' : 'full';

    // Map hours into Ethiopian day segments
    // - night: 21..23 and 0..5 -> ሌ / ሌሊት
    // - morning: 6..11 -> ጠ / ጠዋት
    // - daytime (PM until 6pm): 12..17 -> ቀ / ቀን
    // - evening: 18..20 -> ማ / ማታ
    if (rawHour >= 6 && rawHour < 12) {
      periodLabel = style === 'short' ? 'ጠ' : 'ጠዋት';
    } else if (rawHour >= 12 && rawHour < 18) {
      periodLabel = style === 'short' ? 'ቀ' : 'ቀን';
    } else if (rawHour >= 18 && rawHour < 21) {
      periodLabel = style === 'short' ? 'ማ' : 'ማታ';
    } else {
      periodLabel = style === 'short' ? 'ሌ' : 'ሌሊት';
    }
  } else {
    // Default Western label (AM/PM)
    periodLabel = rawHour >= 12 ? 'PM' : 'AM';
  }

  return `${ethHour}:${minute} ${periodLabel}`;
}

export { formatEthiopianTime }

