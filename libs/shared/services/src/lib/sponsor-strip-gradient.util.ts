export function onSponsorStripGradientEnter(event: MouseEvent): void {
  const strip = event.currentTarget as HTMLElement | null;
  if (!strip) {
    return;
  }

  strip.classList.add('sponsor-strip--gradient-active');
  onSponsorStripGradientMove(event);
}

export function onSponsorStripGradientMove(event: MouseEvent): void {
  const strip = event.currentTarget as HTMLElement | null;
  if (!strip) {
    return;
  }

  const rect = strip.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return;
  }

  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;

  strip.style.setProperty('--sponsor-gradient-x', `${x}%`);
  strip.style.setProperty('--sponsor-gradient-y', `${y}%`);
}

export function onSponsorStripGradientLeave(event: MouseEvent): void {
  const strip = event.currentTarget as HTMLElement | null;
  if (!strip) {
    return;
  }

  strip.classList.remove('sponsor-strip--gradient-active');
}
