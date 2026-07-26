function updateAppHeight(): void {
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
  document.documentElement.classList.add('app-height-ready');
}

export function initViewportHeightFix(): void {
  updateAppHeight();
  window.addEventListener('resize', updateAppHeight);
  window.addEventListener('orientationchange', updateAppHeight);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      updateAppHeight();
    }
  });
}
