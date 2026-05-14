'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Trash2, Edit3, Shield, Eye, ShieldCheck, UserX, Check, X } from 'lucide-react';

interface UserItem {
  id: string;
  username: string;
  display_name: string | null;
  role: string;
  status: string;
  last_login_at: string | null;
  created_at: string;
}

const roleLabels: Record<string, { label: string; color: string; icon: typeof Shield }> = {
  admin: { label: '管理员', color: 'bg-primary/10 text-primary', icon: ShieldCheck },
  operator: { label: '运营', color: 'bg-blue-500/10 text-blue-600', icon: Shield },
  viewer: { label: '只读', color: 'bg-muted text-muted-foreground', icon: Eye },
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<UserItem | null>(null);

  // 新增表单
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState('viewer');

  // 编辑表单
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editStatus, setEditStatus] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (res.status === 403) return;
      const data = await res.json();
      setUsers(data.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAdd = async () => {
    if (!newUsername.trim() || !newPassword.trim()) return;
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: newUsername,
        password: newPassword,
        display_name: newDisplayName || undefined,
        role: newRole,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setShowAdd(false);
      setNewUsername('');
      setNewPassword('');
      setNewDisplayName('');
      setNewRole('viewer');
      fetchUsers();
    } else {
      alert(data.error || '创建失败');
    }
  };

  const handleUpdate = async () => {
    if (!editUser) return;
    const body: Record<string, unknown> = {};
    if (editDisplayName !== (editUser.display_name || '')) body.display_name = editDisplayName;
    if (editRole !== editUser.role) body.role = editRole;
    if (editStatus !== editUser.status) body.status = editStatus;
    if (editPassword) body.password = editPassword;

    const res = await fetch(`/api/users/${editUser.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      setEditUser(null);
      fetchUsers();
    } else {
      alert(data.error || '更新失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除该用户？')) return;
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchUsers();
    } else {
      const data = await res.json();
      alert(data.error || '删除失败');
    }
  };

  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.display_name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground text-sm">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">用户管理</h1>
        <p className="text-sm text-muted-foreground mt-1">管理后台用户账号和权限</p>
      </div>

      {/* 权限说明 */}
      <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/20">
        <h3 className="text-sm font-medium text-foreground mb-2">权限说明</h3>
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-primary">
              <ShieldCheck className="w-3.5 h-3.5" />管理员
            </div>
            <p className="text-muted-foreground">所有操作权限 + 用户管理</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-blue-600">
              <Shield className="w-3.5 h-3.5" />运营
            </div>
            <p className="text-muted-foreground">查看 + 编辑配置，不可管理用户</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
              <Eye className="w-3.5 h-3.5" />只读
            </div>
            <p className="text-muted-foreground">仅查看数据，不可修改</p>
          </div>
        </div>
      </div>

      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-muted border-none rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 w-64"
            placeholder="搜索用户名..."
          />
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          添加用户
        </button>
      </div>

      {/* 用户表格 */}
      <div className="bg-card rounded-xl border border-outline-variant/20 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-outline-variant/20">
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">用户名</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">显示名称</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">角色</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">状态</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">最后登录</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">创建时间</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const roleInfo = roleLabels[u.role] || roleLabels.viewer;
              const RoleIcon = roleInfo.icon;
              return (
                <tr key={u.id} className="border-b border-outline-variant/10 hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium text-foreground">{u.username}</td>
                  <td className="px-4 py-3 text-foreground">{u.display_name || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}>
                      <RoleIcon className="w-3 h-3" />
                      {roleInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                        <Check className="w-3 h-3" />启用
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-destructive">
                        <UserX className="w-3 h-3" />禁用
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleString('zh-CN') : '-'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(u.created_at).toLocaleString('zh-CN')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditUser(u);
                          setEditDisplayName(u.display_name || '');
                          setEditRole(u.role);
                          setEditStatus(u.status);
                          setEditPassword('');
                        }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title="编辑"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  暂无用户数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 添加用户弹窗 */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAdd(false)}>
          <div className="bg-card rounded-xl shadow-card p-6 w-full max-w-md mx-4 border border-outline-variant/20" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-foreground mb-4">添加用户</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">用户名 *</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full bg-muted border-none rounded-lg px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="输入用户名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">密码 *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-muted border-none rounded-lg px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="至少6位"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">显示名称</label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className="w-full bg-muted border-none rounded-lg px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="输入显示名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">角色</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-muted border-none rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="viewer">只读</option>
                  <option value="operator">运营</option>
                  <option value="admin">管理员</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑用户弹窗 */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditUser(null)}>
          <div className="bg-card rounded-xl shadow-card p-6 w-full max-w-md mx-4 border border-outline-variant/20" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              编辑用户 - {editUser.username}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">显示名称</label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full bg-muted border-none rounded-lg px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">角色</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full bg-muted border-none rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="viewer">只读</option>
                  <option value="operator">运营</option>
                  <option value="admin">管理员</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">状态</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-muted border-none rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="active">启用</option>
                  <option value="disabled">禁用</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  重置密码 <span className="text-muted-foreground font-normal">(留空不修改)</span>
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full bg-muted border-none rounded-lg px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="输入新密码（至少6位）"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditUser(null)}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
