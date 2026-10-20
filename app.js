'use strict';

const carousel = document.querySelector('.carousel');
const slides = document.querySelector('#slides');
const dots = [...document.querySelectorAll('.dot')];
const toggle = document.querySelector('.carousel-toggle');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
let current = 0;
let timer;
let paused = motion.matches;
let pointerStart;

function showSlide(index) {
  current = (index + dots.length) % dots.length;
  slides.style.transform = `translateX(-${current * 100 / dots.length}%)`;
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === current);
    dot.setAttribute('aria-current', String(i === current));
  });
  [...slides.children].forEach((slide, i) => slide.setAttribute('aria-hidden', String(i !== current)));
}
function restartCarousel() {
  clearInterval(timer);
  if (!paused && !document.hidden && !carousel.matches(':hover') && !carousel.contains(document.activeElement)) {
    timer = setInterval(() => showSlide(current + 1), 4600);
  }
  toggle.setAttribute('aria-label', paused ? '播放轮播' : '暂停轮播');
  toggle.querySelector('path').setAttribute('d', paused ? 'M8 5v14l11-7z' : 'M7 5h3v14H7zm7 0h3v14h-3z');
}
dots.forEach((dot, i) => dot.addEventListener('click', () => { showSlide(i); restartCarousel(); }));
toggle.addEventListener('click', () => { paused = !paused; restartCarousel(); });
carousel.addEventListener('pointerdown', e => {
  if (e.target.closest('button') || (e.pointerType === 'mouse' && e.button !== 0)) return;
  pointerStart = { x: e.clientX, y: e.clientY, id: e.pointerId };
  carousel.setPointerCapture(e.pointerId);
  clearInterval(timer);
});
carousel.addEventListener('pointerup', e => {
  if (!pointerStart || pointerStart.id !== e.pointerId) return;
  const dx = e.clientX - pointerStart.x;
  const dy = e.clientY - pointerStart.y;
  if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy) * 1.2) showSlide(current + (dx < 0 ? 1 : -1));
  pointerStart = null;
  restartCarousel();
});
carousel.addEventListener('pointercancel', () => { pointerStart = null; restartCarousel(); });
carousel.addEventListener('keydown', e => {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  e.preventDefault();
  showSlide(current + (e.key === 'ArrowRight' ? 1 : -1));
  restartCarousel();
});
carousel.addEventListener('mouseenter', () => clearInterval(timer));
carousel.addEventListener('mouseleave', restartCarousel);
carousel.addEventListener('focusin', () => clearInterval(timer));
carousel.addEventListener('focusout', () => setTimeout(restartCarousel, 0));
document.addEventListener('visibilitychange', restartCarousel);
motion.addEventListener('change', e => { paused = e.matches; restartCarousel(); });
showSlide(0);
restartCarousel();

const dialog = document.querySelector('#signup');
const form = document.querySelector('#signup-form');
const success = document.querySelector('#success');
const passPrompt = document.querySelector('#pass-prompt');
const title = document.querySelector('#form-title');
const subtitle = document.querySelector('#form-subtitle');
const successCopy = document.querySelector('#success-copy');
const ticket = document.querySelector('#ticket');
const credentialKey = 'hegii-design-week-pass';
const channelKey = 'hegii-design-week-channel';
let credentialReady = false;
let channel = 'live';
let lastOpener;
function hasCredential() {
  try { return credentialReady || localStorage.getItem(credentialKey) === 'ready'; }
  catch { return credentialReady; }
}
function openDialog() {
  if (!dialog.open) {
    lastOpener = document.activeElement;
    dialog.showModal();
  }
}
function updateTicket() {
  document.querySelector('#ticket-channel').textContent = channel === 'vip' ? 'VIP' : '现场扫码';
  ticket.querySelector('svg').setAttribute('aria-label', channel === 'vip' ? 'VIP 入场二维码' : '现场扫码入场二维码');
}
function openRegistration(selectedChannel = 'live') {
  channel = selectedChannel === 'vip' ? 'vip' : 'live';
  title.textContent = channel === 'vip' ? 'VIP邀约通道' : '现场扫码报名';
  subtitle.textContent = '完成登记，开启广州设计周体验。';
  passPrompt.classList.remove('show');
  success.classList.remove('show');
  form.reset();
  form.querySelectorAll('input').forEach(input => input.setCustomValidity(''));
  form.style.display = 'block';
  openDialog();
}
function showCredential() {
  try { channel = localStorage.getItem(channelKey) || channel; } catch {}
  updateTicket();
  title.textContent = '我的入场凭证';
  subtitle.textContent = '广州设计周 · 2026.12.04—12.08';
  success.querySelector('h2').textContent = '我的入场凭证';
  successCopy.textContent = '请于展期现场出示二维码。';
  ticket.style.display = 'block';
  passPrompt.classList.remove('show');
  form.style.display = 'none';
  success.classList.add('show');
  openDialog();
}
function showRegistrationPrompt() {
  title.textContent = '我的凭证';
  subtitle.textContent = '广州设计周 · 2026.12.04—12.08';
  form.style.display = 'none';
  success.classList.remove('show');
  passPrompt.classList.add('show');
  openDialog();
}
document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => openRegistration(button.dataset.open)));
document.querySelectorAll('[data-credential]').forEach(button => button.addEventListener('click', () => hasCredential() ? showCredential() : showRegistrationPrompt()));
dialog.querySelector('.close').addEventListener('click', () => dialog.close());
document.querySelector('#cancel-registration').addEventListener('click', () => dialog.close());
document.querySelector('#start-registration').addEventListener('click', () => openRegistration('live'));
document.querySelector('#done').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  if (lastOpener?.isConnected && lastOpener.getClientRects().length) lastOpener.focus({ preventScroll: true });
});
function validateInput(input) {
  const value = input.value.trim();
  let error = value ? '' : '请填写此项';
  if (value && input.name === 'phone') {
    const count = value.replace(/\D/g, '').length;
    if (!/^[+\d() -]+$/.test(value) || count < 7 || count > 15) error = '请输入有效的联系电话';
  }
  input.setCustomValidity(error);
}
form.querySelectorAll('input').forEach(input => input.addEventListener('input', () => validateInput(input)));
form.addEventListener('submit', e => {
  e.preventDefault();
  form.querySelectorAll('input').forEach(validateInput);
  if (!form.reportValidity()) return;
  credentialReady = true;
  try {
    localStorage.setItem(credentialKey, 'ready');
    localStorage.setItem(channelKey, channel);
  } catch {}
  updateTicket();
  success.querySelector('h2').textContent = '登记成功';
  successCopy.textContent = '您的入场凭证已生成。';
  ticket.style.display = 'block';
  form.style.display = 'none';
  success.classList.add('show');
  document.querySelector('#done').focus();
});

// Retain the existing content placeholders until those pages are confirmed.
document.querySelectorAll('[data-toast]').forEach(button => button.addEventListener('click', () => {
  alert(button.dataset.toast + ' 内容页已纳入专区信息架构，可在后续接入图文详情。');
}));
const home = document.querySelector('.app');
const activityPage = document.querySelector('#activity-page');
let homeScroll = 0;
let activityOpener;
document.querySelectorAll('[data-route="activities"]').forEach(button => button.addEventListener('click', e => {
  e.preventDefault();
  homeScroll = window.scrollY;
  activityOpener = button;
  home.classList.add('hide');
  activityPage.classList.add('show');
  window.scrollTo(0, 0);
  document.querySelector('#back-home').focus({ preventScroll: true });
}));
document.querySelector('#back-home').addEventListener('click', () => {
  activityPage.classList.remove('show');
  home.classList.remove('hide');
  activityOpener?.focus({ preventScroll: true });
  window.scrollTo(0, homeScroll);
});
document.querySelectorAll('.activity-tabs button').forEach(button => button.addEventListener('click', () => {
  document.querySelector('.activity-tabs .active')?.classList.remove('active');
  button.classList.add('active');
}));
if (new URLSearchParams(location.search).get('channel') === 'vip') openRegistration('vip');
