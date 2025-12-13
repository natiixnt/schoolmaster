import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Email configuration for VH.pl SMTP
function getEmailConfig(): EmailConfig {
  return {
    host: process.env.SMTP_HOST || 'mail.schoolmaster.pl',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER || 'noreply@schoolmaster.pl',
      pass: process.env.SMTP_PASSWORD || ''
    }
  };
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userName?: string
): Promise<boolean> {
  try {
    // For now, we'll use console.log to show the email content
    // This can be later replaced with actual SMTP configuration
    const resetUrl = `${process.env.NODE_ENV === 'production' ? 'https://schoolmaster.pl' : 'http://localhost:5000'}/reset-password?token=${resetToken}`;
    
    const emailContent = {
      from: 'SchoolMaster <noreply@schoolmaster.pl>',
      to: email,
      subject: 'Resetowanie hasła - SchoolMaster',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              line-height: 1.6; 
              color: #333; 
              background: #f8fafc;
            }
            .email-container { 
              max-width: 600px; 
              margin: 40px auto; 
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header { 
              background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
              padding: 40px 30px; 
              text-align: center;
            }
            .logo {
              width: 120px;
              height: auto;
              margin-bottom: 15px;
            }
            .header h1 { 
              color: white; 
              font-size: 28px; 
              font-weight: 700;
              margin-bottom: 8px;
            }
            .header p { 
              color: white; 
              font-size: 16px;
              opacity: 0.9;
            }
            .content { 
              padding: 40px 30px;
            }
            .content h2 {
              color: #252627;
              font-size: 24px;
              margin-bottom: 20px;
              text-align: center;
            }
            .content p {
              margin-bottom: 16px;
              font-size: 16px;
              line-height: 1.7;
            }
            .button-container {
              text-align: center;
              margin: 30px 0;
            }
            .button { 
              display: inline-block; 
              background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
              color: white !important; 
              padding: 16px 32px; 
              text-decoration: none; 
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 4px 15px rgba(30, 58, 138, 0.3);
              transition: all 0.3s ease;
            }
            .link-backup {
              background: #f8fafc;
              padding: 15px;
              border-radius: 8px;
              border-left: 4px solid #1e3a8a;
              margin: 20px 0;
            }
            .link-backup p {
              margin: 0;
              font-size: 14px;
              color: #666;
            }
            .link-backup code {
              word-break: break-all;
              background: #e2e8f0;
              padding: 2px 4px;
              border-radius: 4px;
              font-size: 12px;
            }
            .warning {
              background: #dbeafe;
              border: 1px solid #3b82f6;
              border-radius: 8px;
              padding: 16px;
              margin: 20px 0;
            }
            .warning strong {
              color: #1e40af;
            }
            .divider {
              height: 1px;
              background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
              margin: 30px 0;
            }
            .footer { 
              background: #f8fafc;
              padding: 30px;
              text-align: center; 
              color: #64748b; 
              font-size: 14px;
              border-top: 1px solid #e2e8f0;
            }
            .footer p {
              margin-bottom: 8px;
            }
            @media (max-width: 600px) {
              .email-container { margin: 20px; }
              .header, .content { padding: 30px 20px; }
              .button { padding: 14px 28px; font-size: 15px; }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <img src="https://schoolmaster.pl/schoolmaster-logo-white.png" alt="SchoolMaster" style="max-width: 250px !important; height: auto !important; margin: 0 auto 15px auto !important; display: block !important;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
              <h1 style="display: none;">Resetowanie hasła</h1>
              <p>Bezpieczne przywracanie dostępu do konta</p>
            </div>
            <div class="content">
              <h2>Prośba o reset hasła</h2>
              <p><strong>Witaj${userName ? ` ${userName}` : ''}!</strong></p>
              <p style="color: #000 !important;">Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w SchoolMaster. Aby kontynuować, kliknij poniższy przycisk:</p>
              
              <div class="button-container">
                <a href="${resetUrl}" class="button">Resetuj hasło</a>
              </div>
              
              <div class="link-backup">
                <p><strong>Przycisk nie działa?</strong> Skopiuj i wklej poniższy link:</p>
                <code>${resetUrl}</code>
              </div>
              
              <div class="warning" style="background: #dbeafe !important; border: 1px solid #3b82f6 !important;">
                <p><strong>Ważne informacje:</strong></p>
                <ul style="margin: 8px 0 0 20px;">
                  <li>Link jest ważny przez <strong>24 godziny</strong></li>
                  <li>Może być użyty tylko <strong>jeden raz</strong></li>
                  <li>Po użyciu automatycznie wygasa</li>
                </ul>
              </div>
              
              <p style="color: #64748b; font-size: 14px;">Jeśli nie prosiłeś o reset hasła, możesz zignorować tę wiadomość. Twoje konto pozostanie bezpieczne.</p>
              
              <div class="divider"></div>
              
              <p style="text-align: center; color: #64748b;">
                <strong>Zespół SchoolMaster</strong><br>
                kontakt@schoolmaster.pl | schoolmaster.pl
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} SchoolMaster. Wszystkie prawa zastrzeżone.</p>
              <p>Ten email został wysłany automatycznie. Nie odpowiadaj na tę wiadomość.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Resetowanie hasła - SchoolMaster

Witaj${userName ? ` ${userName}` : ''},

Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w SchoolMaster.

Aby zresetować hasło, wejdź na poniższy link:
${resetUrl}

Ten link jest ważny przez 24 godziny i może być użyty tylko raz.

Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.

Pozdrawiamy,
Zespół SchoolMaster
schoolmaster.pl
      `
    };

    // Check if SMTP is configured
    if (process.env.SMTP_PASSWORD && process.env.SMTP_USER) {
      console.log('Wysyłanie emaila przez SMTP...');
      const transporter = nodemailer.createTransport(getEmailConfig());
      await transporter.sendMail(emailContent);
      console.log('Email resetowania hasła wysłany do:', email);
    } else {
      // For development, log the email content
      console.log('=== EMAIL RESET HASŁA (DEVELOPMENT) ===');
      console.log('Do:', emailContent.to);
      console.log('Temat:', emailContent.subject);
      console.log('Link resetowania:', resetUrl);
      console.log('Skonfiguruj SMTP_USER i SMTP_PASSWORD aby wysyłać prawdziwe emaile');
      console.log('=======================');
    }

    return true;
  } catch (error) {
    console.error('Błąd wysyłania emaila resetowania hasła:', error);
    return false;
  }
}

export async function sendWelcomeEmail(
  email: string,
  userName: string,
  userRole: 'student' | 'tutor'
): Promise<boolean> {
  try {
    const loginUrl = 'https://schoolmaster.pl/login';
    const roleText = userRole === 'student' ? 'uczeń' : 'korepetytor';
    
    const emailContent = {
      from: 'SchoolMaster <noreply@schoolmaster.pl>',
      to: email,
      subject: 'Witamy w SchoolMaster!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              line-height: 1.6; 
              color: #333; 
              background: #f8fafc;
            }
            .email-container { 
              max-width: 600px; 
              margin: 40px auto; 
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header { 
              background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
              padding: 40px 30px; 
              text-align: center;
            }
            .logo {
              width: 180px;
              height: auto;
              margin-bottom: 15px;
            }
            .header h1 { 
              color: white; 
              font-size: 28px; 
              font-weight: 700;
              margin-bottom: 8px;
            }
            .header p { 
              color: white; 
              font-size: 16px;
              opacity: 0.9;
            }
            .content { 
              padding: 40px 30px;
            }
            .content h2 {
              color: #252627;
              font-size: 24px;
              margin-bottom: 20px;
              text-align: center;
            }
            .content p {
              margin-bottom: 16px;
              font-size: 16px;
              line-height: 1.7;
            }
            .button-container {
              text-align: center;
              margin: 30px 0;
            }
            .button { 
              display: inline-block; 
              background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
              color: white !important; 
              padding: 16px 32px; 
              text-decoration: none; 
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 4px 15px rgba(30, 58, 138, 0.3);
            }
            .features {
              background: #f8fafc;
              border-radius: 8px;
              padding: 20px;
              margin: 25px 0;
            }
            .features h3 {
              color: #252627;
              margin-bottom: 15px;
              font-size: 18px;
            }
            .features ul {
              margin-left: 20px;
            }
            .features li {
              margin-bottom: 8px;
              color: #64748b;
            }
            .divider {
              height: 1px;
              background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
              margin: 30px 0;
            }
            .footer { 
              background: #f8fafc;
              padding: 30px;
              text-align: center; 
              color: #64748b; 
              font-size: 14px;
              border-top: 1px solid #e2e8f0;
            }
            .footer p {
              margin-bottom: 8px;
            }
            @media (max-width: 600px) {
              .email-container { margin: 20px; }
              .header, .content { padding: 30px 20px; }
              .button { padding: 14px 28px; font-size: 15px; }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <img src="https://schoolmaster.pl/schoolmaster-logo-white.png" alt="SchoolMaster" style="max-width: 250px !important; height: auto !important; margin: 0 auto 15px auto !important; display: block !important;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
              <h1 style="display: none;">Witamy w SchoolMaster!</h1>
              <p>Twoje konto zostało utworzone</p>
            </div>
            <div class="content">
              <h2>Cześć ${userName}!</h2>
              <p>Dziękujemy za rejestrację w SchoolMaster jako <strong>${roleText}</strong>.</p>
              <p>Twoje konto zostało pomyślnie utworzone i możesz już zacząć korzystać z platformy edukacyjnej.</p>
              
              <div class="button-container">
                <a href="${loginUrl}" class="button">Rozpocznij naukę</a>
              </div>
              
              <div class="features">
                ${userRole === 'student' ? `
                  <h3>Co możesz teraz zrobić:</h3>
                  <ul>
                    <li>Przeglądaj dostępne kursy i tematy</li>
                    <li>Znajdź idealnego korepetytora dopasowanego do Twoich potrzeb</li>
                    <li>Zarezerwuj swoją pierwszą lekcję online</li>
                    <li>Śledź swoje postępy i zdobywaj punkty</li>
                    <li>Korzystaj z interaktywnych narzędzi do nauki</li>
                  </ul>
                ` : `
                  <h3>Co możesz teraz zrobić:</h3>
                  <ul>
                    <li>Uzupełnij swój profil korepetytora</li>
                    <li>Ustaw swoją dostępność w kalendarzu</li>
                    <li>Przejrzyj materiały do dostępnych przedmiotów</li>
                    <li>Czekaj na rezerwacje od uczniów</li>
                    <li>Rozpocznij zarabianie jako korepetytor</li>
                  </ul>
                `}
              </div>
              
              <p style="color: #64748b;">Jeśli masz pytania lub potrzebujesz pomocy, napisz do nas na <strong>kontakt@schoolmaster.pl</strong> - odpowiemy najszybciej jak to możliwe!</p>
              
              <div class="divider"></div>
              
              <p style="text-align: center; color: #64748b;">
                <strong>Zespół SchoolMaster</strong><br>
                kontakt@schoolmaster.pl | schoolmaster.pl
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} SchoolMaster. Wszystkie prawa zastrzeżone.</p>
              <p>Ten email został wysłany automatycznie. Nie odpowiadaj na tę wiadomość.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    // Check if SMTP is configured
    if (process.env.SMTP_PASSWORD && process.env.SMTP_USER) {
      console.log('Wysyłanie emaila powitalnego przez SMTP...');
      const transporter = nodemailer.createTransport(getEmailConfig());
      await transporter.sendMail(emailContent);
      console.log('Email powitalny wysłany do:', email);
    } else {
      // For development, log the email
      console.log('=== EMAIL POWITALNY (DEVELOPMENT) ===');
      console.log('Do:', emailContent.to);
      console.log('Użytkownik:', userName);
      console.log('Rola:', roleText);
      console.log('Skonfiguruj SMTP_USER i SMTP_PASSWORD aby wysyłać prawdziwe emaile');
      console.log('======================');
    }

    return true;
  } catch (error) {
    console.error('Błąd wysyłania emaila powitalnego:', error);
    return false;
  }
}

export async function sendLessonInvitationEmail(
  tutorEmail: string,
  tutorName: string,
  studentName: string,
  topicName: string,
  preferredDate: string
): Promise<boolean> {
  try {
    const invitationsUrl = 'https://schoolmaster.pl/tutor-invitations';
    
    const emailContent = {
      from: 'SchoolMaster <noreply@schoolmaster.pl>',
      to: tutorEmail,
      subject: 'Nowe zaproszenie do lekcji - SchoolMaster',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              line-height: 1.6; 
              color: #333; 
              background: #f8fafc;
            }
            .email-container { 
              max-width: 600px; 
              margin: 40px auto; 
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header { 
              background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
              padding: 40px 30px; 
              text-align: center;
            }
            .logo {
              width: 180px;
              height: auto;
              margin-bottom: 15px;
            }
            .header h1 { 
              color: white; 
              font-size: 28px; 
              font-weight: 700;
              margin-bottom: 8px;
            }
            .header p { 
              color: white; 
              font-size: 16px;
              opacity: 0.9;
            }
            .content { 
              padding: 40px 30px;
            }
            .content h2 {
              color: #252627;
              font-size: 24px;
              margin-bottom: 20px;
              text-align: center;
            }
            .content p {
              margin-bottom: 16px;
              font-size: 16px;
              line-height: 1.7;
            }
            .lesson-details {
              background: #f8fafc;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              border-left: 4px solid #1e3a8a;
            }
            .lesson-details h3 {
              color: #1e3a8a;
              font-size: 18px;
              margin-bottom: 10px;
            }
            .lesson-details p {
              margin-bottom: 8px;
              font-size: 15px;
            }
            .button-container {
              text-align: center;
              margin: 30px 0;
            }
            .button { 
              display: inline-block; 
              background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
              color: white !important; 
              text-decoration: none; 
              padding: 16px 32px; 
              border-radius: 8px; 
              font-weight: 600;
              font-size: 16px;
              transition: all 0.3s ease;
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 15px rgba(30, 58, 138, 0.3);
            }
            .footer { 
              background: #f8fafc; 
              padding: 30px; 
              text-align: center; 
              color: #6b7280;
              font-size: 14px;
            }
            .footer p {
              margin-bottom: 8px;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <img src="https://schoolmaster.pl/schoolmaster-logo-white.png" alt="SchoolMaster" class="logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
              <div style="display: none; color: white; font-size: 24px; font-weight: bold;">SchoolMaster</div>
              <h1>Nowe zaproszenie do lekcji</h1>
              <p>Uczeń wysłał Ci zaproszenie do lekcji</p>
            </div>
            
            <div class="content">
              <h2>Cześć ${tutorName}!</h2>
              <p>Otrzymałeś nowe zaproszenie do lekcji od ucznia <strong>${studentName}</strong>.</p>
              
              <div class="lesson-details">
                <h3>Szczegóły zaproszenia:</h3>
                <p><strong>Uczeń:</strong> ${studentName}</p>
                <p><strong>Temat:</strong> ${topicName}</p>
                <p><strong>Preferowany termin:</strong> ${preferredDate}</p>
              </div>
              
              <p>Zaloguj się do swojego panelu, aby zaakceptować lub odrzucić zaproszenie. Pamiętaj, że masz ograniczony czas na odpowiedź.</p>
              
              <div class="button-container">
                <a href="${invitationsUrl}" class="button">Sprawdź zaproszenia</a>
              </div>
              
              <p>Jeśli nie możesz kliknąć w przycisk, skopiuj ten link do przeglądarki:</p>
              <p style="color: #1e3a8a; word-break: break-all;">${invitationsUrl}</p>
            </div>
            
            <div class="footer">
              <p>Ten email został wysłany automatycznie przez system SchoolMaster.</p>
              <p>Jeśli masz pytania, skontaktuj się z nami poprzez platformę.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Nowe zaproszenie do lekcji - SchoolMaster

Cześć ${tutorName}!

Otrzymałeś nowe zaproszenie do lekcji od ucznia ${studentName}.

Szczegóły zaproszenia:
- Uczeń: ${studentName}
- Temat: ${topicName}
- Preferowany termin: ${preferredDate}

Aby zaakceptować lub odrzucić zaproszenie, odwiedź:
${invitationsUrl}

Ten email został wysłany automatycznie przez system SchoolMaster.
      `
    };

    // Check if SMTP is configured
    if (process.env.SMTP_PASSWORD && process.env.SMTP_USER) {
      console.log('Wysyłanie emaila z zaproszeniem do lekcji przez SMTP...');
      const transporter = nodemailer.createTransporter(getEmailConfig());
      await transporter.sendMail(emailContent);
      console.log('Email z zaproszeniem do lekcji wysłany pomyślnie');
    } else {
      // For development, log the email
      console.log('=== EMAIL ZAPROSZENIE (DEVELOPMENT) ===');
      console.log('Do:', emailContent.to);
      console.log('Korepetytor:', tutorName);
      console.log('Uczeń:', studentName);
      console.log('Temat:', topicName);
      console.log('Termin:', preferredDate);
      console.log('Skonfiguruj SMTP_USER i SMTP_PASSWORD aby wysyłać prawdziwe emaile');
      console.log('======================');
    }
    
    return true;
  } catch (error) {
    console.error('Błąd wysyłania emaila z zaproszeniem:', error);
    return false;
  }
}

export async function sendUnreadMessageNotification(
  email: string,
  userName: string,
  unreadCount: number,
  senderName: string,
  lastMessagePreview: string
): Promise<boolean> {
  try {
    const appUrl = process.env.NODE_ENV === 'production' ? 'https://schoolmaster.pl' : 'http://localhost:5000';
    const messagesUrl = `${appUrl}/messages`;
    
    const emailContent = {
      from: 'SchoolMaster <noreply@schoolmaster.pl>',
      to: email,
      subject: `Masz ${unreadCount} ${unreadCount === 1 ? 'nową wiadomość' : unreadCount < 5 ? 'nowe wiadomości' : 'nowych wiadomości'} - SchoolMaster`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              line-height: 1.6; 
              color: #333; 
              background: #f8fafc;
            }
            .email-container { 
              max-width: 600px; 
              margin: 40px auto; 
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header { 
              background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
              padding: 40px 30px; 
              text-align: center;
            }
            .logo {
              width: 120px;
              height: auto;
              margin-bottom: 15px;
            }
            .header h1 { 
              color: white; 
              font-size: 28px; 
              font-weight: 700;
              margin-bottom: 8px;
            }
            .header p { 
              color: white; 
              font-size: 16px;
              opacity: 0.9;
            }
            .content { 
              padding: 40px 30px;
            }
            .content h2 {
              color: #252627;
              font-size: 24px;
              margin-bottom: 20px;
              text-align: center;
            }
            .content p {
              margin-bottom: 16px;
              font-size: 16px;
              line-height: 1.7;
            }
            .message-preview {
              background: #f1f5f9;
              border-left: 4px solid #3b82f6;
              padding: 15px 20px;
              margin: 20px 0;
              border-radius: 0 8px 8px 0;
            }
            .message-preview .sender {
              font-weight: 600;
              color: #1e40af;
              margin-bottom: 8px;
            }
            .message-preview .text {
              color: #475569;
              font-style: italic;
            }
            .button-container {
              text-align: center;
              margin: 30px 0;
            }
            .button { 
              display: inline-block;
              background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
              color: white !important;
              padding: 14px 32px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              transition: all 0.3s ease;
              box-shadow: 0 4px 12px rgba(30, 58, 138, 0.3);
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
            }
            .unread-count {
              background: #ef4444;
              color: white;
              padding: 4px 12px;
              border-radius: 20px;
              font-weight: 600;
              font-size: 14px;
              display: inline-block;
              margin-left: 8px;
              vertical-align: middle;
            }
            .footer { 
              background: #f8fafc; 
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
            .footer p { 
              color: #64748b; 
              font-size: 14px;
              margin-bottom: 8px;
            }
            .footer a { 
              color: #3b82f6; 
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <img src="https://schoolmaster.pl/schoolmaster-logo-white.png" alt="SchoolMaster" style="width: 120px !important; height: auto !important; margin: 0 auto 15px auto !important; display: block !important;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
              <h1 style="display: none; color: white; font-size: 28px; font-weight: 700; margin-bottom: 8px;">SchoolMaster</h1>
              <p>Platforma edukacyjna dla uczniów klasy 8</p>
            </div>
            <div class="content">
              <h2>Masz ${unreadCount === 1 ? 'nową wiadomość' : 'nowe wiadomości'}! <span class="unread-count">${unreadCount}</span></h2>
              
              <p>Cześć ${userName}!</p>
              
              <p>Informujemy, że masz <strong>${unreadCount} ${unreadCount === 1 ? 'nieodczytaną wiadomość' : unreadCount < 5 ? 'nieodczytane wiadomości' : 'nieodczytanych wiadomości'}</strong> na platformie SchoolMaster.</p>
              
              <div class="message-preview">
                <div class="sender">Od: ${senderName}</div>
                <div class="text">"${lastMessagePreview}"</div>
              </div>
              
              <p>Aby przeczytać wszystkie wiadomości i odpowiedzieć, kliknij poniższy przycisk:</p>
              
              <div class="button-container">
                <a href="${messagesUrl}" class="button">Sprawdź wiadomości</a>
              </div>
              
              <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
                To powiadomienie zostało wysłane automatycznie. Możesz zarządzać powiadomieniami w ustawieniach swojego konta.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} SchoolMaster. Wszystkie prawa zastrzeżone.</p>
              <p>Ten email został wysłany automatycznie. Nie odpowiadaj na tę wiadomość.</p>
              <p>kontakt@schoolmaster.pl | schoolmaster.pl</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Cześć ${userName}!

Masz ${unreadCount} ${unreadCount === 1 ? 'nieodczytaną wiadomość' : unreadCount < 5 ? 'nieodczytane wiadomości' : 'nieodczytanych wiadomości'} na platformie SchoolMaster.

Najnowsza wiadomość od: ${senderName}
"${lastMessagePreview}"

Aby przeczytać wszystkie wiadomości, przejdź do:
${messagesUrl}

Pozdrawiamy,
Zespół SchoolMaster
schoolmaster.pl
      `
    };

    // Check if SMTP is configured
    if (process.env.SMTP_PASSWORD && process.env.SMTP_USER) {
      console.log('Wysyłanie powiadomienia o nieodczytanych wiadomościach przez SMTP...');
      const transporter = nodemailer.createTransport(getEmailConfig());
      await transporter.sendMail(emailContent);
      console.log('Powiadomienie o nieodczytanych wiadomościach wysłane do:', email);
    } else {
      // For development, log the email content
      console.log('=== POWIADOMIENIE O NIEODCZYTANYCH WIADOMOŚCIACH (DEVELOPMENT) ===');
      console.log('Do:', emailContent.to);
      console.log('Temat:', emailContent.subject);
      console.log('Nieodczytane:', unreadCount);
      console.log('Od:', senderName);
      console.log('Podgląd:', lastMessagePreview);
      console.log('Link:', messagesUrl);
      console.log('Skonfiguruj SMTP_USER i SMTP_PASSWORD aby wysyłać prawdziwe emaile');
      console.log('=======================');
    }

    return true;
  } catch (error) {
    console.error('Błąd wysyłania powiadomienia o nieodczytanych wiadomościach:', error);
    return false;
  }
}

export async function sendReferralBonusEmail(
  email: string,
  referrerName: string,
  bonusAmount: number,
  referredUserName: string
): Promise<boolean> {
  try {
    const emailContent = {
      from: 'SchoolMaster <noreply@schoolmaster.pl>',
      to: email,
      subject: '🎉 Otrzymałeś bonus polecający! - SchoolMaster',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              line-height: 1.6; 
              color: #333; 
              background: #f8fafc;
            }
            .email-container { 
              max-width: 600px; 
              margin: 40px auto; 
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header { 
              background: linear-gradient(135deg, #F1C40F 0%, #f39c12 100%);
              padding: 40px 30px; 
              text-align: center;
            }
            .header h1 { 
              color: #252627; 
              font-size: 28px; 
              font-weight: 700;
              margin-bottom: 8px;
            }
            .header .emoji {
              font-size: 48px;
              margin-bottom: 15px;
              display: block;
            }
            .content { 
              padding: 40px 30px;
            }
            .content h2 {
              color: #252627;
              font-size: 24px;
              margin-bottom: 20px;
              text-align: center;
            }
            .content p {
              margin-bottom: 16px;
              font-size: 16px;
              line-height: 1.7;
            }
            .bonus-box {
              background: linear-gradient(135deg, #F1C40F 0%, #f39c12 100%);
              padding: 30px;
              border-radius: 12px;
              text-align: center;
              margin: 30px 0;
            }
            .bonus-amount {
              font-size: 48px;
              font-weight: 700;
              color: #252627;
              margin: 10px 0;
            }
            .bonus-label {
              font-size: 14px;
              color: #252627;
              opacity: 0.8;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .button-container {
              text-align: center;
              margin: 30px 0;
            }
            .button { 
              display: inline-block; 
              background: linear-gradient(135deg, #5F5AFC 0%, #4f46e5 100%);
              color: white !important; 
              padding: 16px 32px; 
              text-decoration: none; 
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 4px 15px rgba(95, 90, 252, 0.3);
              transition: all 0.3s ease;
            }
            .info-box {
              background: #f8fafc;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #5F5AFC;
              margin: 20px 0;
            }
            .footer { 
              background: #f8fafc; 
              padding: 30px; 
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
            .footer p { 
              color: #64748b; 
              font-size: 14px;
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <span class="emoji">🎉</span>
              <h1>Gratulacje!</h1>
              <p>Właśnie otrzymałeś bonus polecający</p>
            </div>
            
            <div class="content">
              <h2>Cześć ${referrerName}!</h2>
              
              <p>
                Mamy fantastyczne wieści! Użytkownik <strong>${referredUserName}</strong> 
                ukończył swoją pierwszą lekcję na SchoolMaster dzięki Twojemu poleceniu.
              </p>
              
              <div class="bonus-box">
                <div class="bonus-label">Twój bonus</div>
                <div class="bonus-amount">${bonusAmount.toFixed(2)} zł</div>
              </div>
              
              <p>
                Bonus został automatycznie dodany do Twojego salda polecających i możesz 
                go wykorzystać przy następnych płatnościach za lekcje.
              </p>
              
              <div class="info-box">
                <p>
                  <strong>💡 Wskazówka:</strong> Podziel się swoim kodem polecającym 
                  z kolejnymi znajomymi, aby zdobyć więcej bonusów! Za każdego nowego 
                  użytkownika, który ukończy pierwszą lekcję, otrzymasz ${bonusAmount.toFixed(2)} zł.
                </p>
              </div>
              
              <div class="button-container">
                <a href="${process.env.NODE_ENV === 'production' ? 'https://schoolmaster.pl' : 'http://localhost:5000'}/dashboard/referrals" class="button">
                  Zobacz szczegóły
                </a>
              </div>
              
              <p style="text-align: center; color: #64748b; font-size: 14px;">
                Dziękujemy za polecanie SchoolMaster!
              </p>
            </div>
            
            <div class="footer">
              <p><strong>SchoolMaster</strong></p>
              <p>Platforma korepetycji online</p>
              <p style="margin-top: 15px;">
                Ta wiadomość została wysłana automatycznie. Nie odpowiadaj na nią.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    console.log(`📧 Sending referral bonus email to ${email}:`);
    console.log(`   Referrer: ${referrerName}`);
    console.log(`   Bonus: ${bonusAmount} PLN`);
    console.log(`   Referred user: ${referredUserName}`);

    const config = getEmailConfig();
    if (!config.auth.pass) {
      console.log('⚠️  SMTP not configured. Email preview (would be sent):');
      console.log(JSON.stringify(emailContent, null, 2));
      return true;
    }

    const transporter = nodemailer.createTransporter(config);
    await transporter.sendMail(emailContent);
    console.log('✓ Referral bonus email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending referral bonus email:', error);
    return false;
  }
}