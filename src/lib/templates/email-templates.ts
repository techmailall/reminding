import type { TemplateType } from '@/types';

// ============================================
// Template Variables Interface
// ============================================

interface TemplateVariables {
  title: string;
  message: string;
  quote?: string;
  date: string;
  eventType: string;
}

// ============================================
// Template Generator Functions
// ============================================

const templateGenerators: Record<TemplateType, (vars: TemplateVariables) => string> = {
  elegant: generateElegantTemplate,
  fun: generateFunTemplate,
  corporate: generateCorporateTemplate,
  romantic: generateRomanticTemplate,
  dark: generateDarkTemplate,
};

// ============================================
// Main Export Function
// ============================================

export function generateEmailTemplate(
  type: TemplateType,
  variables: TemplateVariables
): string {
  const generator = templateGenerators[type] || templateGenerators.elegant;
  return generator(variables);
}

// ============================================
// Individual Template Generators
// ============================================

function generateElegantTemplate(vars: TemplateVariables): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(vars.title)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@300;400&display=swap');
    body { margin: 0; padding: 0; background-color: #f4f4f4; -webkit-font-smoothing: antialiased; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; }
    .header h1 { color: white; font-family: 'Playfair Display', Georgia, serif; margin: 0; font-size: 32px; font-weight: 700; }
    .content { padding: 40px; font-family: 'Lato', Arial, sans-serif; color: #333; line-height: 1.6; }
    .event-box { background: #f8f9fa; border-left: 4px solid #764ba2; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .footer { background: #2d3748; color: white; text-align: center; padding: 20px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ ${escapeHtml(vars.title)} ✨</h1>
    </div>
    <div class="content">
      <p>Dear Recipient,</p>
      <div class="event-box">
        <p><strong>Event Type:</strong> ${escapeHtml(vars.eventType.toUpperCase())}</p>
        <p><strong>Description:</strong> ${escapeHtml(vars.message)}</p>
        <p><strong>Scheduled Date:</strong> ${escapeHtml(vars.date)}</p>
      </div>
      ${vars.quote ? `<p style="font-style: italic; color: #666;">"${escapeHtml(vars.quote)}"</p>` : ''}
      <p>This is an automated reminder from our system.</p>
    </div>
    <div class="footer">
      <p>Sent with 💜 by the Automated Reminder System</p>
    </div>
  </div>
</body>
</html>`;
}

function generateDarkTemplate(vars: TemplateVariables): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body { background-color: #0a0a0a; color: #ff006e; font-family: 'Courier New', monospace; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; border: 3px solid #ff006e; box-shadow: 0 0 20px #ff006e; background: #000; }
    .header { background: #000; padding: 30px; text-align: center; border-bottom: 2px solid #ff006e; }
    .content { padding: 30px; background: #111; }
    .glitch { text-shadow: 2px 0 #ff006e, -2px 0 #00fff9; animation: glitch 1s infinite; }
    @keyframes glitch { 0%, 100% { text-shadow: 2px 0 #ff006e, -2px 0 #00fff9; } 50% { text-shadow: -2px 0 #ff006e, 2px 0 #00fff9; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="glitch">⚠️ ${escapeHtml(vars.title)} ⚠️</h1>
    </div>
    <div class="content">
      <p>> INITIATING REMINDER PROTOCOL...</p>
      <p>> EVENT: ${escapeHtml(vars.eventType.toUpperCase())}</p>
      <p>> DETAILS: ${escapeHtml(vars.message)}</p>
      <p>> TIMESTAMP: ${new Date().toISOString()}</p>
      <p>> STATUS: ACTIVE</p>
    </div>
  </div>
</body>
</html>`;
}

function generateFunTemplate(vars: TemplateVariables): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body { background: linear-gradient(45deg, #f093fb 0%, #f5576c 100%); font-family: 'Comic Sans MS', 'Chalkboard SE', cursive; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
    .header { background: #ff6b6b; padding: 30px; text-align: center; color: white; }
    .content { padding: 30px; font-size: 18px; color: #333; }
    .emoji { font-size: 40px; text-align: center; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 ${escapeHtml(vars.title)} 🎉</h1>
    </div>
    <div class="content">
      <div class="emoji">🎈🎊🎁</div>
      <p>Hey there! 👋</p>
      <p>Just reminding you about: <strong>${escapeHtml(vars.message)}</strong></p>
      <p>Don't forget! It's happening on ${escapeHtml(vars.date)}</p>
      <div class="emoji">🌟✨🌈</div>
    </div>
  </div>
</body>
</html>`;
}

function generateCorporateTemplate(vars: TemplateVariables): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body { background-color: #f5f5f5; font-family: Arial, 'Helvetica Neue', sans-serif; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; }
    .header { background: #1a365d; padding: 30px; color: white; }
    .content { padding: 30px; line-height: 1.6; color: #2d3748; }
    .details { background: #edf2f7; padding: 15px; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">BUSINESS REMINDER</h1>
    </div>
    <div class="content">
      <p>Dear Valued Contact,</p>
      <p>This is a formal notification regarding:</p>
      <div class="details">
        <p><strong>Subject:</strong> ${escapeHtml(vars.title)}</p>
        <p><strong>Category:</strong> ${escapeHtml(vars.eventType)}</p>
        <p><strong>Details:</strong> ${escapeHtml(vars.message)}</p>
        <p><strong>Date/Time:</strong> ${escapeHtml(vars.date)}</p>
      </div>
      <p>Please take necessary action.</p>
      <p>Best regards,<br>Automated Systems Division</p>
    </div>
  </div>
</body>
</html>`;
}

function generateRomanticTemplate(vars: TemplateVariables): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Quicksand:wght@400;600&display=swap');
    body { background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: rgba(255,255,255,0.95); border-radius: 15px; padding: 40px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); }
    h1 { font-family: 'Dancing Script', cursive; color: #e53e3e; text-align: center; font-size: 42px; margin: 0 0 20px; }
    .content { font-family: 'Quicksand', sans-serif; color: #4a5568; font-size: 18px; line-height: 1.8; }
    .heart { color: #e53e3e; font-size: 24px; text-align: center; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${escapeHtml(vars.title)}</h1>
    <div class="heart">❤️ 💕 ❤️</div>
    <div class="content">
      <p>My Dearest,</p>
      <p>${escapeHtml(vars.message)}</p>
      <p>Mark your calendar for ${escapeHtml(vars.date)}.</p>
      <p style="color: #e53e3e; margin-top: 30px;">With all my love,<br>Your Automated Companion</p>
    </div>
  </div>
</body>
</html>`;
}

// ============================================
// Utility Functions
// ============================================

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================
// Plain Text Templates
// ============================================

export function generatePlainText(type: TemplateType, vars: TemplateVariables): string {
  const templates: Record<TemplateType, string> = {
    elegant: `${vars.title} - ${vars.message}${vars.quote ? ` - "${vars.quote}"` : ''}`,
    dark: `[DARK MODE] ${vars.title}: ${vars.message}`,
    fun: `🎉 ${vars.title}: ${vars.message} 🎉`,
    corporate: `BUSINESS REMINDER: ${vars.title} - ${vars.message}`,
    romantic: `❤️ ${vars.title}: ${vars.message} ❤️`,
  };

  return templates[type] || templates.elegant;
}
