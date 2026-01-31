export function userWelcomeEmail({ name, username, password }: { name: string; username: string; password: string; }) {
  return `
    <div style="font-family: Arial, sans-serif; color: #222;">
      <h2>Welcome to Nails & Co!</h2>
      <p>Hello <b>${name}</b>,</p>
      <p>Your account has been created successfully.</p>
      <p>
        <b>Username:</b> ${username}<br>
        <b>Temporary password:</b> ${password}
      </p>
      <p>Please log in and change your password as soon as possible for security reasons.</p>
      <hr style="margin: 32px 0;">
      <p style="font-size: 13px; color: #888;">If you did not request this account, please ignore this email.</p>
      <p style="font-size: 13px; color: #888;">Thank you,<br>Nails & Co Team</p>
    </div>
  `;
}
