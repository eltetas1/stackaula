'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CreateFamilyForm() {
  const [email, setEmail] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setOk(null); setErr(null); setInviteLink(null);
    try {
      const res = await fetch('/api/families/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-admin-secret': process.env.NEXT_PUBLIC_DEV_ADMIN_SECRET || ''
        },
        body: JSON.stringify({ email, guardianName, studentName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setOk('Familia creada.');
      setInviteLink(data.inviteLink);
      setEmail(''); setGuardianName(''); setStudentName('');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-xl">
      <CardHeader><CardTitle>Dar de alta familia</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>Email de la familia</Label>
            <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          <div>
            <Label>Nombre del tutor/a</Label>
            <Input value={guardianName} onChange={e=>setGuardianName(e.target.value)} />
          </div>
          <div>
            <Label>Nombre del alumno/a</Label>
            <Input value={studentName} onChange={e=>setStudentName(e.target.value)} />
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear e invitar (local)'}
            </Button>
            {ok && <span className="text-green-600 text-sm">{ok}</span>}
            {err && <span className="text-red-600 text-sm">{err}</span>}
          </div>

          {inviteLink && (
            <p className="text-sm mt-3">
              Enlace de activación (local):{' '}
              <a className="text-blue-600 underline break-all" href={inviteLink}>{inviteLink}</a>
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
