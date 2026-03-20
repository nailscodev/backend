export interface BookingConfirmationEmailData {
  customerFirstName: string;
  appointmentDate: string;   // "YYYY-MM-DD"
  startTime: string;          // "HH:MM:SS" or "HH:MM"
  endTime: string;            // "HH:MM:SS" or "HH:MM"
  services: Array<{ name: string; price: number }>;
  totalPrice: number;
}

function formatDate(dateStr: string): string {
  // "2026-03-19" → "Thursday, March 19, 2026"
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime12h(timeStr: string): string {
  // "14:00:00" → "2:00 PM"
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function getDurationMinutes(startTime: string, endTime: string): number {
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  return toMin(endTime) - toMin(startTime);
}

export function bookingConfirmationEmail(data: BookingConfirmationEmailData): string {
  const { customerFirstName, appointmentDate, startTime, endTime, services, totalPrice } = data;

  const formattedDate = formatDate(appointmentDate);
  const formattedStart = formatTime12h(startTime);
  const formattedEnd = formatTime12h(endTime);
  const durationMin = getDurationMinutes(startTime, endTime);

  const servicesRows = services
    .map(
      (s) => `
        <tr>
          <td style="padding:6px 0; color:#333; font-size:15px;">${s.name}</td>
          <td style="padding:6px 0; color:#333; font-size:15px; text-align:right;">$${s.price.toFixed(2)}</td>
        </tr>`,
    )
    .join('');

  const subtotal = services.reduce((sum, s) => sum + s.price, 0);
  const salonFee = Math.round(subtotal * 0.06 * 100) / 100;
  const displayTotal = subtotal + salonFee;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Confirmed – N&CO. MIDTOWN</title>
</head>
<body style="margin:0; padding:0; background:#f4f4f4; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4; padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden; max-width:600px; width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#1a1a1a; padding:32px 40px; text-align:center;">
              <p style="margin:0; color:#ffffff; font-size:22px; font-weight:600; letter-spacing:2px;">N&amp;CO. MIDTOWN</p>
              <p style="margin:8px 0 0; color:#aaaaaa; font-size:13px; letter-spacing:1px; text-transform:uppercase;">Nails &amp; Beauty</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">

              <p style="margin:0 0 8px; font-size:22px; font-weight:600; color:#1a1a1a;">
                Your appointment is confirmed! ✅
              </p>
              <p style="margin:0 0 28px; font-size:15px; color:#555;">
                Hi <strong>${customerFirstName}</strong>, we're looking forward to seeing you!
              </p>

              <!-- Appointment Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9; border-radius:8px; border:1px solid #ebebeb; margin-bottom:28px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 16px; font-size:13px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:1px;">📅 Appointment Details</p>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:5px 0; font-size:14px; color:#888; width:90px;">Date</td>
                        <td style="padding:5px 0; font-size:15px; color:#1a1a1a; font-weight:600;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0; font-size:14px; color:#888;">Time</td>
                        <td style="padding:5px 0; font-size:15px; color:#1a1a1a; font-weight:600;">
                          ${formattedStart} – ${formattedEnd} <span style="font-weight:400; color:#888;">(${durationMin} min)</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0; font-size:14px; color:#888;">Location</td>
                        <td style="padding:5px 0; font-size:15px; color:#1a1a1a; font-weight:600;">122 Buena Vista Blvd, Miami</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Services Summary -->
              ${services.length > 0 ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding-bottom:12px;">
                    <p style="margin:0; font-size:13px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:1px;">🧾 Appointment Summary</p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #ebebeb;">
                      ${servicesRows}
                      <tr>
                        <td style="padding:10px 0 6px; border-top:1px solid #ebebeb; font-size:14px; color:#888;">Subtotal</td>
                        <td style="padding:10px 0 6px; border-top:1px solid #ebebeb; font-size:14px; color:#888; text-align:right;">$${subtotal.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0 6px; font-size:14px; color:#888;">Salon fee (6%)</td>
                        <td style="padding:4px 0 6px; font-size:14px; color:#888; text-align:right;">$${salonFee.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0 0; font-size:16px; font-weight:700; color:#1a1a1a;">Total</td>
                        <td style="padding:8px 0 0; font-size:16px; font-weight:700; color:#1a1a1a; text-align:right;">$${displayTotal.toFixed(2)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Contact / Notes -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbf0; border-radius:8px; border:1px solid #f0e8c8; margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 10px; font-size:14px; color:#555;">
                      If you need to make any changes, please contact us at:
                    </p>
                    <p style="margin:0 0 6px; font-size:15px; color:#1a1a1a;">📞 <strong>+1 (786) 889-2828</strong></p>
                    <p style="margin:0; font-size:14px; color:#555;">
                      You can also reply directly to this email for assistance.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 6px; font-size:14px; color:#555;">
                ⏰ We recommend arriving <strong>5–10 minutes early</strong> to ensure a smooth experience.
              </p>
              <p style="margin:0; font-size:14px; color:#555;">
                Thank you for choosing <strong>Nails&amp;Co. Midtown</strong> — we can't wait to see you!
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9f9f9; padding:24px 40px; text-align:center; border-top:1px solid #ebebeb;">
              <p style="margin:0; font-size:13px; color:#aaa;">
                © ${new Date().getFullYear()} N&amp;Co. Midtown Team · 122 Buena Vista Blvd, Miami
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}
