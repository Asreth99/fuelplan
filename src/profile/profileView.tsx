import { useState } from "react";
import Icon from "../icons/icon";
import Modal from "../modal/modal";
import SignInPanel, { PRIVACY_NOTICE_URL } from "../auth/signInPanel";
import { AuthError, initialsOf, SignInMethod, useAuth } from "../auth/useAuth";
import { useCars } from "../cars/useCars";
import { useView } from "../navigation/useView";
import { useToast } from "../toast/toast";
import AppearanceSetting from "../appearance/appearanceSetting";
import "./profileView.css";

const METHOD_LABELS: Record<SignInMethod, string> = {
  google: "Google account",
  email: "Email link",
};

const SYNC_TEXT = {
  synced: "Synced: your cars are on all your devices.",
  saving: "Saving your changes…",
  offline: "You're offline. Changes are saved as soon as you're back online.",
};

/** The account: who is signed in, sync status, sign out and delete account. */
export default function ProfileView() {
  const { available, ready, user, method, signOut } = useAuth();
  const { cars, syncStatus } = useCars();
  const { setView } = useView();
  const showToast = useToast();
  const [deleting, setDeleting] = useState(false);

  // Appearance works without an account, so it is on every version of this screen.
  if (!available || !ready || !user || !method) {
    return (
      <>
        {!available ? (
          <p className="profile-note">Accounts aren't available right now.</p>
        ) : (
          ready && (
            <SignInPanel
              heading="Sign in to FuelPlan"
              text="Your cars go to your account: they're on every device and never lost."
            />
          )
        )}
        <AppearanceSetting />
      </>
    );
  }

  const email = user.email ?? "";
  return (
    <>
      <h1 className="visually-hidden">Profile</h1>
      <section className="profile-card" aria-label="Account">
        <span className="profile-card__avatar" aria-hidden="true">
          {initialsOf(user)}
        </span>
        <span className="profile-card__who">
          <b>{user.displayName || email}</b>
          {user.displayName && <span>{email}</span>}
        </span>
        <span className="profile-card__method">{METHOD_LABELS[method]}</span>
      </section>

      <p className={`profile-sync profile-sync--${syncStatus}`} role="status">
        <Icon name={syncStatus === "offline" ? "cloudOff" : "cloudCheck"} />
        {SYNC_TEXT[syncStatus]}
      </p>

      <ul className="profile-list">
        <li>
          <button type="button" className="profile-row" onClick={() => setView("cars")}>
            <Icon name="car" />
            <span>My cars</span>
            <span className="profile-row__meta">
              {cars.length} {cars.length === 1 ? "car" : "cars"}
            </span>
            <Icon name="chevron" className="profile-row__chevron" />
          </button>
        </li>
        <li>
          <a className="profile-row" href={PRIVACY_NOTICE_URL} target="_blank" rel="noreferrer">
            <Icon name="shield" />
            <span>Privacy notice</span>
            <Icon name="chevron" className="profile-row__chevron" />
          </a>
        </li>
        <li>
          <button
            type="button"
            className="profile-row"
            onClick={async () => {
              await signOut();
              showToast("Signed out");
            }}
          >
            <Icon name="logout" />
            <span>Sign out</span>
          </button>
        </li>
      </ul>

      <AppearanceSetting />

      <section className="danger-zone" aria-labelledby="danger-zone-title">
        <h2 id="danger-zone-title">Delete account</h2>
        <p>Permanently deletes your account and all your saved cars.</p>
        <button type="button" className="btn btn--danger-outline" onClick={() => setDeleting(true)}>
          <Icon name="trash" />
          Delete account
        </button>
      </section>

      {deleting && <DeleteAccountDialog email={email} carCount={cars.length} onClose={() => setDeleting(false)} />}
    </>
  );
}

type DeleteProps = { email: string; carCount: number; onClose: () => void };

function DeleteAccountDialog({ email, carCount, onClose }: DeleteProps) {
  const { deleteAccount } = useAuth();
  const showToast = useToast();
  const [understood, setUnderstood] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      await deleteAccount();
      // Signed out now: the profile shows the sign-in panel and this dialog goes away with it.
      showToast("Your account and data were deleted");
    } catch (e) {
      setError(e instanceof AuthError ? e.message : "We couldn't delete your account. Please try again.");
      setBusy(false);
    }
  };

  return (
    <Modal title="Delete account?" onClose={onClose}>
      <p className="delete-dialog__text">
        We'll permanently delete your account{email && <> (<b>{email}</b>)</>} and your saved cars (
        <b>{carCount}</b>). This can't be undone.
      </p>
      <p className="delete-dialog__note">
        <Icon name="info" />
        For your security, we first confirm it's you, the same way you sign in.
      </p>
      {error && (
        <p className="delete-dialog__error" role="alert">
          {error}
        </p>
      )}
      <label className="delete-dialog__check">
        <input type="checkbox" data-autofocus checked={understood} onChange={(e) => setUnderstood(e.target.checked)} />
        I understand that deletion is final.
      </label>
      <footer className="delete-dialog__foot">
        <button type="button" className="btn btn--secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn btn--danger" disabled={!understood || busy} onClick={confirm}>
          Delete account permanently
        </button>
      </footer>
    </Modal>
  );
}
