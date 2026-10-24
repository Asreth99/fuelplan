import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import {
  AuthCredential,
  deleteUser,
  GoogleAuthProvider,
  isSignInWithEmailLink,
  linkWithCredential,
  onAuthStateChanged,
  reauthenticateWithPopup,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  signOut as firebaseSignOut,
  User,
} from "firebase/auth";
import { accountsAvailable, clearLocalData, firebaseAuth } from "../firebase/firebase";
import { deleteAllUserData } from "../cars/carRepository";
import { useToast } from "../toast/toast";

// Apple sign-in was dropped until there is an Apple Developer account (2026-10-24).
export type SignInMethod = "google" | "email";

// "checking": signing in with the link this page was opened with.
// "needs-email": the link was opened on another device, so Firebase needs the address again.
export type EmailLinkState = "none" | "checking" | "needs-email" | "expired";

type AuthContextValue = {
  available: boolean;
  openedWithSignInLink: boolean;
  ready: boolean;
  user: User | null;
  method: SignInMethod | null;
  emailLink: EmailLinkState;
  signInWithGoogle: () => Promise<void>;
  sendEmailLink: (email: string) => Promise<void>;
  finishEmailLink: (email: string) => Promise<void>;
  resetEmailLink: () => void;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const EMAIL_KEY = "fuelplan.emailForSignIn";
const RECENT_SIGN_IN_MS = 5 * 60 * 1000;

/** A sign-in error with a message for the user. Cancelled popups never become one. */
export class AuthError extends Error {}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}

// "Anna Kovács" → "AK"; without a name, the first letter of the email.
export function initialsOf(user: User) {
  const words = (user.displayName ?? "").trim().split(/\s+/).filter(Boolean);
  const initials = words.length ? words[0][0] + (words.length > 1 ? words[words.length - 1][0] : "") : user.email?.[0];
  return (initials ?? "?").toUpperCase();
}

const methodOf = (user: User | null): SignInMethod | null =>
  !user ? null : user.providerData.some((p) => p.providerId === "google.com") ? "google" : "email";

const errorCode = (error: unknown) => (error as { code?: string })?.code ?? "";

function messageFor(error: unknown) {
  const code = errorCode(error);
  switch (code) {
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in window. Allow pop-ups for FuelPlan and try again.";
    case "auth/network-request-failed":
      return "No internet connection. Try again when you're online.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/invalid-action-code":
    case "auth/expired-action-code":
      return "This link has expired. We can send a new one.";
    // The address the app runs on (e.g. a test tunnel) isn't in Firebase's authorized domains.
    case "auth/unauthorized-domain":
    case "auth/unauthorized-continue-uri":
      return `Sign-in isn't enabled on ${window.location.host} yet.`;
    default:
      // The code helps when someone reports the problem.
      return `Something went wrong while signing in${code ? ` (${code})` : ""}. Please try again.`;
  }
}

// Closing the Google window is a choice, not an error.
const isCancelled = (error: unknown) =>
  ["auth/popup-closed-by-user", "auth/cancelled-popup-request", "auth/user-cancelled"].includes(errorCode(error));

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = firebaseAuth();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!auth);
  // The sign-in link this page was opened with, if any.
  const [signInLink] = useState(() =>
    auth && isSignInWithEmailLink(auth, window.location.href) ? window.location.href : null
  );
  const [emailLink, setEmailLink] = useState<EmailLinkState>(() =>
    !signInLink ? "none" : window.localStorage.getItem(EMAIL_KEY) ? "checking" : "needs-email"
  );
  // Google tried with an email that already has an account. It is added to that account once
  // the user signs in with the email link.
  const pendingCredential = useRef<AuthCredential | null>(null);

  const showToast = useToast();
  useEffect(() => {
    if (!auth) return;
    let restored = false;
    return onAuthStateChanged(auth, (next) => {
      // The first call restores the saved session; later ones are the user signing in or out.
      if (restored && next) showToast("Signed in");
      restored = true;
      setUser(next);
      setReady(true);
    });
  }, [auth, showToast]);

  const linkPendingCredential = async (signedIn: User) => {
    const credential = pendingCredential.current;
    pendingCredential.current = null;
    if (credential) await linkWithCredential(signedIn, credential).catch(() => {});
  };

  const completeEmailLink = async (email: string) => {
    if (!auth || !signInLink) return;
    try {
      const result = await signInWithEmailLink(auth, email, signInLink);
      window.localStorage.removeItem(EMAIL_KEY);
      setEmailLink("none");
      await linkPendingCredential(result.user);
    } catch (error) {
      if (["auth/invalid-action-code", "auth/expired-action-code"].includes(errorCode(error))) setEmailLink("expired");
      else throw new AuthError(messageFor(error));
    }
  };

  // Opening a sign-in link on the device that asked for it signs in straight away.
  // The one-time code is removed from the address bar, so it can't be bookmarked or shared.
  const linkHandled = useRef(false);
  useEffect(() => {
    if (!signInLink || linkHandled.current) return;
    linkHandled.current = true;
    window.history.replaceState(null, "", window.location.pathname);
    const email = window.localStorage.getItem(EMAIL_KEY);
    if (email) completeEmailLink(email).catch(() => setEmailLink("needs-email"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signInLink]);

  const value: AuthContextValue = {
    available: accountsAvailable,
    openedWithSignInLink: signInLink !== null,
    ready,
    user,
    method: methodOf(user),
    emailLink,

    signInWithGoogle: async () => {
      if (!auth) return;
      try {
        await signInWithPopup(auth, new GoogleAuthProvider());
      } catch (error) {
        if (isCancelled(error)) return;
        if (errorCode(error) === "auth/account-exists-with-different-credential") {
          pendingCredential.current = GoogleAuthProvider.credentialFromError(error as never);
          throw new AuthError(
            "This email already has a FuelPlan account. Sign in with an email link first; Google is then added to it."
          );
        }
        throw new AuthError(messageFor(error));
      }
    },

    sendEmailLink: async (email) => {
      if (!auth) return;
      try {
        await sendSignInLinkToEmail(auth, email, {
          url: window.location.origin + window.location.pathname,
          handleCodeInApp: true,
        });
        window.localStorage.setItem(EMAIL_KEY, email);
      } catch (error) {
        throw new AuthError(messageFor(error));
      }
    },

    finishEmailLink: completeEmailLink,

    resetEmailLink: () => setEmailLink("none"),

    // The cars cached on this device are removed too, which matters on shared computers.
    signOut: async () => {
      if (!auth) return;
      await firebaseSignOut(auth);
      await clearLocalData().catch(() => {});
    },

    // Firebase deletes an account only right after a sign-in, so the user confirms it's them first.
    deleteAccount: async () => {
      const current = auth?.currentUser;
      if (!auth || !current) return;
      try {
        if (methodOf(current) === "google") {
          await reauthenticateWithPopup(current, new GoogleAuthProvider());
        } else if (Date.now() - Date.parse(current.metadata.lastSignInTime ?? "") > RECENT_SIGN_IN_MS) {
          throw new AuthError(
            "For your security, sign out and sign in again with a new email link, then delete your account."
          );
        }
        await deleteAllUserData(current.uid);
        await deleteUser(current);
        await clearLocalData().catch(() => {});
      } catch (error) {
        if (error instanceof AuthError) throw error;
        if (isCancelled(error)) throw new AuthError("Deletion was cancelled. Your account is unchanged.");
        throw new AuthError(
          errorCode(error) === "auth/network-request-failed"
            ? messageFor(error)
            : "We couldn't delete your account. Please try again."
        );
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
