import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
    try {
        const { from, to, subject, body } = await request.json();

        if (!to || !subject || !body) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Create transporter using Brevo SMTP relay
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Send mail
        await transporter.sendMail({
            from: from || 'admin@usgrp.xyz',
            to,
            subject,
            text: body,
            html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #1a2332; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="color: #2196f3; margin: 0;">USGRP Admin</h2>
                </div>
                <div style="background: #0f1419; padding: 24px; border-radius: 0 0 8px 8px; color: #b0bec5;">
                    <p style="white-space: pre-wrap; margin: 0; line-height: 1.6;">${body.replace(/\n/g, '<br>')}</p>
                    <hr style="border: none; border-top: 1px solid #243044; margin: 24px 0;" />
                    <p style="font-size: 12px; color: #78909c; margin: 0;">
                        Sent from USGRP Admin Dashboard<br />
                        By: ${from || 'Unknown'}
                    </p>
                </div>
            </div>`,
        });

        return NextResponse.json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        console.error('Mail send error:', error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
}
