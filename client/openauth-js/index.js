export function authorize() {
  // In a real implementation this would redirect to the auth server
  return Promise.resolve('/callback?code=mock-code');
}

export function token(code) {
  return Promise.resolve({
    access_token: `access-${code}`,
    refresh_token: `refresh-${code}`,
    expires_in: 3600,
  });
}

export function refresh(refreshToken) {
  return Promise.resolve({
    access_token: `refreshed-${refreshToken}`,
    refresh_token: refreshToken,
    expires_in: 3600,
  });
}

export function logout() {
  return Promise.resolve();
}
