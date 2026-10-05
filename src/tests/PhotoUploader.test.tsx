import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PhotoUploader } from '@/components/PhotoUploader';

describe('PhotoUploader Camera Improvements', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
      writable: true,
    });
  });

  it('should render the initial choose screen', () => {
    render(<PhotoUploader />);
    expect(screen.getByText(/Abrir câmera/i)).toBeInTheDocument();
    expect(screen.getByText(/Escolher uma foto/i)).toBeInTheDocument();
  });

  it('should open camera and show camera view', async () => {
    render(<PhotoUploader />);
    
    fireEvent.click(screen.getByText(/Abrir câmera/i));
    
    const video = await screen.findByLabelText(/Prévia da câmera/i);
    expect(video).toBeInTheDocument();
  });

  it('should show the camera toggle button when in camera step', async () => {
    render(<PhotoUploader />);
    
    fireEvent.click(screen.getByText(/Abrir câmera/i));
    
    const toggleBtn = await screen.findByTitle(/Trocar câmera/i);
    expect(toggleBtn).toBeInTheDocument();
  });

  it('should reset state when clicking "Voltar"', async () => {
    render(<PhotoUploader />);
    
    fireEvent.click(screen.getByText(/Abrir câmera/i));
    const backBtn = await screen.findByText(/Voltar/i);
    fireEvent.click(backBtn);
    
    expect(screen.getByText(/Abrir câmera/i)).toBeInTheDocument();
  });
});
