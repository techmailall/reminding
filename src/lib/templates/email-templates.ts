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
        <p><strong>Event </strong> ${escapeHtml(vars.eventType.toUpperCase())}</p>
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(vars.title)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@300;400;700&display=swap');
    
    body { 
      margin: 0; 
      padding: 20px 10px; 
      background-color: #1a1814; 
      -webkit-font-smoothing: antialiased;
      font-family: 'Lato', 'Helvetica Neue', Arial, sans-serif;
    }
    
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: #222018;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .header { 
      background: linear-gradient(135deg, #2d2820 0%, #3d3528 100%);
      padding: 40px 30px; 
      text-align: center;
      position: relative;
    }
    
    .header::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 2px;
      background: #d4af37;
    }
    
    .header h1 { 
      color: #f5f0e6; 
      font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; 
      margin: 0; 
      font-size: 28px; 
      font-weight: 700;
    }
    
    .content { 
      padding: 30px; 
      color: #c9c4b8; 
      line-height: 1.6;
      font-size: 13px;
    }
    
    .greeting {
      color: #e8e3d8;
      font-size: 16px;
      margin-bottom: 20px;
      font-weight: 300;
    }
    
    .event-card { 
      background: #2a2520;
      border-radius: 6px;
      padding: 25px; 
      margin: 25px 0;
      border: 1px solid rgba(212,175,55,0.2);
    }
    
    .event-badge {
      display: inline-block;
      background: rgba(212,175,55,0.15);
      color: #d4af37;
      padding: 6px 14px;
      border-radius: 15px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 700;
      margin-bottom: 15px;
    }
    
    .event-type {
      font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
      font-size: 22px;
      color: #f5f0e6;
      margin: 0 0 18px 0;
    }
    
    .info-grid {
      display: grid;
      gap: 15px;
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
    }
    
    .info-label {
      color: #8b8070;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }
    
    .info-value {
      color: #e0dbd0;
      font-size: 14px;
    }
    
    .date-box {
      background: rgba(212,175,55,0.1);
      padding: 12px 15px;
      border-radius: 4px;
      border-left: 2px solid #d4af37;
      margin-top: 15px;
    }
    
    .quote-section {
      margin-top: 25px;
      padding: 20px;
      text-align: center;
      color: #a09070;
      font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
      font-size: 15px;
      font-style: italic;
      border-top: 1px solid rgba(255,255,255,0.1);
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    .footer { 
      background: #1a1814; 
      color: #5a5448; 
      text-align: center; 
      padding: 20px; 
      font-size: 11px;
      border-top: 1px solid rgba(255,255,255,0.05);
    }
    
    @media only screen and (max-width: 600px) {
      body { padding: 15px 8px; }
      .header { padding: 30px 25px; }
      .header h1 { font-size: 24px; }
      .content { padding: 25px; font-size: 12px; }
      .event-card { padding: 20px; }
      .event-type { font-size: 20px; }
      .quote-section { font-size: 14px; padding: 18px; }
    }
  </style>
<base target="_blank">
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${escapeHtml(vars.title)}</h1>
    </div>
    <div class="content">
      <p class="greeting">Dear Recipient,</p>
      <div class="event-card">
        <div class="event-badge">Wishes & Blessings</div>
        <h2 class="event-type">For Today</h2>
        <div class="info-grid">
          <div class="info-item">
            <p><span class="info-label">Description</span></p>
            <span class="info-value">${escapeHtml(vars.message)}</span>
          </div>
          <div class="date-box">
            <span class="info-label" style="color: #d4af37; margin-bottom: 6px; display: block;">Scheduled Date</span>
            <span class="info-value" style="color: #f5f0e6; font-size: 16px;">${escapeHtml(vars.date)}</span>
          </div>
        </div>
      </div>
      ${vars.quote ? `<div class="quote-section">"${escapeHtml(vars.quote)}"</div>` : ''}
    </div>
    <div class="footer">
      <p>Sent with 💜 by the Reminder System</p>
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(vars.title)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Montserrat:wght@300;400;500&display=swap');
    
    body { 
      margin: 0; 
      padding: 0; 
      background-color: #fafafa; 
      -webkit-font-smoothing: antialiased;
      font-family: 'Montserrat', 'Helvetica Neue', Arial, sans-serif;
    }
    
    .wrapper { 
      width: 100%; 
      max-width: 600px; 
      margin: 0 auto; 
      background: white;
    }
    
    .hero { 
      background: linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); 
      padding: 50px 40px; 
      text-align: center; 
      position: relative;
      overflow: hidden;
    }
    
    .hero::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px);
      background-size: 50px 50px;
      opacity: 0.5;
    }
    
    .hero h1 { 
      color: #fff; 
      font-family: 'Cormorant Garamond', Georgia, 'Times New Roman', serif; 
      margin: 0; 
      font-size: 36px; 
      font-weight: 600;
      letter-spacing: -0.5px;
      position: relative;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    
    .hero-accent {
      width: 40px;
      height: 2px;
      background: #e94560;
      margin: 20px auto 0;
      position: relative;
    }
    
    .main-content { 
      padding: 40px; 
      font-family: 'Montserrat', 'Helvetica Neue', Arial, sans-serif;
      color: #2c3e50; 
      line-height: 1.6;
      font-size: 14px;
    }
    
    .greeting {
      font-size: 18px;
      font-weight: 300;
      color: #1a1a2e;
      margin-bottom: 25px;
      letter-spacing: 0.5px;
    }
    
    .event-display { 
      background: linear-gradient(to right, #f8f9fa 0%, #ffffff 100%);
      border: none;
      padding: 30px; 
      margin: 25px 0; 
      position: relative;
    }
    
    .event-display::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: #e94560;
    }
    
    .event-label {
      text-transform: uppercase;
      letter-spacing: 2px;
      font-size: 10px;
      font-weight: 500;
      color: #e94560;
      margin-bottom: 8px;
      display: block;
    }
    
    .event-type {
      font-family: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
      font-size: 24px;
      font-weight: 600;
      color: #1a1a2e;
      margin: 0 0 15px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .event-detail {
      margin: 12px 0;
      font-size: 13px;
      color: #555;
      line-height: 1.5;
    }
    
    .event-detail strong {
      color: #1a1a2e;
      font-weight: 500;
      display: inline-block;
      width: 110px;
    }
    
    .date-highlight {
      font-size: 14px;
      color: #0f3460;
      font-weight: 500;
      margin-top: 8px;
    }
    
    .quote-section {
      margin: 30px 0;
      padding: 25px;
      background: #1a1a2e;
      color: #fff;
      font-family: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
      font-size: 18px;
      font-style: italic;
      line-height: 1.4;
      text-align: center;
      position: relative;
    }
    
    .quote-section::before {
      content: '"';
      font-size: 50px;
      position: absolute;
      top: 5px;
      left: 20px;
      opacity: 0.2;
      font-family: Georgia, serif;
    }
    
    .closing {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      color: #666;
      font-size: 12px;
    }
    
    .footer { 
      background: #1a1a2e; 
      color: rgba(255,255,255,0.6); 
      text-align: center; 
      padding: 25px; 
      font-size: 11px;
      letter-spacing: 1px;
      font-weight: 300;
    }
    
    .footer-heart {
      color: #e94560;
      font-size: 12px;
    }
    
    @media only screen and (max-width: 600px) {
      .hero { padding: 35px 25px; }
      .hero h1 { font-size: 28px; }
      .main-content { padding: 30px 25px; font-size: 13px; }
      .event-display { padding: 25px; }
      .event-type { font-size: 20px; }
      .quote-section { font-size: 16px; padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="hero">
      <h1>${escapeHtml(vars.title)}</h1>
      <div class="hero-accent"></div>
    </div>
    
    <div class="main-content">
      <p class="greeting">Dear Recipient,</p>
      
      <div class="event-display">
        <span class="event-label">Event Notification</span>
        <h2 class="event-type">${escapeHtml(vars.eventType.toUpperCase())}</h2>
        
        <div class="event-detail">
          <strong>Description:</strong> ${escapeHtml(vars.message)}
        </div>
        
        <div class="event-detail date-highlight">
          <strong>Scheduled Date:</strong> ${escapeHtml(vars.date)}
        </div>
      </div>
      
      ${vars.quote ? `<div class="quote-section">${escapeHtml(vars.quote)}</div>` : ''}
      
      <div class="closing">
        <p>This is a reminder from our system.</p>
      </div>
    </div>
    
    <div class="footer">
      <p>Sent with <span class="footer-heart">💜</span> by the Reminder System</p>
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
      <p>Dear Recipient,</p>
      <p>${escapeHtml(vars.message)}</p>
      <p>Mark your calendar for ${escapeHtml(vars.date)}.</p>
      <p style="color: #e53e3e; margin-top: 30px;">With all my love,<br>Your Assistant</p>
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
