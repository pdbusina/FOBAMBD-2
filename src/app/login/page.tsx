import StaffLoginForm from '@/features/auth/components/StaffLoginForm';

export const runtime = 'edge';

export default function LoginPage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-50">
            <StaffLoginForm />
        </main>
    );
}
