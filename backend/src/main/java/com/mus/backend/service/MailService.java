package com.mus.backend.service;

import jakarta.mail.*;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.util.Properties;

@Service
public class MailService {

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${spring.mail.port:587}")
    private int mailPort;

    @Value("${spring.mail.username:}")
    private String username;

    @Value("${spring.mail.password:}")
    private String password;

    @Value("${spring.mail.properties.mail.smtp.auth:false}")
    private String smtpAuth;

    @Value("${spring.mail.properties.mail.smtp.starttls.enable:false}")
    private String starttlsEnable;

    @Value("${spring.mail.from:}")
    private String mailFrom;

    @Async
    public void sendTwoFactorCode(String toEmail, String userNickname, String code) {
        System.out.println("\n");
        System.out.println("****************************************************************");
        System.out.println("🔑 [ENBIDO.EUS] - CÓDIGO DE SEGURIDAD DE DOBLE FACTOR (2FA)");
        System.out.println("----------------------------------------------------------------");
        System.out.println("Destinatario: " + toEmail + " (" + userNickname + ")");
        System.out.println("Código 2FA:   " + code);
        System.out.println("Expiración:   En 5 minutos");
        System.out.println("****************************************************************");
        System.out.println("\n");

        if (mailHost != null && !mailHost.isEmpty()) {
            try {
                Properties prop = new Properties();
                prop.put("mail.smtp.host", mailHost);
                prop.put("mail.smtp.port", String.valueOf(mailPort));
                prop.put("mail.smtp.auth", smtpAuth);
                prop.put("mail.smtp.starttls.enable", starttlsEnable);
                
                // Configurar timeouts explícitos para evitar bloqueos
                prop.put("mail.smtp.connectiontimeout", "3000");
                prop.put("mail.smtp.timeout", "3000");
                prop.put("mail.smtp.writetimeout", "3000");

                Session session;
                if ("true".equalsIgnoreCase(smtpAuth)) {
                    session = Session.getInstance(prop, new Authenticator() {
                        @Override
                        protected PasswordAuthentication getPasswordAuthentication() {
                            return new PasswordAuthentication(username, password);
                        }
                    });
                } else {
                    session = Session.getInstance(prop);
                }

                Message message = new MimeMessage(session);
                String fromAddress = mailFrom != null && !mailFrom.isEmpty() 
                    ? mailFrom 
                    : (username != null && !username.isEmpty() ? username : "noreply@enbido.eus");
                message.setFrom(new InternetAddress(fromAddress));
                message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail));
                message.setSubject("Enbido.eus - Código de seguridad de Doble Factor");

                String body = "Hola " + userNickname + ",\n\n" +
                        "Tu código de seguridad de 6 dígitos para iniciar sesión es: " + code + "\n\n" +
                        "Este código es válido por 5 minutos.\n\n" +
                        "Si no has intentado iniciar sesión en Enbido.eus, por favor ignora este mensaje.\n\n" +
                        "¡Buena suerte en las mesas de Mus!\n" +
                        "El equipo de Enbido.eus";

                message.setText(body);

                Transport.send(message);
                System.out.println(">>> [MAIL-SERVICE] Correo SMTP enviado con éxito a " + toEmail + " usando Jakarta Mail API directamente");
            } catch (Exception e) {
                System.err.println(">>> [MAIL-SERVICE] Error enviando correo SMTP usando Jakarta Mail: " + e.getMessage());
            }
        } else {
            System.out.println(">>> [MAIL-SERVICE] Servidor SMTP no configurado. Código impreso en consola para desarrollo.");
        }
    }

    @Async
    public void sendResetPasswordEmail(String toEmail, String userNickname, String resetLink) {
        System.out.println("\n");
        System.out.println("****************************************************************");
        System.out.println("🔑 [ENBIDO.EUS] - RESTABLECER CONTRASEÑA / PASAHITZA BERRESKURATU");
        System.out.println("----------------------------------------------------------------");
        System.out.println("Destinatario: " + toEmail + " (" + userNickname + ")");
        System.out.println("Link:         " + resetLink);
        System.out.println("Expiración:   En 15 minutos");
        System.out.println("****************************************************************");
        System.out.println("\n");

        if (mailHost != null && !mailHost.isEmpty()) {
            try {
                Properties prop = new Properties();
                prop.put("mail.smtp.host", mailHost);
                prop.put("mail.smtp.port", String.valueOf(mailPort));
                prop.put("mail.smtp.auth", smtpAuth);
                prop.put("mail.smtp.starttls.enable", starttlsEnable);
                
                prop.put("mail.smtp.connectiontimeout", "3000");
                prop.put("mail.smtp.timeout", "3000");
                prop.put("mail.smtp.writetimeout", "3000");

                Session session;
                if ("true".equalsIgnoreCase(smtpAuth)) {
                    session = Session.getInstance(prop, new Authenticator() {
                        @Override
                        protected PasswordAuthentication getPasswordAuthentication() {
                            return new PasswordAuthentication(username, password);
                        }
                    });
                } else {
                    session = Session.getInstance(prop);
                }

                Message message = new MimeMessage(session);
                String fromAddress = mailFrom != null && !mailFrom.isEmpty() 
                    ? mailFrom 
                    : (username != null && !username.isEmpty() ? username : "noreply@enbido.eus");
                message.setFrom(new InternetAddress(fromAddress));
                message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail));
                message.setSubject("Enbido.eus - Restablecer contraseña / Pasahitza berreskuratu");

                String body = "Hola " + userNickname + ",\n\n" +
                        "Hemos recibido una solicitud para restablecer tu contraseña en Enbido.eus.\n\n" +
                        "Para hacerlo, haz clic en el siguiente enlace:\n" +
                        resetLink + "\n\n" +
                        "Este enlace es válido por 15 minutos.\n\n" +
                        "Si no has solicitado este cambio, por favor ignora este mensaje. Tu contraseña seguirá siendo la misma.\n\n" +
                        "¡Nos vemos en las mesas de Mus!\n" +
                        "El equipo de Enbido.eus";

                message.setText(body);

                Transport.send(message);
                System.out.println(">>> [MAIL-SERVICE] Correo de recuperación SMTP enviado con éxito a " + toEmail);
            } catch (Exception e) {
                System.err.println(">>> [MAIL-SERVICE] Error enviando correo de recuperación SMTP: " + e.getMessage());
            }
        } else {
            System.out.println(">>> [MAIL-SERVICE] Servidor SMTP no configurado. Enlace impreso en consola para desarrollo.");
        }
    }
}
