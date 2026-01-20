import { ImapFlow } from 'imapflow';

const IMAP_HOST = process.env.IMAP_HOST || 'mail.usgrp.xyz';
const IMAP_PORT = parseInt(process.env.IMAP_PORT || '993');

export async function verifyCredentials(email: string, password: string): Promise<boolean> {
    const client = new ImapFlow({
        host: IMAP_HOST,
        port: IMAP_PORT,
        secure: true,
        auth: {
            user: email,
            pass: password,
        },
        logger: false,
    });

    try {
        await client.connect();
        await client.logout();
        return true;
    } catch (error) {
        console.error('IMAP auth failed:', error);
        return false;
    }
}
