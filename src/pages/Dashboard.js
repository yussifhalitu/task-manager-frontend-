import React, { useState, useEffect, useCallback } from 'react';
import { getTasks, createTask, deleteTask, markDone } from '../api';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [tasks,    setTasks]    = useState([]);
  const [title,    setTitle]    = useState('');
  const [priority, setPriority] = useState('medium');
  const [filter,   setFilter]   = useState(undefined);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const navigate  = useNavigate();
  const username  = localStorage.getItem('username');

  // useCallback prevents fetchTasks from changing on every render
  const fetchTasks = useCallback(async () => {
    try {
      const res = await getTasks(filter);
      setTasks(res.data.tasks);
    } catch (err) {
      setError('Failed to load tasks');
    }
  }, [filter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await createTask({ title, priority });
      setTitle('');
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      fetchTasks();
    } catch (err) {
      setError('Failed to delete task');
    }
  };

  const handleDone = async (id) => {
    try {
      await markDone(id);
      fetchTasks();
    } catch (err) {
      setError('Failed to update task');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <div className="header">
        <h1>My Tasks</h1>
        <div>
          <span>Welcome, {username}!</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="create-form">
        <form onSubmit={handleCreate}>
          <input
            type="text"
            placeholder="Add a new task..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Task'}
          </button>
        </form>
      </div>

      <div className="filters">
        <button onClick={() => setFilter(undefined)} className={filter === undefined ? 'active' : ''}>All</button>
        <button onClick={() => setFilter(false)}     className={filter === false ? 'active' : ''}>Pending</button>
        <button onClick={() => setFilter(true)}      className={filter === true ? 'active' : ''}>Completed</button>
      </div>

      <div className="task-list">
        {tasks.length === 0 && <p className="empty">No tasks yet. Add one above!</p>}
        {tasks.map((task) => (
          <div key={task.id} className={`task-card ${task.done ? 'done' : ''}`}>
            <div className="task-info">
              <h3>{task.title}</h3>
              {task.description && <p>{task.description}</p>}
              <span className={`badge ${task.priority}`}>{task.priority}</span>
            </div>
            <div className="task-actions">
              {!task.done && (
                <button onClick={() => handleDone(task.id)} className="done-btn">✓ Done</button>
              )}
              <button onClick={() => handleDelete(task.id)} className="delete-btn">✕ Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;