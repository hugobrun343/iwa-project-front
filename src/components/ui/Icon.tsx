import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

const iconMap = {
  Home: 'home-outline',
  Heart: 'heart-outline',
  HeartFilled: 'heart',
  Plus: 'add',
  MessageCircle: 'chatbubble-outline',
  User: 'person-outline',
  Search: 'search-outline',
  MapPin: 'location-outline',
  SlidersHorizontal: 'options-outline',
  Calendar: 'calendar-outline',
  Euro: 'cash-outline',
  Clock: 'time-outline',
  ArrowLeft: 'arrow-back',
  ChevronRight: 'chevron-forward',
  Send: 'send',
  Close: 'close',
  Settings: 'settings-outline',
  Star: 'star',
  Bell: 'notifications-outline',
  ShieldCheckmark: 'shield-checkmark',
  CreditCard: 'card-outline',
  Image: 'image-outline',
  // Nouvelles icônes ajoutées
  home: 'home-outline',
  heart: 'heart',
  'heart-outline': 'heart-outline',
  add: 'add',
  'add-outline': 'add-outline',
  chatbubble: 'chatbubble-outline',
  person: 'person-outline',
  location: 'location-outline',
  calendar: 'calendar-outline',
  time: 'time-outline',
  'arrow-back': 'arrow-back',
  checkmark: 'checkmark',
  'checkmark-circle': 'checkmark-circle',
  close: 'close',
  camera: 'camera-outline',
  create: 'create-outline',
  share: 'share-outline',
  notifications: 'notifications-outline',
  'shield-checkmark': 'shield-checkmark-outline',
  'document-text': 'document-text-outline',
  'help-circle': 'help-circle-outline',
  'chevron-forward': 'chevron-forward',
  card: 'card-outline',
  'arrow-down': 'arrow-down',
  'arrow-up': 'arrow-up',
  'swap-horizontal': 'swap-horizontal',
  'swap-vertical': 'swap-vertical-outline',
  trash: 'trash-outline',
  eye: 'eye-outline',
  'ellipsis-vertical': 'ellipsis-vertical',
  star: 'star',
  'options-outline': 'options-outline',
  // Icônes pour l'authentification
  'log-in': 'log-in-outline',
  'log-out': 'log-out-outline',
  key: 'key-outline',
  'person-add': 'person-add-outline',
} as const;

export type IconName = keyof typeof iconMap;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: any;
}

export function Icon({ name, size = 24, color = theme.colors.foreground, style }: IconProps) {
  const ioniconsName = iconMap[name];
  return <Ionicons name={ioniconsName as any} size={size} color={color} style={style} />;
}
