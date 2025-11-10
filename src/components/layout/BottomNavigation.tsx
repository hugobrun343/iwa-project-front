import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from '../ui/Icon';
import { theme } from '../../styles/theme';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface Tab {
  id: string;
  label: string;
  icon: IconName;
}

export function BottomNavigation({
  activeTab,
  onTabChange,
}: BottomNavigationProps) {
  const insets = useSafeAreaInsets();
  
  const tabs: Tab[] = [
    { id: "home", label: "Recherche", icon: "Home" },
    { id: "favorites", label: "Favoris", icon: "Heart" },
    { id: "create", label: "Créer", icon: "Plus" },
    { id: "messages", label: "Messages", icon: "MessageCircle" },
    { id: "profile", label: "Profil", icon: "User" },
  ];

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.tabContainer}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isCreateTab = tab.id === "create";

          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tab}
              onPress={() => onTabChange(tab.id)}
              activeOpacity={0.7}
            >
              {isCreateTab ? (
                <View style={[
                  styles.createButton,
                  { backgroundColor: isActive ? theme.colors.primary : theme.colors.muted }
                ]}>
                  <Icon 
                    name={tab.icon} 
                    size={16} 
                    color={isActive ? theme.colors.primaryForeground : theme.colors.mutedForeground}
                  />
                </View>
              ) : (
                <Icon 
                  name={tab.icon} 
                  size={20} 
                  color={isActive ? theme.colors.primary : theme.colors.mutedForeground}
                />
              )}
              <Text style={[
                styles.tabLabel,
                { color: isActive ? theme.colors.primary : theme.colors.mutedForeground }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    minWidth: 60,
  },
  createButton: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    marginTop: theme.spacing.xs / 2,
  },
});
