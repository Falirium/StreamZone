import Link from 'next/link';

export const metadata = { title: 'TV Setup Guide — StreamZone' };

export default function TvHelpPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
      {/* Decorative Glow */}
      <div className="absolute top-1/4 left-0 w-80 h-80 bg-brand-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">Smart TV Setup Guide</h1>
        <p className="text-white/60 text-sm sm:text-base max-w-xl mx-auto">
          Learn how to stream live matches on the big screen using Chromecast, AirPlay, or your TV's built-in web browser.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Method 1: Casting */}
        <div className="glass border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-brand-500/10 text-brand-400 rounded-2xl flex items-center justify-center text-xl font-bold mb-6 border border-brand-500/20">
              📺
            </div>
            <h3 className="text-xl font-bold text-white mb-3">1. Cast from Phone or Laptop</h3>
            <p className="text-white/70 text-sm leading-relaxed mb-6">
              Our player supports native browser casting which is the easiest way to watch on a Smart TV.
            </p>
            <ul className="space-y-3.5 text-xs text-white/60">
              <li className="flex items-start gap-2.5">
                <span className="text-brand-400 font-bold">•</span>
                <span><strong>Chromecast (Android/PC):</strong> Open the stream on Google Chrome, tap the cast button in the player controls or browser menu, and select your TV device.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-brand-400 font-bold">•</span>
                <span><strong>AirPlay (iOS/Mac):</strong> Open the stream on Apple Safari, tap the AirPlay icon in the player or Control Center, and select your Apple TV or compatible Smart TV.</span>
              </li>
            </ul>
          </div>
          <div className="mt-8 pt-6 border-t border-white/5">
            <span className="text-xs font-semibold text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-full">Recommended</span>
          </div>
        </div>

        {/* Method 2: Smart TV Browser */}
        <div className="glass border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center text-xl font-bold mb-6 border border-emerald-500/20">
              🌐
            </div>
            <h3 className="text-xl font-bold text-white mb-3">2. Built-in Smart TV Browser</h3>
            <p className="text-white/70 text-sm leading-relaxed mb-6">
              If your TV does not support casting, you can use your TV's built-in web browser directly.
            </p>
            <ul className="space-y-3.5 text-xs text-white/60">
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Open the internet/web browser app on your Smart TV (Samsung Tizen, LG WebOS, Android TV, etc.).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Navigate to our website URL and log in by entering your phone number.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Check the generated OTP code on your mobile device terminal, enter it on the TV screen to log in, and open the watch page.</span>
              </li>
            </ul>
          </div>
          <div className="mt-8 pt-6 border-t border-white/5">
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">Alternative</span>
          </div>
        </div>
      </div>

      {/* Troubleshooting Section */}
      <div className="glass border border-white/10 rounded-3xl p-6 sm:p-8">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span>⚠️</span> TV Troubleshooting Tips
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-white/70 leading-relaxed">
          <div>
            <h4 className="font-semibold text-white mb-1.5">No Cast Device Found?</h4>
            <p className="text-xs text-white/60">
              Ensure that your casting device (phone/tablet/laptop) and your Smart TV or Chromecast are connected to the exact same Wi-Fi network. Restart your browser or cast connection and try again.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-1.5">TV Browser Playback Issues?</h4>
            <p className="text-xs text-white/60">
              TV browsers are often simplified. If the player does not load or quality controls do not respond, we highly recommend using the Chromecast/AirPlay casting method from a mobile device instead.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/events"
          className="inline-flex px-8 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm transition-all shadow-[0_0_15px_rgba(76,110,245,0.3)]"
        >
          View Live Events
        </Link>
      </div>
    </div>
  );
}
