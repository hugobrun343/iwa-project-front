import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Button } from './src/components/ui/Button';
import { Card, CardContent } from './src/components/ui/Card';
import { Badge } from './src/components/ui/Badge';
import { Icon } from './src/components/ui/Icon';
import { ImageWithFallback } from './src/components/ui/ImageWithFallback';
import { SearchPage } from './src/components/SearchPage';
import { ListingDetailPage } from './src/components/ListingDetailPage';
import { ProfilePage } from './src/components/ProfilePage';
import { FavoritesPage } from './src/components/FavoritesPage';
import { MessagesPage } from './src/components/MessagesPage';
import { CreateListingPage } from './src/components/CreateListingPage';
import { MyListingsPage } from './src/components/MyListingsPage';
import { GuardHistoryPage } from './src/components/GuardHistoryPage';
import { ReviewsPage } from './src/components/ReviewsPage';
import { SubscriptionPage } from './src/components/SubscriptionPage';
import { PaymentsPage } from './src/components/PaymentsPage';
import { EditProfilePage } from './src/components/EditProfilePage';
import { AdvancedSettingsPage } from './src/components/AdvancedSettingsPage';
import { LoginPage } from './src/components/LoginPage';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { theme } from './src/styles/theme';
import './src/i18n';
import { useTranslation } from 'react-i18next';

const mockListings = [
  {
    id: "1",
    title: "Appartement moderne avec vue - 2 chats adorables",
    location: "Paris 11ème, 0.8 km",
    price: 35,
    period: "5-12 Jan",
    frequency: "2 fois par jour",
    description: "Magnifique appartement lumineux avec deux chats très câlins. Arrosage de quelques plantes inclus. Quartier calme et bien desservi.",
    imageUrl: "https://images.unsplash.com/photo-1594873604892-b599f847e859?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTg2MDQzNTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    tags: ["Animaux", "Plantes"],
    isLiked: true,
    rating: 4.9,
    reviewCount: 15,
  },
  {
    id: "2",
    title: "Garde de Minou pendant les vacances",
    location: "Levallois-Perret, 2.1 km",
    price: 25,
    period: "15-22 Jan",
    frequency: "1 fois par jour",
    description: "Mon chat Minou a besoin d'attention pendant mon absence. Il est très affectueux et facile à vivre. Petit jardin avec quelques plantes.",
    imageUrl: "https://images.unsplash.com/photo-1619774946815-3e1eeeb445fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwY2F0JTIwc2xlZXBpbmd8ZW58MXx8fHwxNzU4NjExODIxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    tags: ["Animaux", "Week-end"],
    isLiked: false,
    rating: 4.7,
    reviewCount: 8,
  },
  {
    id: "3",
    title: "Jungle urbaine - Arrosage intensif requis",
    location: "Belleville, 1.5 km",
    price: 20,
    period: "3-10 Fév",
    frequency: "1 jour sur 2",
    description: "Appartement rempli de plantes tropicales qui nécessitent des soins particuliers. Instructions détaillées fournies. Aucun animal.",
    imageUrl: "https://images.unsplash.com/photo-1605260346600-f98d9cf022a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3VzZSUyMHBsYW50cyUyMGluZG9vcnxlbnwxfHx8fDE3NTg2MTE4MjJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    tags: ["Plantes", "Longue durée"],
    isLiked: true,
    rating: 4.8,
    reviewCount: 12,
  },
  {
    id: "4",
    title: "Golden Retriever énergique - Maison avec jardin",
    location: "Vincennes, 3.2 km",
    price: 45,
    period: "20-25 Jan",
    frequency: "3 fois par jour",
    description: "Max est un golden retriever de 3 ans très joueur. Il a besoin de sorties régulières et adore les câlins. Maison avec grand jardin sécurisé.",
    imageUrl: "https://images.unsplash.com/photo-1687211818108-667d028f1ae4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb2xkZW4lMjByZXRyaWV2ZXIlMjBkb2d8ZW58MXx8fHwxNzU4NjExODI4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    tags: ["Animaux", "Jardin"],
    isLiked: true,
    rating: 4.9,
    reviewCount: 23,
  },
];

// Main App Component with Authentication
function MainApp() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("home");
  const [currentPage, setCurrentPage] = useState("home");
  const [selectedListing, setSelectedListing] = useState(null);
  const [listings, setListings] = useState(mockListings);
  const [filteredListings, setFilteredListings] = useState(mockListings);
  const [navigationStack, setNavigationStack] = useState(["home"]); // Stack pour navigation hiérarchique

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor="#ffffff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t('app.loading')}</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor="#ffffff" />
        <LoginPage />
      </SafeAreaProvider>
    );
  }

  const toggleLike = (id: string) => {
    const updatedListings = listings.map(listing => 
      listing.id === id 
        ? { ...listing, isLiked: !listing.isLiked }
        : listing
    );
    setListings(updatedListings);
    setFilteredListings(updatedListings);
  };

  const handleSearch = (query: string) => {
    const filtered = listings.filter(listing => 
      listing.title.toLowerCase().includes(query.toLowerCase()) ||
      listing.location.toLowerCase().includes(query.toLowerCase()) ||
      listing.description.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredListings(filtered);
  };

  const handleFilterChange = (filters: string[]) => {
    if (filters.length === 0) {
      setFilteredListings(listings);
    } else {
      const filtered = listings.filter(listing => 
        filters.some(filter => 
          listing.tags.some(tag => tag.toLowerCase().includes(filter.toLowerCase()))
        )
      );
      setFilteredListings(filtered);
    }
  };

  const handleNavigate = (page: string, data?: any) => {
    setNavigationStack(prev => [...prev, page]);
    setCurrentPage(page);
    if (data) {
      setSelectedListing(data);
    }
    
    // Mettre à jour activeTab selon la page
    if (["home", "favorites", "create", "messages", "profile"].includes(page)) {
      setActiveTab(page);
    }
  };

  const handleBack = () => {
    setNavigationStack(prev => {
      const newStack = prev.slice(0, -1);
      const previousPage = newStack[newStack.length - 1] || "home";
      setCurrentPage(previousPage);
      
      // Mettre à jour activeTab
      if (["home", "favorites", "create", "messages", "profile"].includes(previousPage)) {
        setActiveTab(previousPage);
      }
      
      return newStack;
    });
    setSelectedListing(null);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "listing-detail":
        return selectedListing ? (
          <ListingDetailPage
            listing={selectedListing}
            onBack={handleBack}
            onMessage={() => handleNavigate("messages")}
          />
        ) : null;
      
      case "profile":
        return (
          <ProfilePage
            onNavigate={handleNavigate}
          />
        );
      
      case "favorites":
        return (
          <FavoritesPage
            onBack={handleBack}
            allListings={listings}
            onLikeToggle={toggleLike}
            onListingClick={(listing) => handleNavigate("listing-detail", listing)}
          />
        );
      
      case "messages":
        return (
          <MessagesPage
            onBack={handleBack}
          />
        );
      
      case "create":
        return (
          <CreateListingPage
            onBack={handleBack}
          />
        );
      
      case "my-listings":
        return (
          <MyListingsPage
            onBack={handleBack}
            onCreateListing={() => handleNavigate("create")}
          />
        );
      
      case "guard-history":
        return (
          <GuardHistoryPage
            onBack={handleBack}
          />
        );
      
      case "reviews":
        return (
          <ReviewsPage
            onBack={handleBack}
          />
        );
      
      case "subscription":
        return (
          <SubscriptionPage
            onBack={handleBack}
          />
        );
      
      case "payments":
        return (
          <PaymentsPage
            onBack={handleBack}
          />
        );
      
      case "advanced-settings":
        return (
          <AdvancedSettingsPage
            onBack={handleBack}
          />
        );
      
      case "edit-profile":
        return (
          <EditProfilePage
            onBack={handleBack}
          />
        );
      
      default:
        return (
          <SearchPage
            listings={filteredListings}
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            onListingClick={(listing) => handleNavigate("listing-detail", listing)}
            onLikeToggle={toggleLike}
          />
        );
    }
  };

  // Main app content - only shown when authenticated
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor="#ffffff" />
      <View style={styles.container}>
        <View style={styles.content}>
          {renderCurrentPage()}
        </View>
        
        {/* Bottom Navigation - TOUJOURS VISIBLE */}
        <View style={styles.bottomNav}>
          {[
            { id: "home", label: t('nav.search'), icon: "Search" },
            { id: "favorites", label: t('nav.favorites'), icon: "heart-outline" },
            { id: "create", label: t('nav.create'), icon: "add-outline" },
            { id: "messages", label: t('nav.messages'), icon: "chatbubble" },
            { id: "profile", label: t('nav.profile'), icon: "person" },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              onPress={() => {
                setActiveTab(tab.id);
                if (tab.id === "home") {
                  setCurrentPage("home");
                  setSelectedListing(null);
                } else {
                  handleNavigate(tab.id);
                }
              }}
              style={styles.tabButton}
            >
              <View style={styles.tabContent}>
                {tab.id === "create" ? (
                  <View style={[
                    styles.createButton,
                    { backgroundColor: activeTab === tab.id ? theme.colors.primary : theme.colors.muted }
                  ]}>
                    <Icon 
                      name={tab.icon as any} 
                      size={16} 
                      color={activeTab === tab.id ? "#ffffff" : theme.colors.mutedForeground}
                    />
                  </View>
                ) : (
                  <Icon 
                    name={tab.icon as any} 
                    size={20} 
                    color={activeTab === tab.id ? theme.colors.primary : theme.colors.mutedForeground}
                  />
                )}
                <Text style={[
                  styles.tabLabel,
                  { color: activeTab === tab.id ? theme.colors.primary : theme.colors.mutedForeground }
                ]}>
                  {tab.label}
                </Text>
              </View>
            </Button>
          ))}
        </View>
      </View>
    </SafeAreaProvider>
  );
}

// Root App Component with AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
    paddingBottom: 34, // Safe area bottom
    paddingTop: theme.spacing.md,
  },
  tabButton: {
    flex: 1,
    height: 'auto',
    paddingVertical: theme.spacing.xs,
  },
  tabContent: {
    alignItems: 'center',
    gap: 4,
  },
  createButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  tabLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
  },
  placeholderPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  placeholderTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
});
