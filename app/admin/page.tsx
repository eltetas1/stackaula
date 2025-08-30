'use client';
import CreateFamilyForm from '@/components/admin/CreateFamilyForm';

export default function AdminPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Panel Admin (local)</h1>
      <CreateFamilyForm />
    </div>
  );
}
