import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Label } from '../../components/ui/Label';
import { Icon } from '../../components/ui/Icon';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';
import { theme } from '../../styles/theme';

interface EditProfilePageProps {
  onBack: () => void;
}

export function EditProfilePage({ onBack }: EditProfilePageProps) {
  const [profile, setProfile] = useState({
    firstName: "Sophie",
    lastName: "Martin",
    email: "sophie.martin@example.com",
    phone: "+33 6 12 34 56 78",
    bio: "Passionnée d'animaux et de plantes, j'adore prendre soin des compagnons de vos amis à quatre pattes et de vos plantes vertes. Expérience de 3 ans dans la garde d'animaux.",
    location: "Paris, France",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b65c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    languages: ["Français", "Anglais"],
    skills: ["Chiens", "Chats", "Plantes d'intérieur", "Arrosage"],
    availability: "Weekends et vacances scolaires",
    priceRange: "20-50€ par jour"
  });

  const [notifications, setNotifications] = useState({
    messages: true,
    bookings: true,
    marketing: false,
    reviews: true
  });

  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    phoneVisible: false,
    emailVisible: false,
    locationVisible: true
  });

  const handleSave = () => {
    // Save profile logic
    console.log('Saving profile...', profile);
    onBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modifier le profil</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>Sauver</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Photo */}
        <Card style={styles.photoCard}>
          <CardContent style={styles.photoContent}>
            <View style={styles.photoSection}>
              <ImageWithFallback
                src={profile.avatar}
                style={styles.profilePhoto}
                alt={`${profile.firstName} ${profile.lastName}`}
              />
              <View style={styles.photoActions}>
                <Button variant="outline" size="sm" style={styles.photoButton}>
                  <Icon name="camera" size={16} color={theme.colors.primary} />
                  <Text style={styles.photoButtonText}>Changer la photo</Text>
                </Button>
                <Button variant="ghost" size="sm" style={styles.removeButton}>
                  <Text style={styles.removeButtonText}>Supprimer</Text>
                </Button>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card style={styles.sectionCard}>
          <CardContent style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Informations personnelles</Text>
            
            <View style={styles.inputRow}>
              <View style={styles.halfInput}>
                <Label>Prénom</Label>
                <Input
                  value={profile.firstName}
                  onChangeText={(text) => setProfile(prev => ({ ...prev, firstName: text }))}
                  placeholder="Prénom"
                />
              </View>
              <View style={styles.halfInput}>
                <Label>Nom</Label>
                <Input
                  value={profile.lastName}
                  onChangeText={(text) => setProfile(prev => ({ ...prev, lastName: text }))}
                  placeholder="Nom"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Label>Email</Label>
              <Input
                value={profile.email}
                onChangeText={(text) => setProfile(prev => ({ ...prev, email: text }))}
                placeholder="Email"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Label>Téléphone</Label>
              <Input
                value={profile.phone}
                onChangeText={(text) => setProfile(prev => ({ ...prev, phone: text }))}
                placeholder="Téléphone"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Label>Localisation</Label>
              <Input
                value={profile.location}
                onChangeText={(text) => setProfile(prev => ({ ...prev, location: text }))}
                placeholder="Ville, Pays"
              />
            </View>
          </CardContent>
        </Card>

        {/* Bio */}
        <Card style={styles.sectionCard}>
          <CardContent style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>À propos de moi</Text>
            <View style={styles.inputGroup}>
              <Label>Description</Label>
              <Textarea
                value={profile.bio}
                onChangeText={(text) => setProfile(prev => ({ ...prev, bio: text }))}
                placeholder="Parlez-nous de vous, de votre expérience..."
                numberOfLines={4}
              />
              <Text style={styles.charCount}>{profile.bio.length}/500 caractères</Text>
            </View>
          </CardContent>
        </Card>

        {/* Skills & Availability */}
        <Card style={styles.sectionCard}>
          <CardContent style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Compétences et disponibilité</Text>
            
            <View style={styles.inputGroup}>
              <Label>Langues parlées</Label>
              <Input
                value={profile.languages.join(', ')}
                onChangeText={(text) => setProfile(prev => ({ 
                  ...prev, 
                  languages: text.split(',').map(lang => lang.trim()) 
                }))}
                placeholder="Français, Anglais, Espagnol..."
              />
            </View>

            <View style={styles.inputGroup}>
              <Label>Spécialisations</Label>
              <Input
                value={profile.skills.join(', ')}
                onChangeText={(text) => setProfile(prev => ({ 
                  ...prev, 
                  skills: text.split(',').map(skill => skill.trim()) 
                }))}
                placeholder="Chiens, Chats, Plantes..."
              />
            </View>

            <View style={styles.inputGroup}>
              <Label>Disponibilité</Label>
              <Input
                value={profile.availability}
                onChangeText={(text) => setProfile(prev => ({ ...prev, availability: text }))}
                placeholder="Weekends, Vacances scolaires..."
              />
            </View>

            <View style={styles.inputGroup}>
              <Label>Tarifs</Label>
              <Input
                value={profile.priceRange}
                onChangeText={(text) => setProfile(prev => ({ ...prev, priceRange: text }))}
                placeholder="20-50€ par jour"
              />
            </View>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card style={styles.sectionCard}>
          <CardContent style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Confidentialité</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingText}>Profil visible publiquement</Text>
                <Text style={styles.settingDescription}>Votre profil apparaît dans les recherches</Text>
              </View>
              <Switch
                value={privacy.profileVisible}
                onValueChange={(value) => setPrivacy(prev => ({ ...prev, profileVisible: value }))}
                trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                thumbColor={privacy.profileVisible ? '#ffffff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingText}>Téléphone visible</Text>
                <Text style={styles.settingDescription}>Afficher votre numéro sur votre profil</Text>
              </View>
              <Switch
                value={privacy.phoneVisible}
                onValueChange={(value) => setPrivacy(prev => ({ ...prev, phoneVisible: value }))}
                trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                thumbColor={privacy.phoneVisible ? '#ffffff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingText}>Email visible</Text>
                <Text style={styles.settingDescription}>Afficher votre email sur votre profil</Text>
              </View>
              <Switch
                value={privacy.emailVisible}
                onValueChange={(value) => setPrivacy(prev => ({ ...prev, emailVisible: value }))}
                trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                thumbColor={privacy.emailVisible ? '#ffffff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingText}>Localisation visible</Text>
                <Text style={styles.settingDescription}>Afficher votre ville sur votre profil</Text>
              </View>
              <Switch
                value={privacy.locationVisible}
                onValueChange={(value) => setPrivacy(prev => ({ ...prev, locationVisible: value }))}
                trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                thumbColor={privacy.locationVisible ? '#ffffff' : '#f4f3f4'}
              />
            </View>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card style={styles.sectionCard}>
          <CardContent style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingText}>Messages</Text>
                <Text style={styles.settingDescription}>Recevoir les notifications de nouveaux messages</Text>
              </View>
              <Switch
                value={notifications.messages}
                onValueChange={(value) => setNotifications(prev => ({ ...prev, messages: value }))}
                trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                thumbColor={notifications.messages ? '#ffffff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingText}>Réservations</Text>
                <Text style={styles.settingDescription}>Alertes pour les nouvelles demandes de garde</Text>
              </View>
              <Switch
                value={notifications.bookings}
                onValueChange={(value) => setNotifications(prev => ({ ...prev, bookings: value }))}
                trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                thumbColor={notifications.bookings ? '#ffffff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingText}>Avis et évaluations</Text>
                <Text style={styles.settingDescription}>Notifications lors de nouveaux avis</Text>
              </View>
              <Switch
                value={notifications.reviews}
                onValueChange={(value) => setNotifications(prev => ({ ...prev, reviews: value }))}
                trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                thumbColor={notifications.reviews ? '#ffffff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingText}>Marketing</Text>
                <Text style={styles.settingDescription}>Promotions et nouvelles fonctionnalités</Text>
              </View>
              <Switch
                value={notifications.marketing}
                onValueChange={(value) => setNotifications(prev => ({ ...prev, marketing: value }))}
                trackColor={{ false: theme.colors.muted, true: theme.colors.primary }}
                thumbColor={notifications.marketing ? '#ffffff' : '#f4f3f4'}
              />
            </View>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card style={[styles.sectionCard, styles.dangerCard]}>
          <CardContent style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Zone de danger</Text>
            
            <TouchableOpacity style={styles.dangerAction}>
              <Text style={styles.dangerText}>Désactiver temporairement mon compte</Text>
              <Icon name="chevron-forward" size={20} color="#ef4444" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.dangerAction}>
              <Text style={styles.dangerText}>Supprimer définitivement mon compte</Text>
              <Icon name="chevron-forward" size={20} color="#ef4444" />
            </TouchableOpacity>
          </CardContent>
        </Card>

        {/* Save Button */}
        <View style={styles.saveSection}>
          <Button onPress={handleSave} style={styles.saveButtonLarge}>
            <Text style={styles.saveButtonText}>Sauvegarder les modifications</Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
  },
  saveButton: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  scrollView: {
    flex: 1,
  },
  photoCard: {
    margin: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  photoContent: {
    padding: theme.spacing.xl,
  },
  photoSection: {
    alignItems: 'center',
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: theme.spacing.lg,
  },
  photoActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  photoButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
  },
  removeButton: {
    // No additional styles needed
  },
  removeButtonText: {
    color: '#ef4444',
    fontSize: theme.fontSize.sm,
  },
  sectionCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  dangerCard: {
    borderColor: '#fecaca',
  },
  sectionContent: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.lg,
  },
  inputRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  charCount: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
    textAlign: 'right',
    marginTop: theme.spacing.xs,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingLeft: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  settingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  settingDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  dangerAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
  },
  dangerText: {
    fontSize: theme.fontSize.md,
    color: '#ef4444',
  },
  saveSection: {
    padding: theme.spacing.lg,
    paddingBottom: 120, // Space for bottom nav
  },
  saveButtonLarge: {
    width: '100%',
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: theme.fontWeight.medium,
  },
});