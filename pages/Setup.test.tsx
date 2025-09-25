import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SetupPage from './Setup';
import React from 'react';
import toast from 'react-hot-toast';

// Mocking dependencies
vi.mock('../services/aiController', () => ({
  googleAIController: vi.fn(),
}));

vi.mock('../services/db', () => ({
  getMangaDocument: vi.fn(),
  saveMangaDocument: vi.fn(),
}));

vi.mock('react-hot-toast');

const renderSetupPage = () => {
  const user = userEvent.setup();
  const utils = render(
    <MemoryRouter initialEntries={['/setup']}>
      <Routes>
        <Route path="/setup" element={<SetupPage />} />
      </Routes>
    </MemoryRouter>
  );
  return { user, ...utils };
};

describe('SetupPage', () => {
  it('should not allow adding duplicate themes and should show an error toast', async () => {
    const { user } = renderSetupPage();

    // Navigate to step 2
    await user.type(screen.getByLabelText('عنوان المانغا'), 'Test Project');
    await user.type(screen.getByLabelText('فكرة القصة الرئيسية (Logline)'), 'A test story idea.');
    await user.click(screen.getByRole('button', { name: /الخطوة التالية/i }));

    // Wait for step 2 to appear
    await screen.findByText('الخطوة 2: بناء العالم بمساعدة الذكاء الاصطناعي');

    // Add a theme for the first time
    const themeInput = screen.getByPlaceholderText('أضف موضوعًا...');
    const addButton = screen.getByRole('button', { name: 'إضافة' });

    await user.type(themeInput, 'Action');
    await user.click(addButton);

    // Attempt to add the same theme again
    await user.type(themeInput, 'Action');
    await user.click(addButton);

    // Verify that the error toast is shown
    expect(toast.error).toHaveBeenCalledWith("هذا الموضوع موجود بالفعل.");

    // Verify that there is only one "Action" theme badge
    const themeBadges = await screen.findAllByText('Action');
    expect(themeBadges.length).toBe(1);
  });
});