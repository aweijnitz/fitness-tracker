import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach } from 'vitest';
import App from '../App';
import { AuthProvider } from '../providers/AuthProvider';
import { tokenManager } from '../auth/tokenManager';

function renderApp(initialEntries = ['/']) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(async () => {
  await tokenManager.clear();
});

test('redirects to login when not authenticated', async () => {
  renderApp();
  expect(await screen.findByRole('button', { name: /login/i })).toBeInTheDocument();
});

test('shows dashboard when token is stored', async () => {
  await tokenManager.save({ accessToken: 'a', refreshToken: 'r', expiresAt: Date.now() + 1000 });
  renderApp(['/']);
  expect(await screen.findByText(/Weight Trend/)).toBeInTheDocument();
});
