import { TrustScoreTrackerDemo } from "@/components/TrustScoreTrackerDemo";
import { FHECounterDemo } from "@/components/FHECounterDemo";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 py-8">
      <div className="flex flex-col gap-12 items-center w-full px-3 md:px-0 max-w-6xl mx-auto">
        <header className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            FHE Trust Score Platform
          </h1>
          <p className="text-gray-600 text-lg">Secure, private trust tracking with fully homomorphic encryption</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">FHE Counter</h2>
            <FHECounterDemo />
          </div>
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Trust Score Tracker</h2>
            <TrustScoreTrackerDemo />
          </div>
        </div>
      </div>
    </main>
  );
}
