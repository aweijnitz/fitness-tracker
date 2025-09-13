import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../App';
import { AuthProvider } from '../providers/AuthProvider';

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

test('redirects to login when not authenticated', () => {
  renderApp();
  expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
});

test('shows dashboard after login', async () => {
  renderApp(['/login']);
  screen.getByRole('button', { name: /login/i }).click();
  expect(await screen.findByText(/Weight Trend/)).toBeInTheDocument();
  expect(screen.getByText(/Calories Remaining Today/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /meals/i })).toBeInTheDocument();
});
