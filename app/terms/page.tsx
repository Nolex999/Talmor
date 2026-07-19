export default function TermsPage() {
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

            <h1 className="font-display text-2xl font-bold text-center mb-2 text-white tracking-tight">Terms of Service</h1>
            <p className="text-zinc-500 text-xs text-center mb-8">Last updated: July 2026</p>

            <div className="space-y-6 text-sm text-zinc-400 leading-relaxed">
              <section>
                <h2 className="font-display text-sm font-semibold text-white mb-2 tracking-wide">1. Acceptance of Terms</h2>
                <p>By accessing or using Talmor (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
              </section>

              <section>
                <h2 className="font-display text-sm font-semibold text-white mb-2 tracking-wide">2. Account Security</h2>
                <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.</p>
              </section>

              <section>
                <h2 className="font-display text-sm font-semibold text-white mb-2 tracking-wide">3. Acceptable Use</h2>
                <p>You agree not to misuse the Service, attempt to access it without authorization, or use it for any unlawful purpose. Violation may result in immediate account termination.</p>
              </section>

              <section>
                <h2 className="font-display text-sm font-semibold text-white mb-2 tracking-wide">4. Intellectual Property</h2>
                <p>All content, trademarks, and materials on the Service are the property of Talmor and are protected by applicable intellectual property laws.</p>
              </section>

              <section>
                <h2 className="font-display text-sm font-semibold text-white mb-2 tracking-wide">5. Limitation of Liability</h2>
                <p>Talmor is provided &quot;as is&quot; without warranties of any kind. We shall not be liable for any damages arising from the use of the Service.</p>
              </section>

              <section>
                <h2 className="font-display text-sm font-semibold text-white mb-2 tracking-wide">6. Termination</h2>
                <p>We reserve the right to suspend or terminate your access to the Service at our sole discretion, without notice, for conduct that violates these Terms.</p>
              </section>

              <section>
                <h2 className="font-display text-sm font-semibold text-white mb-2 tracking-wide">7. Changes to Terms</h2>
                <p>We may update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.</p>
              </section>

              <section>
                <h2 className="font-display text-sm font-semibold text-white mb-2 tracking-wide">8. Contact</h2>
                <p>For questions about these Terms, contact us at <a href="/support" className="text-zinc-300 hover:text-white transition-colors underline underline-offset-2">support</a>.</p>
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
