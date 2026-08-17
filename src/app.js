import {
  getStoredUser,
  isAuthConfigured,
  signIn,
  signOut,
  signUp
} from './auth.js';

const menu = document.querySelector('.menu');
const nav = document.querySelector('nav');
const newsletterForm = document.querySelector('#newsletter');
const toast = document.querySelector('#toast');
const authTrigger = document.querySelector('#authTrigger');
const authModal = document.querySelector('#authModal');
const authForm = document.querySelector('#authForm');
const authGuestView = document.querySelector('#authGuestView');
const authAccountView = document.querySelector('#authAccountView');
const authTitle = document.querySelector('#authTitle');
const authIntro = document.querySelector('#authIntro');
const authNameField = document.querySelector('.auth-name-field');
const authName = document.querySelector('#authName');
const authEmail = document.querySelector('#authEmail');
const authPassword = document.querySelector('#authPassword');
const authSubmit = document.querySelector('#authSubmit');
const authMessage = document.querySelector('#authMessage');
const accountEmail = document.querySelector('#accountEmail');
const signOutButton = document.querySelector('#signOutButton');
const modeButtons = [...document.querySelectorAll('[data-auth-mode]')];

let authMode = 'signin';
let currentUser = getStoredUser();

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 4200);
}

function setAuthMessage(message = '', type = '') {
  authMessage.textContent = message;
  authMessage.className = `auth-message${type ? ` ${type}` : ''}`;
}

function setAuthMode(mode) {
  authMode = mode;
  const isSignUp = mode === 'signup';
  authTitle.textContent = isSignUp ? 'Join AbdiGlobal.' : 'Welcome back.';
  authIntro.textContent = isSignUp
    ? 'Create an account to save stories, comment and submit your own ideas.'
    : 'Sign in to save stories, join conversations and submit your writing.';
  authNameField.classList.toggle('visible', isSignUp);
  authName.required = isSignUp;
  authPassword.autocomplete = isSignUp ? 'new-password' : 'current-password';
  authSubmit.textContent = isSignUp ? 'Create account' : 'Sign in';
  modeButtons.forEach((button) => {
    const active = button.dataset.authMode === mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  setAuthMessage();
}

function renderAuthState() {
  const signedIn = Boolean(currentUser);
  authTrigger.textContent = signedIn ? currentUser.email.split('@')[0] : 'Sign in';
  authGuestView.hidden = signedIn;
  authAccountView.hidden = !signedIn;
  accountEmail.textContent = signedIn ? currentUser.email : '';
}

function openAuthModal() {
  renderAuthState();
  authModal.classList.add('open');
  authModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  if (!currentUser) window.setTimeout(() => authEmail.focus(), 50);
}

function closeAuthModal() {
  authModal.classList.remove('open');
  authModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  authTrigger.focus();
}

menu.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(isOpen));
});

document.querySelectorAll('nav a').forEach((link) => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
}));

newsletterForm.addEventListener('submit', (event) => {
  event.preventDefault();
  showToast('Welcome to the Global Letter. Please check your inbox.');
  newsletterForm.reset();
});

authTrigger.addEventListener('click', openAuthModal);
document.querySelectorAll('[data-auth-close]').forEach((button) => button.addEventListener('click', closeAuthModal));
modeButtons.forEach((button) => button.addEventListener('click', () => setAuthMode(button.dataset.authMode)));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && authModal.classList.contains('open')) closeAuthModal();
});

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setAuthMessage();

  if (!authForm.checkValidity()) {
    authForm.reportValidity();
    return;
  }

  if (!isAuthConfigured()) {
    setAuthMessage('Authentication is ready in the website, but Supabase must be connected first.', 'error');
    return;
  }

  authSubmit.disabled = true;
  authSubmit.textContent = authMode === 'signup' ? 'Creating account…' : 'Signing in…';

  try {
    const result = authMode === 'signup'
      ? await signUp({ name: authName.value.trim(), email: authEmail.value.trim(), password: authPassword.value })
      : await signIn({ email: authEmail.value.trim(), password: authPassword.value });

    if (result.user && result.session) {
      currentUser = result.user;
      renderAuthState();
      authForm.reset();
      showToast(authMode === 'signup' ? 'Your AbdiGlobal account is ready.' : 'Welcome back to AbdiGlobal.');
      closeAuthModal();
      return;
    }

    setAuthMode('signin');
    setAuthMessage('Account created. Check your email to confirm it, then sign in.', 'success');
  } catch (error) {
    setAuthMessage(error.message, 'error');
  } finally {
    authSubmit.disabled = false;
    authSubmit.textContent = authMode === 'signup' ? 'Create account' : 'Sign in';
  }
});

signOutButton.addEventListener('click', async () => {
  signOutButton.disabled = true;
  try {
    await signOut();
    currentUser = null;
    renderAuthState();
    closeAuthModal();
    showToast('You have signed out.');
  } finally {
    signOutButton.disabled = false;
  }
});

setAuthMode('signin');
renderAuthState();
