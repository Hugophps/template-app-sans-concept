export const en = {
  common: {
    continue: 'Continue',
    save: 'Save',
    cancel: 'Cancel',
    loading: 'Loading...'
  },
  nav: {
    profile: 'Profile',
    legal: 'Legal',
    login: 'Sign in'
  },
  auth: {
    title: 'Sign in',
    subtitle: 'No password needed. Use a magic link sent to your email.',
    emailLabel: 'Email address',
    emailPlaceholder: 'you@example.com',
    sendLink: 'Send magic link',
    resendLink: 'Resend email',
    checkEmailTitle: 'Check your email',
    checkEmailBody: 'We sent a sign-in link to',
    supportLine: 'Need help? Contact',
    errorTitle: 'Could not send the link',
    successTitle: 'Magic link sent'
  },
  profile: {
    title: 'Profile',
    emailLabel: 'Email',
    changeEmailTitle: 'Change email',
    newEmailLabel: 'New email address',
    updateEmail: 'Send change email link',
    languageLabel: 'Language',
    signOut: 'Sign out',
    updateSuccess: 'Profile updated.',
    updateError: 'Could not update profile.'
  },
  legal: {
    title: 'Legal',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    imprint: 'Imprint',
    cookies: 'Cookies Policy'
  }
};

export type MessageKeys = keyof typeof en;
