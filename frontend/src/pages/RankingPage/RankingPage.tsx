import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import './ranking-page.css';

interface RankingUser {
  rankPosition: number;
  username: string;
  elo: number;
  totalGamesPlayed: number;
  totalGamesWon: number;
  winRate: number;
}

const RankingPage: React.FC = () => {
  const [rankingList, setRankingList] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchRanking();
  }, []);

  const fetchRanking = async () => {
    try {
      const response = await api.get('/usuarios/ranking');
      setRankingList(response.data);
    } catch (error) {
      console.error('Error fetching ranking', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Navbar />
      <main className="ranking-page-content">
        <header className="ranking-header">
          <h1 className="ranking-title">Clasificación Global</h1>
          <p className="ranking-subtitle">Los mejores jugadores de Enbido</p>
        </header>

        <section className="ranking-table-container">
          {loading ? (
            <div className="loading-spinner">Cargando clasificación...</div>
          ) : (
            <table className="ranking-table">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Jugador</th>
                  <th>ELO</th>
                  <th>Partidas</th>
                  <th>Victorias</th>
                  <th>Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {rankingList.map((user) => (
                  <tr key={user.username} className={user.rankPosition <= 3 ? `top-${user.rankPosition}` : ''}>
                    <td className="rank-col">
                      {user.rankPosition === 1 && '🥇 '}
                      {user.rankPosition === 2 && '🥈 '}
                      {user.rankPosition === 3 && '🥉 '}
                      {user.rankPosition > 3 && `${user.rankPosition}º`}
                    </td>
                    <td className="player-col">{user.username}</td>
                    <td className="elo-col">{user.elo}</td>
                    <td>{user.totalGamesPlayed}</td>
                    <td>{user.totalGamesWon}</td>
                    <td>{user.winRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
};

export default RankingPage;
