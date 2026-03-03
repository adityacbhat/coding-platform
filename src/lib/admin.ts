const ADMIN_EMAIL = 'adityacbhat@gmail.com';

export function isAdmin(email: string | null | undefined) {
  return email === ADMIN_EMAIL;
}
