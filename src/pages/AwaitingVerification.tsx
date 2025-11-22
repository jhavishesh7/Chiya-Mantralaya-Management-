import { Clock, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function AwaitingVerification() {
  const { signOut, profile } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-amber-500 p-4 rounded-full">
            <Clock className="w-12 h-12 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-4 text-gray-800">
          Verification Pending
        </h1>

        <p className="text-center text-gray-600 mb-6 leading-relaxed">
          Welcome, <span className="font-semibold text-gray-800">{profile?.name}</span>!
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-800 text-center">
            Your account is awaiting verification by an administrator. You'll be able to access the application once your account has been verified.
          </p>
        </div>

        <div className="space-y-3 text-sm text-gray-600">
          <p className="flex items-start gap-2">
            <span className="text-orange-500 font-bold">•</span>
            <span>An administrator will review your registration shortly</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-orange-500 font-bold">•</span>
            <span>You'll receive access once your account is verified</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-orange-500 font-bold">•</span>
            <span>Please contact your manager if you need immediate access</span>
          </p>
        </div>

        <button
          onClick={() => signOut()}
          className="mt-8 w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
