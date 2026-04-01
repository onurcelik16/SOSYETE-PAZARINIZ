import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app without crashing', () => {
  render(<App />);
  const logoElements = screen.getAllByText(/Sosyete/i);
  expect(logoElements.length).toBeGreaterThan(0);
});
