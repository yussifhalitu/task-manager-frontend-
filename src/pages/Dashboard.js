import React, { useState, useEffect, useCallback } from 'react';
import { getTasks, createTask, deleteTask, markDone, updateTask } from '../api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Helper to calculate days remaining
function getDueStatus(due_date) {
  if (!due_date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due   = new Date(due_date);
  due.setHours(0, 0, 0, 0);
  const diff  = Math.round((due - today) / (1000 * 60 * 60 * 24));

  if (diff < 0)  return { label: `Overdue by ${Math.abs(diff)} day(s)`, type: 'overdue' };
  if (diff === 0) return { label: 'Due today!', type: 'today' };
  if (diff <= 3)  return { label: `${diff} day(s) left`, type: 'soon' };
  return           { label: `${diff} days left`, type: 'ok' };
}

function Dashboard({ darkMode, setDarkMode }) {
  const [tasks,        setTasks]        = useState([]);
  const [title,        setTitle]        = useState('');
  const [priority,     setPriority]     = useState('medium');
  const [dueDate,      setDueDate]      = useState('');
  const [filter,       setFilter]       = useState(undefined);
  const [loading,      setLoading]      = useState(false);
  const [editingTask,  setEditingTask]  = useState(null);
  const [editTitle,    setEditTitle]    = useState('');
  const [editPriority, setEditPriority] = useState('medium');
  const [editDueDate,  setEditDueDate]  = useState('');
  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  const fetchTasks = useCallback(async () => {
    try {
      const res = await getTasks(filter);
      setTasks(res.data.tasks);
    } catch (err) {
      toast.error('Failed to load tasks');
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
      await createTask({
        title,
        priority,
        due_date: dueDate || null
      });
      setTitle('');
      setDueDate('');
      toast.success('Task created!');
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      toast.success('Task deleted');
      fetchTasks();
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const handleDone = async (id) => {
    try {
      await markDone(id);
      toast.success('Task marked as done!');
      fetchTasks();
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const handleEditOpen = (task) => {
    setEditingTask(task.id);
    setEditTitle(task.title);
    setEditPriority(task.priority);
    setEditDueDate(task.due_date || '');
  };

  const handleEditCancel = () => {
    setEditingTask(null);
    setEditTitle('');
    setEditPriority('medium');
    setEditDueDate('');
  };

  const handleEditSave = async (task) => {
    try {
      await updateTask(task.id, {
        title:       editTitle,
        priority:    editPriority,
        done:        task.done,
        description: task.description,
        due_date:    editDueDate || null
      });
      toast.success('Task updated!');
      setEditingTask(null);
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update task');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    toast.success('Logged out!');
    navigate('/login');
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="header">
        <h1>My Tasks</h1>
        <div className="header-actions">
          <span>Welcome, {username}!</span>
          <button className="theme-toggle-sm" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      {/* Create Task Form */}
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
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            title="Due date (optional)"
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Task'}
          </button>
        </form>
      </div>

      {/* Filter Buttons */}
      <div className="filters">
        <button onClick={() => setFilter(undefined)} className={filter === undefined ? 'active' : ''}>All</button>
        <button onClick={() => setFilter(false)}     className={filter === false    ? 'active' : ''}>Pending</button>
        <button onClick={() => setFilter(true)}      className={filter === true     ? 'active' : ''}>Completed</button>
      </div>

      {/* Task List */}
      <div className="task-list">
        {tasks.length === 0 && <p className="empty">No tasks yet. Add one above!</p>}
        {tasks.map((task) => {
          const dueStatus = getDueStatus(task.due_date);
          return (
            <div
              key={task.id}
              className={`task-card ${task.done ? 'done' : ''} ${dueStatus?.type === 'overdue' && !task.done ? 'overdue' : ''}`}
            >
              {editingTask === task.id ? (
                <div className="edit-form">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                  />
                  <div className="edit-actions">
                    <button onClick={() => handleEditSave(task)} className="done-btn">Save</button>
                    <button onClick={handleEditCancel}           className="delete-btn">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="task-info">
                    <h3>{task.title}</h3>
                    {task.description && <p>{task.description}</p>}
                    <div className="task-meta">
                      <span className={`badge ${task.priority}`}>{task.priority}</span>
                      {dueStatus && !task.done && (
                        <span className={`due-badge ${dueStatus.type}`}>
                          📅 {dueStatus.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="task-actions">
                    {!task.done && (
                      <>
                        <button onClick={() => handleDone(task.id)}  className="done-btn">✓ Done</button>
                        <button onClick={() => handleEditOpen(task)}  className="edit-btn">✎ Edit</button>
                      </>
                    )}
                    <button onClick={() => handleDelete(task.id)} className="delete-btn">✕ Delete</button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Dashboard;