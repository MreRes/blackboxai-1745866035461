import React, { useState, useEffect } from 'react';
import { collaborationAPI } from '../../utils/api';

const Collaboration = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await collaborationAPI.getUserTeams();
      setTeams(response.data.data.teams);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching teams');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName) return;
    try {
      await collaborationAPI.createTeam({ name: newTeamName });
      setNewTeamName('');
      fetchTeams();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating team');
    }
  };

  const handleAddMember = async (teamId) => {
    if (!newMemberEmail) return;
    try {
      await collaborationAPI.addTeamMember(teamId, { email: newMemberEmail });
      setNewMemberEmail('');
      fetchTeams();
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding member');
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Collaboration Teams</h2>
      {error && <div className="text-red-600 mb-4">{error}</div>}

      <div className="mb-6">
        <input
          type="text"
          placeholder="New Team Name"
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          className="border px-3 py-2 rounded mr-2"
        />
        <button
          onClick={handleCreateTeam}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Create Team
        </button>
      </div>

      {loading ? (
        <p>Loading teams...</p>
      ) : (
        teams.map((team) => (
          <div key={team._id} className="mb-4 border p-4 rounded">
            <h3 className="font-semibold">{team.name}</h3>
            <p>Members:</p>
            <ul className="list-disc list-inside mb-2">
              {team.members.map((member) => (
                <li key={member._id}>{member.email}</li>
              ))}
            </ul>
            <input
              type="email"
              placeholder="Add member email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              className="border px-3 py-2 rounded mr-2"
            />
            <button
              onClick={() => handleAddMember(team._id)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Add Member
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default Collaboration;
