import { GenericPermissionObject, PermissionKey } from "./types";

export const PERMISSIONS = {
  ADMIN: {
    PANEL_ACCESS: { key: 'admin:panel-access', description: 'Admin Paneline Erişim' },
    USER_MANAGEMENT: { key: 'admin:user-management', description: 'Kullanıcı Yönetimi' },
    SYSTEM_SETTINGS: { key: 'admin:system-settings', description: 'Sistem Ayarları' },
  },
  
  USERS: {
    VIEW: { key: 'users:view', description: 'Kullanıcıları Görüntüle' },
    CREATE: { key: 'users:create', description: 'Kullanıcı Oluştur' },
    UPDATE: { key: 'users:update', description: 'Kullanıcı Güncelle' },
    DELETE: { key: 'users:delete', description: 'Kullanıcı Sil' },
    BAN: { key: 'users:ban', description: 'Kullanıcıyı Yasakla' },
    UNBAN: { key: 'users:unban', description: 'Yasağı Kaldır' },
  },
  
  ROOMS: {
    CREATE: { key: 'rooms:create', description: 'Oda Oluştur' },
    UPDATE: { key: 'rooms:update', description: 'Oda Düzenle' },
    DELETE: { key: 'rooms:delete', description: 'Oda Sil' },
    VIEW_ALL: { key: 'rooms:view-all', description: 'Tüm Odaları Görüntüle' },
    ARCHIVE: { key: 'rooms:archive', description: 'Oda Arşivle' },
  },
  
  // Room Member Management - Oda üyesi yönetimi
  ROOM_MEMBERS: {
    INVITE: { key: 'room-members:invite', description: 'Üye Davet Et' },
    KICK: { key: 'room-members:kick', description: 'Üye At' },
    BAN: { key: 'room-members:ban', description: 'Üye Yasakla' },
    MANAGE_ROLES: { key: 'room-members:manage-roles', description: 'Üye Rollerini Yönet' },
  },
  
  // Message Management - Mesaj yönetimi
  MESSAGES: {
    SEND: { key: 'messages:send', description: 'Mesaj Gönder' },
    EDIT_OWN: { key: 'messages:edit-own', description: 'Kendi Mesajını Düzenle' },
    DELETE_OWN: { key: 'messages:delete-own', description: 'Kendi Mesajını Sil' },
    DELETE_ANY: { key: 'messages:delete-any', description: 'Herhangi Mesajı Sil' },
    PIN: { key: 'messages:pin', description: 'Mesaj Sabitle' },
    REACT: { key: 'messages:react', description: 'Mesaja Tepki Ver' },
  },
} as const satisfies Record<string, Record<string, GenericPermissionObject>>;

export const PERMISSION_KEYS = [
  ...new Set(
    Object.values(PERMISSIONS)
      .flatMap((module) => Object.values(module))
      .flatMap((permission) => permission.key),
  ),
] as PermissionKey[];

export const PERMISSION_GROUPS = {
  ADMIN: {
    key: 'admin',
    description: 'Yönetici İşlemleri',
    permissions: Object.values(PERMISSIONS.ADMIN),
  },
  USERS: {
    key: 'users',
    description: 'Kullanıcı Yönetimi',
    permissions: Object.values(PERMISSIONS.USERS),
  },
  ROOMS: {
    key: 'rooms',
    description: 'Oda Yönetimi',
    permissions: Object.values(PERMISSIONS.ROOMS),
  },
  ROOM_MEMBERS: {
    key: 'room-members',
    description: 'Üye Yönetimi',
    permissions: Object.values(PERMISSIONS.ROOM_MEMBERS),
  },
  MESSAGES: {
    key: 'messages',
    description: 'Mesaj Yönetimi',
    permissions: Object.values(PERMISSIONS.MESSAGES),
  },
} as const satisfies Record<
  string,
  { key: string; description: string; permissions: Array<{ key: string; description: string }> }
>;

export const DEFAULT_ROLE_PERMISSIONS = {
  SUPER_ADMIN: ['*'], 
  
  ADMIN: [
    PERMISSIONS.ADMIN.PANEL_ACCESS.key,
    PERMISSIONS.USERS.VIEW.key,
    PERMISSIONS.USERS.BAN.key,
    PERMISSIONS.USERS.UNBAN.key,
    PERMISSIONS.ROOMS.VIEW_ALL.key,
    PERMISSIONS.ROOMS.ARCHIVE.key,
    PERMISSIONS.MESSAGES.DELETE_ANY.key,
    PERMISSIONS.MESSAGES.PIN.key,
  ],
  
  MODERATOR: [
    PERMISSIONS.ROOM_MEMBERS.KICK.key,
    PERMISSIONS.ROOM_MEMBERS.BAN.key,
    PERMISSIONS.MESSAGES.DELETE_ANY.key,
    PERMISSIONS.MESSAGES.PIN.key,
  ],
  
  MEMBER: [
    PERMISSIONS.ROOMS.CREATE.key,
    PERMISSIONS.ROOM_MEMBERS.INVITE.key,
    PERMISSIONS.MESSAGES.SEND.key,
    PERMISSIONS.MESSAGES.EDIT_OWN.key,
    PERMISSIONS.MESSAGES.DELETE_OWN.key,
    PERMISSIONS.MESSAGES.REACT.key,
  ],
  
  GUEST: [
    PERMISSIONS.MESSAGES.SEND.key,
    PERMISSIONS.MESSAGES.REACT.key,
  ],
} as const;