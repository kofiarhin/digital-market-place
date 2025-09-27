import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import siteCopy from './content/siteCopy.json';

const renderWithProviders = (initialEntries = ['/']) => {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('App routing', () => {
  it('renders the home hero copy from JSON', () => {
    renderWithProviders();
    const heroTitle = screen.getByRole('heading', { name: siteCopy.home.hero.title });
    expect(heroTitle).toBeInTheDocument();
  });

  it('renders the not found copy for unknown routes', () => {
    renderWithProviders(['/unknown']);
    expect(screen.getByText(siteCopy.notFound.subtitle)).toBeInTheDocument();
  });
});
