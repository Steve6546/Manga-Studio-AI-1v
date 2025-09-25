import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import MangaPageViewer from './MangaPageViewer';
import { useMangaStore } from '../src/state/mangaStore';
import { Manga } from '../types';

// Mock the zustand store
jest.mock('../src/state/mangaStore');

// Mock react-router-dom's useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock the AI controller
jest.mock('../services/aiController', () => ({
  googleAIController: jest.fn(),
}));

const mockUseMangaStore = useMangaStore as jest.Mock;

const mockManga: Manga = {
  id: 'test-manga',
  title: 'Test Manga',
  description: 'A manga for testing',
  storyMemory: [],
  chapters: [
    {
      chapterNumber: 1,
      title: 'Chapter 1',
      summary: '',
      pages: [
        { pageNumber: 1, layout: 'TWO_BY_TWO', panels: [] },
        { pageNumber: 2, layout: 'TWO_BY_TWO', panels: [] },
      ],
    },
  ],
};

const renderComponent = (initialEntries: string[]) => {
  mockNavigate.mockClear();
  mockUseMangaStore.mockReturnValue({
    currentMangaDocument: mockManga,
    updatePanel: jest.fn(),
  });

  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/project/:mangaId/chapter/:chapterNumber/page/:pageNumber" element={<MangaPageViewer />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('MangaPageViewer', () => {
  it('should display the correct chapter and page number', () => {
    renderComponent(['/project/test-manga/chapter/1/page/1']);
    expect(screen.getByText(/Chapter 1 - Page 1/i)).toBeInTheDocument();
  });

  it('should call navigate with the correct URL when the next page button is clicked', () => {
    renderComponent(['/project/test-manga/chapter/1/page/1']);

    const nextButton = screen.getByRole('button', { name: /Next Page/i });
    fireEvent.click(nextButton);

    expect(mockNavigate).toHaveBeenCalledWith('/project/test-manga/chapter/1/page/2');
  });

  it('should call navigate with the correct URL when the previous page button is clicked', () => {
    renderComponent(['/project/test-manga/chapter/1/page/2']);

    const prevButton = screen.getByRole('button', { name: /Previous Page/i });
    fireEvent.click(prevButton);

    expect(mockNavigate).toHaveBeenCalledWith('/project/test-manga/chapter/1/page/1');
  });

  it('should disable the previous button on the first page', () => {
    renderComponent(['/project/test-manga/chapter/1/page/1']);
    expect(screen.getByRole('button', { name: /Previous Page/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Next Page/i })).not.toBeDisabled();
  });

  it('should disable the next button on the last page', () => {
    renderComponent(['/project/test-manga/chapter/1/page/2']);
    expect(screen.getByRole('button', { name: /Previous Page/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /Next Page/i })).toBeDisabled();
  });
});