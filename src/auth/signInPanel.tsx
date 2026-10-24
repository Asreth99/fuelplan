import { FormEvent, useEffect, useState } from "react";
import Icon from "../icons/icon";
import { AuthError, useAuth } from "./useAuth";
import "./signInPanel.css";

export const PRIVACY_NOTICE_URL = "/privacy.html";
const RESEND_WAIT_S = 30;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = {
  heading: string;
  text: string;
};

/** Google and email-link sign-in. Shown by Profile and Cars while signed out. */
export default function SignInPanel({ heading, text }: Props) {
  const { signInWithGoogle, sendEmailLink, finishEmailLink, emailLink, resetEmailLink } = useAuth();
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn(resendIn - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof AuthError ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const checkEmail = () => {
    const valid = EMAIL_PATTERN.test(email.trim());
    setEmailError(valid ? "" : "Enter a valid email address.");
    return valid;
  };

  const send = (e?: FormEvent) => {
    e?.preventDefault();
    const address = sentTo ?? email.trim();
    if (!sentTo && !checkEmail()) return;
    run(async () => {
      await sendEmailLink(address);
      resetEmailLink();
      setSentTo(address);
      setResendIn(RESEND_WAIT_S);
    });
  };

  const finish = (e: FormEvent) => {
    e.preventDefault();
    if (checkEmail()) run(() => finishEmailLink(email.trim()));
  };

  const errorLine = error && (
    <p className="signin__error" role="alert">
      {error}
    </p>
  );

  if (emailLink === "checking") {
    return (
      <div className="signin-sent">
        <span className="signin-sent__art">
          <Icon name="mail" />
        </span>
        <h2>Signing you in…</h2>
      </div>
    );
  }

  if (emailLink === "needs-email") {
    return (
      <form className="signin" noValidate onSubmit={finish}>
        <h2 className="signin__title">Confirm your email</h2>
        <p className="signin__text">
          You opened the sign-in link on another device or browser. Enter the email address you asked for the link
          with, to finish signing in.
        </p>
        {errorLine}
        <EmailField value={email} error={emailError} onChange={setEmail} autoFocus />
        <button type="submit" className="btn btn--primary signin__submit" disabled={busy}>
          Sign in
        </button>
      </form>
    );
  }

  if (sentTo) {
    return (
      <div className="signin-sent">
        <span className="signin-sent__art">
          <Icon name="mail" />
        </span>
        <h2>Check your inbox</h2>
        <p>
          We sent a sign-in link to <b>{sentTo}</b>. Open it on this device and you're in.
        </p>
        {errorLine}
        <div className="signin-sent__actions">
          <button type="button" className="link" disabled={busy || resendIn > 0} onClick={() => send()}>
            {resendIn > 0 ? `Resend (${resendIn} s)` : "Resend"}
          </button>
          <button type="button" className="link" onClick={() => setSentTo(null)}>
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="signin">
      <h2 className="signin__title">{heading}</h2>
      <p className="signin__text">{text}</p>
      {emailLink === "expired" && (
        <p className="signin__error" role="alert">
          This link has expired. We can send a new one: enter your email below.
        </p>
      )}
      {errorLine}
      {/* Google's branded button, dark pill version (Sign in with Google branding guidelines) */}
      <button type="button" className="google-btn" disabled={busy} onClick={() => run(signInWithGoogle)}>
        <span className="google-btn__logo">
          <GoogleLogo />
        </span>
        <span className="google-btn__label">Sign in with Google</span>
      </button>
      <span className="signin__or">or by email, no password</span>
      <form className="signin__email" noValidate onSubmit={send}>
        <EmailField value={email} error={emailError} onChange={setEmail} />
        <button type="submit" className="btn btn--secondary" disabled={busy}>
          <Icon name="mail" />
          Send sign-in link
        </button>
      </form>
      <p className="signin__legal">
        By signing in you accept the{" "}
        <a href={PRIVACY_NOTICE_URL} target="_blank" rel="noreferrer">
          privacy notice
        </a>
        . We never store passwords.
      </p>
    </div>
  );
}

// Google's four-colour "G", as published in its sign-in branding kit.
function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

type EmailFieldProps = {
  value: string;
  error: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
};

function EmailField({ value, error, onChange, autoFocus }: EmailFieldProps) {
  return (
    <label className="field">
      <span className="field__label">Email</span>
      <input
        className="field__input"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="name@example.com"
        autoFocus={autoFocus}
        value={value}
        aria-invalid={Boolean(error)}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <span className="field__error">{error}</span>}
    </label>
  );
}
