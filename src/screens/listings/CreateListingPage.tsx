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
import { buildDataUri, mapUrisToImagePayload, normalizeImageList } from '../../utils/imageUtils';
import { useTranslation } from 'react-i18next';

interface CreateListingPageProps {
  onBack: () => void;
  listingId?: string;
  showBackButton?: boolean;
}

export function CreateListingPage({ onBack, listingId, showBackButton = true }: CreateListingPageProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { createAnnouncement, updateAnnouncement, getAnnouncementById } = useAnnouncementsApi();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [originalStatus, setOriginalStatus] = useState<AnnouncementPayload['status'] | undefined>(undefined);
  
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
    { id: "homeCare", apiLabel: "Home Care", labelKey: "createListing.guardTypes.homeCare", descKey: "createListing.guardTypes.homeCareDesc" },
    { id: "medicalCare", apiLabel: "Medical Care", labelKey: "createListing.guardTypes.medicalCare", descKey: "createListing.guardTypes.medicalCareDesc" },
    { id: "companionship", apiLabel: "Companionship", labelKey: "createListing.guardTypes.companionship", descKey: "createListing.guardTypes.companionshipDesc" },
    { id: "mealPreparation", apiLabel: "Meal Preparation", labelKey: "createListing.guardTypes.mealPreparation", descKey: "createListing.guardTypes.mealPreparationDesc" },
    { id: "transportation", apiLabel: "Transportation", labelKey: "createListing.guardTypes.transportation", descKey: "createListing.guardTypes.transportationDesc" },
    { id: "housekeeping", apiLabel: "Housekeeping", labelKey: "createListing.guardTypes.housekeeping", descKey: "createListing.guardTypes.housekeepingDesc" },
    { id: "personalCare", apiLabel: "Personal Care", labelKey: "createListing.guardTypes.personalCare", descKey: "createListing.guardTypes.personalCareDesc" },
    { id: "medicationManagement", apiLabel: "Medication Management", labelKey: "createListing.guardTypes.medicationManagement", descKey: "createListing.guardTypes.medicationManagementDesc" },
    { id: "physicalTherapy", apiLabel: "Physical Therapy", labelKey: "createListing.guardTypes.physicalTherapy", descKey: "createListing.guardTypes.physicalTherapyDesc" },
    { id: "nursingCare", apiLabel: "Nursing Care", labelKey: "createListing.guardTypes.nursingCare", descKey: "createListing.guardTypes.nursingCareDesc" },
  ];

  const frequencyOptions = [
    { value: "1 fois par jour", labelKey: "createListing.frequencyOptions.oncePerDay" },
    { value: "2 fois par jour", labelKey: "createListing.frequencyOptions.twicePerDay" },
    { value: "3 fois par jour", labelKey: "createListing.frequencyOptions.threeTimesPerDay" },
    { value: "1 jour sur 2", labelKey: "createListing.frequencyOptions.everyOtherDay" },
    { value: "1 fois par semaine", labelKey: "createListing.frequencyOptions.oncePerWeek" },
    { value: "2-3 fois par semaine", labelKey: "createListing.frequencyOptions.twoThreePerWeek" },
    { value: "Présence continue", labelKey: "createListing.frequencyOptions.continuous" },
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
            photos: normalizeImageList(announcement.publicImages),
            privatePhotos: normalizeImageList(announcement.specificImages),
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
        alert(t('createListing.errors.errorLoading'));
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
          t('createListing.errors.permissionRequired'),
          t('createListing.errors.needPhotoPermission'),
          [{ text: t('common.ok') }]
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
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        if (!asset.base64) {
          Alert.alert('Erreur', 'Impossible de traiter cette image. Veuillez réessayer.');
          return;
        }

        const imageUri = buildDataUri(asset.base64, asset.mimeType);

        if (!imageUri) {
          Alert.alert('Erreur', 'Format de fichier non supporté.');
          return;
        }

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
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        if (!asset.base64) {
          Alert.alert(t('common.error'), t('createListing.errors.errorProcessingImage'));
          return;
        }

        const imageUri = buildDataUri(asset.base64, asset.mimeType);

        if (!imageUri) {
          Alert.alert(t('common.error'), t('createListing.errors.unsupportedFormat'));
          return;
        }

        setFormData(prev => ({
          ...prev,
          privatePhotos: [...prev.privatePhotos, imageUri]
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('common.error'), t('createListing.errors.errorSelectingImage'));
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
      alert(t('createListing.errors.fillRequired'));
      return;
    }

    try {
      setIsSubmitting(true);

      // Map local form data to API expected shape
      const selectedCareTypes = guardTypes
        .filter((t) => (formData as any)[t.id])
        .map((t) => t.apiLabel);

      // Backend only accepts a single careTypeLabel, not multiple
      if (selectedCareTypes.length === 0) {
        alert(t('createListing.errors.selectGuardType'));
        return;
      }

      if (selectedCareTypes.length > 1) {
        alert(t('createListing.errors.selectOneGuardType'));
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
      const publicImages = mapUrisToImagePayload(formData.photos);
      const specificImages = mapUrisToImagePayload(formData.privatePhotos);

      const startDate = toIsoDate(formData.startDate);
      if (!startDate) {
        alert(t('createListing.errors.validStartDate'));
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
          alert(t('createListing.errors.successUpdated'));
          onBack();
        }
      } else {
        // Create new announcement
        console.log('Creating announcement with payload (API format):', apiPayload);
        const result = await createAnnouncement(apiPayload);
        
        if (result) {
          console.log('Annonce créée avec succès:', result);
          alert(t('createListing.errors.successCreated'));
          onBack();
        }
      }
    } catch (error) {
      console.error(listingId ? 'Error updating announcement:' : 'Error creating announcement:', error);
      alert(listingId ? t('createListing.errors.errorUpdating') : t('createListing.errors.errorCreating'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && listingId) {
    return (
      <View style={styles.container}>
        <PageHeader 
          title={listingId ? t('createListing.editTitle') : t('createListing.title')}
          icon={listingId ? "create" : "add"}
          showBackButton={showBackButton}
          onBack={onBack}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t('createListing.loading')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader 
        title={listingId ? t('createListing.editTitle') : t('createListing.title')}
        icon={listingId ? "create" : "add"}
        showBackButton={showBackButton}
        onBack={onBack}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Card style={styles.sectionCard}>
          <CardContent>
            <Label required>{t('createListing.sections.title')}</Label>
            <Input
              placeholder={t('createListing.sections.titlePlaceholder')}
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
            />
          </CardContent>
        </Card>

        {/* Location */}
        <Card style={styles.sectionCard}>
          <CardContent>
            <Label required>{t('createListing.sections.location')}</Label>
            <View style={styles.locationInputWrapper}>
              <Icon name="MapPin" size={16} color={theme.colors.mutedForeground} style={styles.locationIcon} />
              <Input
                placeholder={t('createListing.sections.locationPlaceholder')}
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
            <Label>{t('createListing.sections.guardType')}</Label>
            <View style={styles.guardTypeList}>
              {guardTypes.map((type) => (
                <View key={type.id} style={styles.guardTypeItem}>
                  <View style={styles.guardTypeContent}>
                    <Text style={styles.guardTypeLabel}>
                      {t(type.labelKey)}
                    </Text>
                    <Text style={styles.guardTypeDescription}>
                      {t(type.descKey)}
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
            <Label>{t('createListing.sections.period')}</Label>
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Label style={styles.dateLabel} required>{t('createListing.sections.startDate')}</Label>
                <DatePicker
                  value={formData.startDate}
                  onDateChange={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                  placeholder={t('createListing.sections.selectDate')}
                  minimumDate={new Date()}
                />
              </View>
              <View style={styles.dateField}>
                <Label style={styles.dateLabel}>{t('createListing.sections.endDate')}</Label>
                <DatePicker
                  value={formData.endDate}
                  onDateChange={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                  placeholder={t('createListing.sections.selectDate')}
                  minimumDate={formData.startDate ? new Date(formData.startDate + 'T00:00:00') : new Date()}
                />
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Frequency */}
        <Card style={styles.sectionCard}>
          <CardContent>
            <Label>{t('createListing.sections.frequency')}</Label>
            <View style={styles.frequencyWrapper}>
              <Icon name="Clock" size={16} color={theme.colors.mutedForeground} style={styles.frequencyIcon} />
              <Select
                value={formData.frequency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
                placeholder={t('createListing.sections.selectFrequency')}
                options={frequencyOptions.map(opt => ({ value: opt.value, label: t(opt.labelKey) }))}
                style={styles.frequencySelect}
              />
            </View>
            <Text style={styles.helpText}>
              {t('createListing.sections.frequencyHelp')}
            </Text>
          </CardContent>
        </Card>

        {/* Price */}
        <Card style={styles.sectionCard}>
          <CardContent>
            <Label required>{t('createListing.sections.price')}</Label>
            <View style={styles.priceWrapper}>
              <Icon name="Euro" size={16} color={theme.colors.mutedForeground} style={styles.priceIcon} />
              <Input
                placeholder={t('createListing.sections.pricePlaceholder')}
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
              <Text style={styles.priceSuffix}>{t('createListing.sections.perDay')}</Text>
            </View>
          </CardContent>
        </Card>

        {/* Description */}
        <Card style={styles.sectionCard}>
          <CardContent>
            <Label>{t('createListing.sections.description')}</Label>
            <Textarea
              placeholder={t('createListing.sections.descriptionPlaceholder')}
              rows={4}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            />
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card style={styles.sectionCard}>
          <CardContent>
            <Label>{t('createListing.sections.instructions')}</Label>
            <Textarea
              placeholder={t('createListing.sections.instructionsPlaceholder')}
              rows={4}
              value={formData.instructions}
              onChangeText={(text) => setFormData(prev => ({ ...prev, instructions: text }))}
            />
          </CardContent>
        </Card>

        {/* Public Photos */}
        <Card style={styles.sectionCard}>
          <CardContent>
            <Label>{t('createListing.sections.publicPhotos')}</Label>
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
                <Text style={styles.addPhotoText}>{t('createListing.actions.add')}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helpText}>
              {t('createListing.sections.publicPhotosHelp')}
            </Text>
          </CardContent>
        </Card>

        {/* Private Photos */}
        <Card style={styles.sectionCard}>
          <CardContent>
            <View style={styles.privatePhotosHeader}>
              <Icon name="ShieldCheckmark" size={16} color={theme.colors.mutedForeground} />
              <Label>{t('createListing.sections.privatePhotos')}</Label>
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
                <Text style={styles.addPhotoText}>{t('createListing.actions.add')}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helpText}>
              {t('createListing.sections.privatePhotosHelp')}
            </Text>
          </CardContent>
        </Card>

        {/* Additional Options */}
        <Card style={styles.sectionCard}>
          <CardContent>
            <Label>{t('createListing.sections.additionalOptions')}</Label>
            <View style={styles.optionsList}>
              <View style={styles.optionItem}>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{t('createListing.sections.idVerification')}</Text>
                  <Text style={styles.optionDescription}>{t('createListing.sections.idVerificationDesc')}</Text>
                </View>
                <Switch 
                  value={formData.requiresIdVerification} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, requiresIdVerification: value }))}
                />
              </View>
              <View style={styles.optionItem}>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{t('createListing.sections.emergency')}</Text>
                  <Text style={styles.optionDescription}>{t('createListing.sections.emergencyDesc')}</Text>
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
                  {listingId ? t('createListing.actions.updating') : t('createListing.actions.publishing')}
                </Text>
              </>
            ) : (
              <>
                <Icon name="Send" size={16} color={theme.colors.primaryForeground} />
                <Text style={styles.submitButtonText}>
                  {listingId ? t('createListing.actions.update') : t('createListing.actions.publish')}
                </Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.submitHelpText}>
            {listingId ? t('createListing.actions.willBeApplied') : t('createListing.actions.willBeVisible')}
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
