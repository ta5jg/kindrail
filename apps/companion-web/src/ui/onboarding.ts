const KEY = "kr_onboarding_v1_done";

export function isOnboardingDone(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return true;
  }
}

export function setOnboardingDone(): void {
  try {
    window.localStorage.setItem(KEY, "1");
  } catch {
    // ignore
  }
}
