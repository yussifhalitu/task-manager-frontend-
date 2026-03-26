import React, { useState, useEffect, useCallback } from 'react';
import { getTasks, createTask, deleteTask, markDone, updateTask } from '../api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function getDueStatus(due_date) {
  if (!due_date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(due_date);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due - today) / (1000 * 60 * 60 * 24));
  if (diff < 0)   return { label: "Overdue by " + Math.abs(diff) + " day(s)", type: 'overdue' };
  if (diff === 0) return { label: 'Due today!', type: 'today' };
  if (diff <= 3)  return { label: diff + " day(s) left", type: 'soon' };
  return           { label: diff + " days left", type: 'ok' };
}

function Dashboard({ darkMode, setDarkMode }) {
  const [tasks,        setTasks]        = useState([]);
  const [title,        setTitle]        = useState('');
  const [description,  setDescription]  = useState('');
  const [priority,     setPriority]     = useState('medium');
  const [dueDate,      setDueDate]      = useState('');
  const [filter,       setFilter]       = useState(undefined);
  const [search,       setSearch]       = useState('');
  const [loading,      setLoading]      = useState(false);
  const [editingTask,  setEditingTask]  = useState(null);
  const [editTitle,    setEditTitle]    = useState('');
  const [editDesc,     setEditDesc]     = useState('');
  const [editPriority, setEditPriority] = useState('medium');
  const [editDueDate,  setEditDueDate]  = useState('');
  const [showForm,     setShowForm]     = useState(false);
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

  const filteredTasks = tasks.filter(function(task) {
    return (
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const stats = {
    total:   tasks.length,
    done:    tasks.filter(function(t) { return t.done; }).length,
    pending: tasks.filter(function(t) { return !t.done; }).length,
    overdue: tasks.filter(function(t) {
      return !t.done && getDueStatus(t.due_date) && getDueStatus(t.due_date).type === 'overdue';
    }).length,
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await createTask({ title, description: description || null, priority, due_date: dueDate || null });
      setTitle('');
      setDescription('');
      setDueDate('');
      setShowForm(false);
      toast.success('Task created!');
      fetchTasks();
    } catch (err) {
      toast.error('Failed to create task');
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
    setEditDesc(task.description || '');
    setEditPriority(task.priority);
    setEditDueDate(task.due_date || '');
  };

  const handleEditCancel = () => {
    setEditingTask(null);
    setEditTitle('');
    setEditDesc('');
    setEditPriority('medium');
    setEditDueDate('');
  };

  const handleEditSave = async (task) => {
    try {
      await updateTask(task.id, {
        title: editTitle,
        description: editDesc || null,
        priority: editPriority,
        done: task.done,
        due_date: editDueDate || null
      });
      toast.success('Task updated!');
      setEditingTask(null);
      fetchTasks();
    } catch (err) {
      toast.error('Failed to update task');
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

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-number">{stats.total}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-card done">
          <span className="stat-number">{stats.done}</span>
          <span className="stat-label">Done</span>
        </div>
        <div className="stat-card pending">
          <span className="stat-number">{stats.pending}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat-card overdue">
          <span className="stat-number">{stats.overdue}</span>
          <span className="stat-label">Overdue</span>
        </div>
      </div>

      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="clear-search" onClick={() => setSearch("")}>X</button>
        )}
      </div>

      <button className="add-task-btn" onClick={() => setShowForm(!showForm)}>
        {showForm ? 'X Cancel' : '+ Add New Task'}
      </button>

      {showForm && (
        <div className="create-form">
          <form onSubmit={handleCreate}>
            <input
              type="text"
              placeholder="Task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <textarea
              placeholder="Description (optional)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
            <div className="form-row">
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Task'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="filters">
        <button onClick={() => setFilter(undefined)} className={filter === undefined ? 'active' : ''}>All</button>
        <button onClick={() => setFilter(false)}     className={filter === false ? 'active' : ''}>Pending</button>
        <button onClick={() => setFilter(true)}      className={filter === true ? 'active' : ''}>Completed</button>
      </div>

      {search && (
        <p className="search-results">{filteredTasks.length} result(s) for "{search}"</p>
      )}

      <div className="task-list">
        {filteredTasks.length === 0 && (
          <p className="empty">
            {search ? 'No tasks match your search.' : 'No tasks yet. Add one above!'}
          </p>
        )}
        {filteredTasks.map((task) => {
          const dueStatus = getDueStatus(task.due_date);
          return (
            <div
              key={task.id}
              className={"task-card " + (task.done ? 'done' : '') + (dueStatus && dueStatus.type === 'overdue' && !task.done ? ' overdue' : '')}
            >
              {editingTask === task.id ? (
                <div className="edit-form">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Task title"
                  />
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Description (optional)"
                    rows={2}
                  />
                  <div className="form-row">
                    <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                    />
                  </div>
                  <div className="edit-actions">
                    <button onClick={() => handleEditSave(task)} className="done-btn">Save</button>
                    <button onClick={handleEditCancel} className="delete-btn">Cancel</button>
                  </div>
                </div>
              ) : (
                <React.Fragment>
                  <div className="task-info">
                    <h3>{task.title}</h3>
                    {task.description && <p className="task-desc">{task.description}</p>}
                    <div className="task-meta">
                      <span className={"badge " + task.priority}>{task.priority}</span>
                      {dueStatus && !task.done && (
                        <span className={"due-badge " + dueStatus.type}>
                          {dueStatus.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="task-actions">
                    {!task.done && (
                      <React.Fragment>
                        <button onClick={() => handleDone(task.id)} className="done-btn">Done</button>
                        <button onClick={() => handleEditOpen(task)} className="edit-btn">Edit</button>
                      </React.Fragment>
                    )}
                    <button onClick={() => handleDelete(task.id)} className="delete-btn">Delete</button>
                  </div>
                </React.Fragment>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Dashboard;