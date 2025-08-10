import React, { useState } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { startServerRegistration, finishServerRegistration } from '../../lib/webauthn';
import { useAppState } from '../../state';

export default function Register() {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const registerUser = useAppState((s) => s.registerUser);

    async function onRegister() {
        if (!name.trim()) return;
        setLoading(true);
        try {
            const email = `${name.trim().toLowerCase().replace(/\s+/g, '')}@local`; // placeholder email
            const { userId, options } = await startServerRegistration(email);
            const cred = (await navigator.credentials.create({ publicKey: options })) as PublicKeyCredential | null;
            if (!cred) throw new Error('Registration cancelled');
            await finishServerRegistration(userId, email, cred);
            registerUser(name.trim());
            alert('Registered. You can now use passkey to unlock.');
            window.location.href = '/';
        } catch (e: any) {
            alert(e?.message ?? 'Registration failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto max-w-md p-4">
            <Card className="p-4">
                <h1 className="mb-2 text-lg font-semibold">Create your profile</h1>
                <p className="mb-4 text-sm text-neutral-500">Register a user and set up a passkey on this device.</p>
                <div className="space-y-3">
                    <div>
                        <div className="text-xs text-neutral-500">Name</div>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                    </div>
                    <Button onClick={onRegister} disabled={loading || !name.trim()}>{loading ? 'Registering…' : 'Register with passkey'}</Button>
                </div>
            </Card>
        </div>
    );
}


