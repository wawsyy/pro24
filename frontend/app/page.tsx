import { TrustScoreTrackerDemo } from "@/components/TrustScoreTrackerDemo";
import { FHECounterDemo } from "@/components/FHECounterDemo";
import { useState } from "react";

export default function Home() {
  const [isDark, setIsDark] = useState(false);

  return (
    <main className={`min-h-screen py-8 transition-colors duration-300 ${
      isDark
        ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900'
        : 'bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100'
    }`}>
      <div className="flex flex-col gap-12 items-center w-full px-3 md:px-0 max-w-6xl mx-auto">
        <header className="text-center relative">
          <button
            onClick={() => setIsDark(!isDark)}
            className="absolute right-0 top-0 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors duration-200"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 001.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
          <h1 className={`text-4xl font-bold mb-2 ${
            isDark ? 'text-white' : 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'
          }`}>
            FHE Trust Score Platform
          </h1>
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Secure, private trust tracking with fully homomorphic encryption
          </p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 w-full">
          <div className="flex flex-col items-center">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4 text-center">FHE Counter</h2>
            <div className="w-full max-w-md">
              <FHECounterDemo />
            </div>
          </div>
          <div className="flex flex-col items-center">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4 text-center">Trust Score Tracker</h2>
            <div className="w-full max-w-md">
              <TrustScoreTrackerDemo />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
