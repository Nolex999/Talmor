export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white bg-grid flex items-center justify-center px-6 py-16 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-white/[0.03] rounded-full blur-[150px] animate-float" />
        <div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-white/[0.02] rounded-full blur-[150px] animate-float"
          style={{ animationDelay: '3s' }}
        />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <div className="gradient-border">
          <div className="bg-black/50 backdrop-blur-xl rounded-2xl p-8 sm:p-10">
            <div className="flex justify-center mb-5">
              <img src="/logo.svg" alt="Talmor" className="w-12 h-12 object-contain" />
            </div>

            <h1 className="font-display text-2xl font-bold text-center mb-2 text-white tracking-tight">Privacy Policy</h1>
            <p className="text-zinc-500 text-xs text-center mb-8">Last updated: July 2026</p>

            <div className="space-y-6 text-sm text-zinc-400 leading-relaxed">
              <section>
                <h2 className="font-display text-sm font-semibold text-white mb-2 tracking-wide">1. Information We Collect</h2>
                <p>We collect information you provide directly, including your email address, account credentials, and any data you submit through support tickets.</p>
              </section>

              <section>
                <h2 className="font-display text-sm font-semibold text-white mb-2 tracking-wide">2. How We Use Your Information</h2>
                <p>We use your information to provide and improve the Service, authenticate your account, process support requests, and communicate with you about your account.</p>
              </section>

              <section>
                <h2 className="font-display text-sm font-semibold text-white mb-2 tracking-wide">3. Data Storage & Security</h2>
                <p>Your data is stored on secure, encrypted infrastructure. We employ industry-standard security measures including encryption in transit and at rest. We never store plaintext passwords.</p>
              </section>

              <section>
                <h2 className="font-display text-sm font-semibold text-white mb-2 tracking-wide">4. Data Sharing</h2>
                <p>We do not sell, trade, or rent your personal information to third parties. We may share data only when required by law or to protect the rights and safety of Talmor and its users.</p>
              </section>

              <section>
                <h2 className="font-display text-sm font-semibold text-white mb-2 tracking-wide">5. Cookies</h2>
                <p>We use cookies and similar technologies to maintain your session and authenticate your account. You can configure your browser to refuse cookies, though this may affect functionality.</p>
              </section>

              <section>
                <h2 className="font-display text-sm font-semibold text-white mb-2 tracking-wide">6. Data Retention</h2>
                <p>We retain your data for as long as your account is active. You may request deletion of your account and associated data by contacting support.</p>
              </section>

              <section>
                <h2 className="font-display text-sm font-semibold text-white mb-2 tracking-wide">7. Your Rights</h2>
                <p>You have the right to access, correct, or delete your personal data. To exercise these rights, contact us through our support system.</p>
              </section>

              <section>
                <h2 className="font-display text-sm font-semibold text-white mb-2 tracking-wide">8. Changes to This Policy</h2>
                <p>We may update this Privacy Policy from time to time. We will notify you of significant changes through the Service or via email.</p>
              </section>

              <section>
                <h2 className="font-display text-sm font-semibold text-white mb-2 tracking-wide">9. Contact</h2>
                <p>For privacy-related inquiries, contact us at <a href="/support" className="text-zinc-300 hover:text-white transition-colors underline underline-offset-2">support</a>.</p>
              </section>
            </div>

            <div className="text-center mt-8">
              <a href="/" className="text-[11px] text-zinc-400 hover:text-white transition-colors">&larr; Back to login</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
