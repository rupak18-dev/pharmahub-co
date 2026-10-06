import { toast } from "sonner";

// The server can hand back the plaintext code as `devCode` in two situations
// (see `shouldEchoDevCode` in pharmahub-server):
//
//   - emailReason set   → no provider is configured, nothing was ever sent, and
//                         this code is the only way to activate the account.
//   - emailReason null  → the email WAS delivered and this is a dev-convenience
//                         echo (EMAIL_SHOW_CODE), so the code is also sitting in
//                         the user's inbox.
//
// The copy has to distinguish those, otherwise a delivered code is announced as
// "this was never sent", which is exactly the wrong thing to tell someone.
//
// The colours come from the tokens in styles.css:83-84 (--accent /
// --accent-foreground) and styles.css:73 (--primary), so this stays on-theme.
// `position` is a Toaster-level prop (set to "top-right" in AppRoot.jsx), so
// the popup lands on the side of the screen without being restated here.
const OTP_TOAST_OPTIONS = {
  // A code the user still has to copy and type should outlive a 4s toast.
  duration: 60_000,
  unstyled: true,
};

function describeDelivery(emailReason) {
  return emailReason
    ? "Email delivery isn't configured on this server, so this code was never sent. Enter it below to activate your account."
    : "This code was also emailed to you — it's shown here so you don't have to check your inbox.";
}

export function showOtpToast(code, { title = "Your verification code", emailReason = null } = {}) {
  if (!code) return null;

  return toast.custom(
    (id) => (
      <div
        role="status"
        className="flex w-[340px] items-start gap-3 rounded-2xl border border-[#007A5A]/35 bg-[#E6F4F1] p-4 shadow-lg"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#0B3D31]">{title}</p>
          <p className="mt-1 font-mono text-[26px] font-bold leading-none tracking-[0.35em] text-[#007A5A]">
            {code}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[#0B3D31]/70">
            {describeDelivery(emailReason)}
          </p>
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => toast.dismiss(id)}
          className="-m-1 shrink-0 rounded-lg p-1 text-[#0B3D31]/50 transition-colors hover:bg-[#007A5A]/10 hover:text-[#0B3D31]"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    ),
    OTP_TOAST_OPTIONS,
  );
}
