function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function createResendEmailService({ apiKey, fromEmail, fetchImpl = fetch }) {
  if (!apiKey || !fromEmail) return undefined;

  return {
    async sendPasswordReset({ email, resetUrl }) {
      const response = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: 'Reset your Rogontra Wholesale password',
          text: `Use this one-time link to reset your Rogontra Wholesale password. It expires in 30 minutes: ${resetUrl}`,
          html: `<p>Use this one-time link to reset your Rogontra Wholesale password. It expires in 30 minutes.</p><p><a href="${escapeHtml(resetUrl)}">Reset password</a></p>`
        })
      });
      if (!response.ok) {
        const error = new Error('Password-reset email delivery failed.');
        error.statusCode = 502;
        throw error;
      }
    }
  };
}
