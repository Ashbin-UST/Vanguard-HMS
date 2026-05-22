// src/app/utils/employee.utils.ts

export const avatarColors: string[] = [
  '#4f46e5',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6'
];

export const roleColors: Record<string, { bg: string; text: string; dot: string }> = {
  Doctor: {
    bg: '#e8f5e9',
    text: '#2e7d32',
    dot: '#43a047'
  },
  Receptionist: {
    bg: '#e3f2fd',
    text: '#1565c0',
    dot: '#1e88e5'
  },
  Cashier: {
    bg: '#fff8e1',
    text: '#f57f17',
    dot: '#ffa000'
  },
  Nurse: {
    bg: '#fce4ec',
    text: '#880e4f',
    dot: '#e91e63'
  },
  'Lab Technician': {
    bg: '#ede7f6',
    text: '#4527a0',
    dot: '#7e57c2'
  },
  Pharmacist: {
    bg: '#e0f7fa',
    text: '#006064',
    dot: '#00acc1'
  }
};

export function getAvatarColor(name: string): string {
  if (!name || !name.trim()) {
    return avatarColors[0];
  }

  return avatarColors[name.trim().charCodeAt(0) % avatarColors.length];
}

export function getRoleStyle(role: string): { [key: string]: string } {
  const c = roleColors[role] || {
    bg: '#f3f4f6',
    text: '#374151',
    dot: '#9ca3af'
  };

  return {
    background: c.bg,
    color: c.text
  };
}

export function getRoleDotColor(role: string): string {
  return (
    roleColors[role] || {
      bg: '#f3f4f6',
      text: '#374151',
      dot: '#9ca3af'
    }
  ).dot;
}

export function makeAvatar(name: string): string {
  if (!name || !name.trim()) {
    return 'NA';
  }

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
export function formatAction(action: string): string {
  return action
    .toLowerCase()
    .replace(/_/g, ' ');
}

export function getActivityIcon(action: string): string {
  if (action.includes('ADD')) return '➕';
  if (action.includes('UPDATE')) return '✏️';
  if (action.includes('DELETE') || action.includes('REMOVE')) return '🗑️';
  if (action.includes('APPROVE')) return '✅';
  if (action.includes('REJECT')) return '❌';
  return '📋';
}

export function getTimeAgo(date: string): string {
  const now = new Date().getTime();
  const past = new Date(date).getTime();
  const diff = Math.floor((now - past) / 1000);

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;

  return `${Math.floor(diff / 86400)} days ago`;
}


