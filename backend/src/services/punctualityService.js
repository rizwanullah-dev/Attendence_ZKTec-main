/**
 * Punctuality & Shift Adherence Service for Call Centers
 * Calculates Before Time (Early Arrival), On Time, Late Arrival,
 * Early Departure, Overtime, and Check-out status.
 */

function calculateShiftAdherence({ shiftStartStr = '19:00:00', shiftEndStr = '04:00:00', checkInTime, checkOutTime }) {
  if (!checkInTime) {
    return {
      checkIn: { status: 'absent', label: 'Not Checked In', minutes: 0 },
      checkOut: { status: 'absent', label: 'Not Checked Out', minutes: 0 },
      durationHours: 0,
    };
  }

  const checkIn = new Date(checkInTime);
  const [startH, startM, startS] = (shiftStartStr || '19:00:00').split(':').map(Number);
  const [endH, endM, endS] = (shiftEndStr || '04:00:00').split(':').map(Number);

  // Determine scheduled shift start timestamp for the check-in day
  const scheduledStart = new Date(checkIn);
  scheduledStart.setHours(startH, startM || 0, startS || 0, 0);

  // If check-in happened in early morning for a night shift that started previous evening
  // (e.g. shift 19:00, check-in at 00:30 AM), adjust scheduledStart back by 1 day
  if (startH > endH && checkIn.getHours() < endH + 4) {
    scheduledStart.setDate(scheduledStart.getDate() - 1);
  }

  // Calculate Check-in Punctuality
  // diffMs < 0: punched before shift start (early)
  // diffMs > 0: punched after shift start (late if > 10m grace)
  const diffStartMs = checkIn.getTime() - scheduledStart.getTime();
  const diffStartMins = Math.round(diffStartMs / 60000);

  let checkInResult;
  if (diffStartMins < -1) {
    const earlyMins = Math.abs(diffStartMins);
    checkInResult = {
      status: 'early',
      earlyMinutes: earlyMins,
      lateMinutes: 0,
      label: `${earlyMins}m Before Time`,
      tag: 'Before Time',
    };
  } else if (diffStartMins <= 10) {
    checkInResult = {
      status: 'on_time',
      earlyMinutes: 0,
      lateMinutes: 0,
      label: diffStartMins <= 0 ? 'Exact On Time' : `On Time (+${diffStartMins}m grace)`,
      tag: 'On Time',
    };
  } else {
    checkInResult = {
      status: 'late',
      earlyMinutes: 0,
      lateMinutes: diffStartMins,
      label: `${diffStartMins}m Late`,
      tag: 'Late Arrival',
    };
  }

  // Determine scheduled shift end timestamp
  const scheduledEnd = new Date(scheduledStart);
  if (endH < startH) {
    // Night shift crosses midnight (e.g. 19:00 to 04:00 next day)
    scheduledEnd.setDate(scheduledEnd.getDate() + 1);
  }
  scheduledEnd.setHours(endH, endM || 0, endS || 0, 0);

  // Calculate Check-out Status
  let checkOutResult;
  let durationHours = 0;

  if (!checkOutTime) {
    const now = new Date();
    durationHours = Math.max(0, Math.round(((now - checkIn) / 3600000) * 10) / 10);
    checkOutResult = {
      status: 'active',
      earlyMinutes: 0,
      overtimeMinutes: 0,
      label: 'Active / Not Checked Out',
      tag: 'Still On Shift',
    };
  } else {
    const checkOut = new Date(checkOutTime);
    durationHours = Math.max(0, Math.round(((checkOut - checkIn) / 3600000) * 10) / 10);
    const diffEndMs = checkOut.getTime() - scheduledEnd.getTime();
    const diffEndMins = Math.round(diffEndMs / 60000);

    if (diffEndMins < -10) {
      const leftEarlyMins = Math.abs(diffEndMins);
      checkOutResult = {
        status: 'early_departure',
        earlyMinutes: leftEarlyMins,
        overtimeMinutes: 0,
        label: `Left ${leftEarlyMins}m Early`,
        tag: 'Early Departure',
      };
    } else if (diffEndMins > 15) {
      checkOutResult = {
        status: 'overtime',
        earlyMinutes: 0,
        overtimeMinutes: diffEndMins,
        label: `+${diffEndMins}m Overtime`,
        tag: 'Overtime',
      };
    } else {
      checkOutResult = {
        status: 'completed',
        earlyMinutes: 0,
        overtimeMinutes: 0,
        label: 'Shift Completed',
        tag: 'On Time Departure',
      };
    }
  }

  return {
    scheduledStart: scheduledStart.toISOString(),
    scheduledEnd: scheduledEnd.toISOString(),
    checkIn: checkInResult,
    checkOut: checkOutResult,
    durationHours,
  };
}

module.exports = { calculateShiftAdherence };
