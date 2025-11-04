/**
 * External Dependencies.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal Dependencies.
 */
import App from '../App';

/**
 * Test for App.
 */
describe('App', () => {
	it('increments count when button is clicked', async () => {
		render(<App />);

		// Verify initial text.
		expect(
			screen.getByRole('button', { name: /count is 0/i })
		).toBeInTheDocument();

		// Click the button.
		await userEvent.click(
			screen.getByRole('button', { name: /count is 0/i })
		);

		// Verify updated count
		expect(
			screen.getByRole('button', { name: /count is 1/i })
		).toBeInTheDocument();
	});
});
