import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Label } from '../../components/ui/Label';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { Icon } from '../../components/ui/Icon';
import { PageHeader } from '../../components/ui/PageHeader';
import { Switch } from '../../components/ui/Switch';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';
import { DatePicker } from '../../components/ui/DatePicker';
import { theme } from '../../styles/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useAnnouncementsApi } from '../../hooks/api/useAnnouncementsApi';
import { AnnouncementPayload } from '../../types/api';

interface CreateListingPageProps {
  onBack: () => void;
  listingId?: string;
}

export function CreateListingPage({ onBack, listingId }: CreateListingPageProps) {
  const { user } = useAuth();
  const { createAnnouncement, updateAnnouncement, getAnnouncementById } = useAnnouncementsApi();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [originalStatus, setOriginalStatus] = useState<string | undefined>(undefined);
  
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    startDate: "",
    endDate: "",
    price: "",
    frequency: "",
    description: "",
    instructions: "",
    photos: [] as string[],
    privatePhotos: [] as string[],
    // Care type selections (dynamically added based on guardTypes)
    homeCare: false,
    medicalCare: false,
    companionship: false,
    mealPreparation: false,
    transportation: false,
    housekeeping: false,
    personalCare: false,
    medicationManagement: false,
    physicalTherapy: false,
    nursingCare: false,
    requiresIdVerification: false,
    availableForEmergency: false,
  });

  const guardTypes = [
    { id: "homeCare", label: "Home Care", description: "Soins à domicile et assistance quotidienne" },
    { id: "medicalCare", label: "Medical Care", description: "Soins médicaux et suivi de santé" },
    { id: "companionship", label: "Companionship", description: "Accompagnement et compagnie" },
    { id: "mealPreparation", label: "Meal Preparation", description: "Préparation des repas" },
    { id: "transportation", label: "Transportation", description: "Transport et déplacements" },
    { id: "housekeeping", label: "Housekeeping", description: "Ménage et entretien du domicile" },
    { id: "personalCare", label: "Personal Care", description: "Soins personnels et hygiène" },
    { id: "medicationManagement", label: "Medication Management", description: "Gestion des médicaments" },
    { id: "physicalTherapy", label: "Physical Therapy", description: "Kinésithérapie et rééducation" },
    { id: "nursingCare", label: "Nursing Care", description: "Soins infirmiers" },
  ];

  const frequencyOptions = [
    { value: "1 fois par jour", label: "1 fois par jour" },
    { value: "2 fois par jour", label: "2 fois par jour" },
    { value: "3 fois par jour", label: "3 fois par jour" },
    { value: "1 jour sur 2", label: "1 jour sur 2" },
    { value: "1 fois par semaine", label: "1 fois par semaine" },
    { value: "2-3 fois par semaine", label: "2-3 fois par semaine" },
    { value: "Présence continue", label: "Présence continue" },
  ];

  // Load announcement data if editing
  useEffect(() => {
    const loadAnnouncement = async () => {
      if (!listingId) return;

      try {
        setIsLoading(true);
        const announcement = await getAnnouncementById(Number(listingId));
        
        if (announcement) {
          // Store original status to preserve it during edit
          setOriginalStatus(announcement.status);
          
          // Map API response to form data
          setFormData({
            title: announcement.title || "",
            location: announcement.location || "",
            startDate: announcement.startDate ? announcement.startDate.split('T')[0] : "",
            endDate: announcement.endDate ? announcement.endDate.split('T')[0] : "",
            price: announcement.remuneration?.toString() || "",
            frequency: announcement.visitFrequency || "",
            description: announcement.description || "",
            instructions: announcement.specificInstructions || "",
            photos: announcement.publicImages?.map(img => img.imageUrl) || [],
            privatePhotos: announcement.specificImages?.map(img => img.imageUrl) || [],
            // Map care type
            homeCare: announcement.careTypeLabel === "Home Care",
            medicalCare: announcement.careTypeLabel === "Medical Care",
            companionship: announcement.careTypeLabel === "Companionship",
            mealPreparation: announcement.careTypeLabel === "Meal Preparation",
            transportation: announcement.careTypeLabel === "Transportation",
            housekeeping: announcement.careTypeLabel === "Housekeeping",
            personalCare: announcement.careTypeLabel === "Personal Care",
            medicationManagement: announcement.careTypeLabel === "Medication Management",
            physicalTherapy: announcement.careTypeLabel === "Physical Therapy",
            nursingCare: announcement.careTypeLabel === "Nursing Care",
            requiresIdVerification: announcement.identityVerificationRequired || false,
            availableForEmergency: announcement.urgentRequest || false,
          });
        }
      } catch (error) {
        console.error('Error loading announcement:', error);
        alert('Erreur lors du chargement de l\'annonce');
      } finally {
        setIsLoading(false);
      }
    };

    loadAnnouncement();
  }, [listingId, getAnnouncementById]);


  const requestMediaLibraryPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'Nous avons besoin de votre permission pour accéder à vos photos.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    return true;
  };

  const addPhoto = async () => {
    const hasPermission = await requestMediaLibraryPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, imageUri]
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const addPrivatePhoto = async () => {
    const hasPermission = await requestMediaLibraryPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setFormData(prev => ({
          ...prev,
          privatePhotos: [...prev.privatePhotos, imageUri]
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const removePrivatePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      privatePhotos: prev.privatePhotos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!user?.username) {
      console.error('User not authenticated');
      return;
    }

    // Validation
    if (!formData.title || !formData.location || !formData.startDate || !formData.price) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setIsSubmitting(true);

      // Map local form data to API expected shape
      const selectedCareTypes = guardTypes
        .filter((t) => (formData as any)[t.id])
        .map((t) => t.label);

      // Backend only accepts a single careTypeLabel, not multiple
      if (selectedCareTypes.length === 0) {
        alert('Veuillez sélectionner au moins un type de garde');
        return;
      }

      if (selectedCareTypes.length > 1) {
        alert('Veuillez sélectionner un seul type de garde. Seul le premier sera utilisé.');
      }

      // DatePicker already returns dates in YYYY-MM-DD format
      const toIsoDate = (input: string): string | undefined => {
        if (!input) return undefined;
        // DatePicker returns YYYY-MM-DD format, so we can use it directly
        if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
          return input;
        }
        return undefined;
      };

      // Convert photo URLs to ImageDto format
      const publicImages = formData.photos.length > 0 
        ? formData.photos.map(imageUrl => ({ imageUrl }))
        : undefined;
      
      const specificImages = formData.privatePhotos.length > 0
        ? formData.privatePhotos.map(imageUrl => ({ imageUrl }))
        : undefined;

      const startDate = toIsoDate(formData.startDate);
      if (!startDate) {
        alert('Veuillez entrer une date de début valide (format: JJ/MM/AAAA)');
        return;
      }

      const apiPayload: AnnouncementPayload = {
        ownerUsername: user.username,
        title: formData.title,
        location: formData.location,
        description: formData.description || '',
        specificInstructions: formData.instructions || undefined,
        careTypeLabel: selectedCareTypes[0], // Backend only accepts a single care type label
        startDate: startDate,
        endDate: toIsoDate(formData.endDate),
        visitFrequency: formData.frequency || undefined,
        remuneration: parseFloat(formData.price) || 0,
        identityVerificationRequired: formData.requiresIdVerification || false,
        urgentRequest: formData.availableForEmergency || false,
        status: listingId ? originalStatus : 'PUBLISHED', // Preserve status when editing
        publicImages: publicImages,
        specificImages: specificImages,
      };

      if (listingId) {
        // Update existing announcement
        console.log('Updating announcement with payload (API format):', apiPayload);
        const result = await updateAnnouncement(Number(listingId), apiPayload);
        
        if (result) {
          console.log('Annonce mise à jour avec succès:', result);
          alert('Annonce mise à jour avec succès!');
          onBack();
        }
      } else {
        // Create new announcement
        console.log('Creating announcement with payload (API format):', apiPayload);
        const result = await createAnnouncement(apiPayload);
        
        if (result) {
          console.log('Annonce créée avec succès:', result);
          alert('Annonce créée avec succès!');
          onBack();
        }
      }
    } catch (error) {
      console.error(listingId ? 'Erreur lors de la mise à jour de l\'annonce:' : 'Erreur lors de la création de l\'annonce:', error);
      alert(listingId ? 'Erreur lors de la mise à jour de l\'annonce' : 'Erreur lors de la création de l\'annonce');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && listingId) {
    return (
      <View style={styles.container}>
        <PageHeader 
          title={listingId ? "Modifier l'annonce" : "Créer une annonce"}
          icon={listingId ? "create" : "add"}
          showBackButton={true}
          onBack={onBack}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement de l'annonce...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader 
        title={listingId ? "Modifier l'annonce" : "Créer une annonce"}
        icon={listingId ? "create" : "add"}
        showBackButton={true}
        onBack={onBack}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Card style={styles.sectionCard}>
          <CardContent>
            <Label required>Titre de l'annonce</Label>
            <Input
              placeholder="Ex: Garde de mes 2 chats pendant les vacances"
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
            />
          </CardContent>
        </Card>

        {/* Location */}
        <Card style={styles.sectionCard}>
          <CardContent>
            <Label required>Localisation</Label>
            <View style={styles.locationInputWrapper}>
              <Icon name="MapPin" size={16} color={theme.colors.mutedForeground} style={styles.locationIcon} />
              <Input
                placeholder="Adresse ou ville"
                style={styles.locationInput}
                value={formData.location}
                onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
              />
            </View>
          </CardContent>
        </Card>

        {/* Guard Type */}
        <Card style={styles.sectionCard}>
          <CardContent>
            <Label>Type de garde demandée</Label>
            <View style={styles.guardTypeList}>
              {guardTypes.map((type) => (
                <View key={type.id} style={styles.guardTypeItem}>
                  <View style={styles.guardTypeContent}>
                    <Text style={styles.guardTypeLabel}>
                      {type.label}
                    </Text>
                    <Text style={styles.guardTypeDescription}>
                      {type.description}
                    </Text>
                  </View>
                  <Switch 
                    value={formData[type.id as keyof typeof formData] as boolean} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, [type.id]: value }))}
                  />
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card style={styles.sectionCard}>
          <CardContent>
            <Label>Période de garde</Label>
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Label style={styles.dateLabel} required>Date de début</Label>
                <DatePicker
                  value={formData.startDate}
                  onDateChange={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                  placeholder="Sélectionner une date"
                  minimumDate={new Date()}
                />
              </View>
              <View style={styles.dateField}>
                <Label style={styles.dateLabel}>Date de fin</Label>
                <DatePicker
                  value={formData.endDate}
                  onDateChange={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                  placeholder="Sélectionner une date"
                  minimumDate={formData.startDate ? new Date(formData.startDate + 'T00:00:00') : new Date()}
                />
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Frequency */}
        <Card style={styles.sectionCard}>
          <CardContent>
            <Label>Fréquence de visite requise</Label>
            <View style={styles.frequencyWrapper}>
              <Icon name="Clock" size={16} color={theme.colors.mutedForeground} style={styles.frequencyIcon} />
              <Select
                value={formData.frequency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
                placeholder="Sélectionner la fréquence"
                options={frequencyOptions}
                style={styles.frequencySelect}
              />
            </View>
            <Text style={styles.helpText}>
              À quelle fréquence le gardien doit-il venir pendant votre absence ?
            </Text>
          </CardContent>
        </Card>

        {/* Price */}
        <Card style={styles.sectionCard}>
          <CardContent>
            <Label required>Rémunération proposée</Label>
            <View style={styles.priceWrapper}>
              <Icon name="Euro" size={16} color={theme.colors.mutedForeground} style={styles.priceIcon} />
              <Input
                placeholder="0"
                keyboardType="decimal-pad"
                style={styles.priceInput}
                value={formData.price}
                onChangeText={(text) => {
                  // Only allow numbers and one decimal point
                  const cleaned = text.replace(/[^0-9.]/g, '');
                  // Ensure only one decimal point
                  const parts = cleaned.split('.');
                  const formatted = parts.length > 2 
                    ? parts[0] + '.' + parts.slice(1).join('')
                    : cleaned;
                  setFormData(prev => ({ ...prev, price: formatted }));
                }}
              />
              <Text style={styles.priceSuffix}>/jour</Text>
            </View>
          </CardContent>
        </Card>

        {/* Description */}
        <Card style={styles.sectionCard}>
          <CardContent>
            <Label>Description</Label>
            <Textarea
              placeholder="Décrivez votre demande, votre logement, vos animaux/plantes..."
              rows={4}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            />
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card style={styles.sectionCard}>
          <CardContent>
            <Label>Consignes spécifiques</Label>
            <Textarea
              placeholder="Instructions détaillées, horaires d'alimentation, contacts vétérinaire..."
              rows={4}
              value={formData.instructions}
              onChangeText={(text) => setFormData(prev => ({ ...prev, instructions: text }))}
            />
          </CardContent>
        </Card>

        {/* Public Photos */}
        <Card style={styles.sectionCard}>
          <CardContent>
            <Label>Photos publiques</Label>
            <View style={styles.photosGrid}>
              {formData.photos.map((photo, index) => (
                <View key={index} style={styles.photoItem}>
                  <ImageWithFallback
                    source={{ uri: photo }}
                    style={styles.photoImage}
                  />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto(index)}
                  >
                    <Icon name="Close" size={12} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={addPhoto}
              >
                <Icon name="Plus" size={20} color={theme.colors.foreground} />
                <Text style={styles.addPhotoText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helpText}>
              Photos visibles par tous les gardiens pour présenter votre annonce
            </Text>
          </CardContent>
        </Card>

        {/* Private Photos */}
        <Card style={styles.sectionCard}>
          <CardContent>
            <View style={styles.privatePhotosHeader}>
              <Icon name="ShieldCheckmark" size={16} color={theme.colors.mutedForeground} />
              <Label>Photos d'accès privées</Label>
            </View>
            <View style={styles.photosGrid}>
              {formData.privatePhotos.map((photo, index) => (
                <View key={index} style={styles.photoItem}>
                  <ImageWithFallback
                    source={{ uri: photo }}
                    style={styles.photoImage}
                  />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removePrivatePhoto(index)}
                  >
                    <Icon name="Close" size={12} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={addPrivatePhoto}
              >
                <Icon name="Plus" size={16} color={theme.colors.foreground} />
                <Text style={styles.addPhotoText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helpText}>
              Photos sensibles (codes, clés, accès) révélées uniquement après acceptation de la mission
            </Text>
          </CardContent>
        </Card>

        {/* Additional Options */}
        <Card style={styles.sectionCard}>
          <CardContent>
            <Label>Options supplémentaires</Label>
            <View style={styles.optionsList}>
              <View style={styles.optionItem}>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Vérification d'identité requise</Text>
                  <Text style={styles.optionDescription}>Le gardien devra fournir une pièce d'identité</Text>
                </View>
                <Switch 
                  value={formData.requiresIdVerification} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, requiresIdVerification: value }))}
                />
              </View>
              <View style={styles.optionItem}>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Disponible en urgence</Text>
                  <Text style={styles.optionDescription}>Accepter les demandes de dernière minute</Text>
                </View>
                <Switch 
                  value={formData.availableForEmergency} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, availableForEmergency: value }))}
                />
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity 
            onPress={handleSubmit}
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Text style={styles.submitButtonText}>
                  {listingId ? 'Mise à jour en cours...' : 'Publication en cours...'}
                </Text>
              </>
            ) : (
              <>
                <Icon name="Send" size={16} color={theme.colors.primaryForeground} />
                <Text style={styles.submitButtonText}>
                  {listingId ? 'Mettre à jour l\'annonce' : 'Publier l\'annonce'}
                </Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.submitHelpText}>
            {listingId ? 'Vos modifications seront appliquées immédiatement' : 'Votre annonce sera visible immédiatement'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.foreground,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  sectionCard: {
    marginBottom: theme.spacing.xl,
  },
  locationInputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    position: 'absolute',
    left: theme.spacing.md,
    zIndex: 1,
  },
  locationInput: {
    flex: 1,
    paddingLeft: theme.spacing['3xl'] + theme.spacing.xs,
  },
  guardTypeList: {
    gap: theme.spacing.md,
  },
  guardTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  guardTypeContent: {
    flex: 1,
  },
  guardTypeLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  guardTypeDescription: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  dateRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    fontSize: theme.fontSize.sm,
    marginBottom: theme.spacing.xs,
  },
  dateInputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    position: 'absolute',
    left: theme.spacing.md,
    zIndex: 1,
  },
  dateInput: {
    flex: 1,
    paddingLeft: theme.spacing['3xl'] + theme.spacing.xs,
  },
  frequencyWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  frequencyIcon: {
    position: 'absolute',
    left: theme.spacing.md,
    zIndex: 1,
  },
  frequencySelect: {
    flex: 1,
    paddingLeft: theme.spacing['3xl'] + theme.spacing.xs,
  },
  helpText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.sm,
  },
  priceWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceIcon: {
    position: 'absolute',
    left: theme.spacing.md,
    zIndex: 1,
  },
  priceInput: {
    flex: 1,
    paddingLeft: theme.spacing['3xl'] + theme.spacing.xs,
    paddingRight: theme.spacing['5xl'],
  },
  priceSuffix: {
    position: 'absolute',
    right: theme.spacing.md,
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  photoItem: {
    width: 100,
    height: 100,
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.lg,
  },
  privatePhotoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.destructive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  addPhotoText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.foreground,
  },
  privatePhotosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  optionsList: {
    gap: theme.spacing.lg,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  optionDescription: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  submitContainer: {
    paddingTop: theme.spacing.lg,
    paddingBottom: 100,
    alignItems: 'center',
  },
  submitButton: {
    width: '100%',
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  submitButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primaryForeground,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitHelpText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing['6xl'],
  },
  loadingText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
  },
});
