// Rewarded-ad hook. Prototype: show a placeholder for a moment, then reward.
// Later, swap in the CrazyGames, Poki or AdMob SDK behind this one function.

import { ADS } from '../config.js';

let busy = false;

export function showRewardedAd(onReward) {
  if (busy) return;
  busy = true;
  const el = document.createElement('div');
  el.className = 'ad-placeholder';
  el.innerHTML = '<div class="ad-box"><div class="label">Advertisement</div><div class="ad-spinner"></div><div class="label muted">Reward in a moment…</div></div>';
  document.body.appendChild(el);
  setTimeout(() => {
    el.remove();
    busy = false;
    onReward();
  }, ADS.fakeDelay * 1000);
}
