import api from '../../../services/api';
import type { GameMatchDto } from '../../../types/MusGame';

export const useGameApi = () => {
  
  const createNewGame = async (userId: number): Promise<GameMatchDto | null> => {
    try {
      const response = await api.post('/games/start', {
        userId,
        scoreUs: 0,
        scoreThem: 0,
        status: 'IN_PROGRESS'
      });
      return response.data;
    } catch (error) {
      console.error('Error creando la partida:', error);
      return null;
    }
  };

  const updateScore = async (gameId: number, us: number, them: number, status: string): Promise<void> => {
    try {
      await api.put(`/games/${gameId}/score`, {
        scoreUs: us,
        scoreThem: them,
        status
      });
    } catch (error) {
      console.error('Error actualizando la puntuación:', error);
    }
  };

  return { createNewGame, updateScore };
};
